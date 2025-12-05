/**
 * Main Application Controller
 * Coordinates all modules and handles global functionality
 */

// Import modules (these will be created as separate files)
import { loadFromLocalStorage, saveToLocalStorage, updateAllTabPatientDisplays } from './patient.js';
import { renderVitalsLog, submitVitals, clearVitalsInputs, renderVitalsChart, showVitalInfo, updateVitalIndicator, nowTimestamp } from './vitals.js';
import { renderGcsLog, submitGCS, clearGCSInputs } from './gcs.js';
import { renderNotesLog, addNote, clearNoteInput, setupAudioRecorder } from './notes.js';
import { renderCprLog, renderCprEvents, renderCprTimeline, startCPR, stopCPR, addCprEvent, togglePauseCPR } from './cpr.js';
import { generateResults, showResults, closeResults, copyResults, downloadReport } from './results.js';
import { patientInfo, patientInfoChanged, patientPriorityChanged, addPatient, switchPatient, deletePatient, renderPatientList, updateCurrentPatientDisplay } from './patient.js';


// Global variables
let updateAvailable = false;

/**
 * Initialize the application
 */
function initApp() {
    // Load data from localStorage
    loadFromLocalStorage();
    
    // Render all initial data
    renderVitalsLog();
    renderGcsLog();
    renderNotesLog();
    renderCprLog();
    renderCprEvents();
    renderCprTimeline();
    renderVitalsChart();
    renderPatientList();
    
    // Update UI displays
    updateAllTabPatientDisplays();
    updateCurrentPatientDisplay();

    // Set up event listeners that need to be global
    setupEventListeners();
    
    // Open the first tab by default
    openTab(null, 'patient-info');

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('sw.js').then(registration => {
            window.swRegistration = registration;
            // Check for updates every hour
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          }).catch(()=>{/*sw failed*/});
        });
    }
}

/**
 * Setup various event listeners for inputs
 */
function setupEventListeners() {
    // Listeners for patient info inputs (if needed for continuous save/update)
    document.getElementById('patient-name').addEventListener('input', patientInfoChanged);
    document.getElementById('responder-id').addEventListener('input', patientInfoChanged);
    document.getElementById('incident-type').addEventListener('change', patientInfoChanged);
    document.getElementById('patient-age').addEventListener('input', patientInfoChanged);
    document.getElementById('allergies').addEventListener('input', patientInfoChanged);
    document.getElementById('medication').addEventListener('input', patientInfoChanged);
    document.getElementById('history').addEventListener('input', patientInfoChanged);
    document.getElementById('last-intake').addEventListener('input', patientInfoChanged);
    document.getElementById('signs-symptoms').addEventListener('input', patientInfoChanged);
    document.getElementById('patient-priority').addEventListener('change', patientPriorityChanged);
    document.getElementById('pupils-reactive').addEventListener('change', patientInfoChanged);
    
    // Set up notes audio recorder
    setupAudioRecorder();

    // Close modal when clicking outside of it
    window.onclick = function(event) {
        const vitalModal = document.getElementById('vital-info-modal');
        const resultsModal = document.getElementById('results-modal');
        
        if (event.target === vitalModal) {
            vitalModal.style.display = 'none';
        }
        if (event.target === resultsModal) {
            resultsModal.style.display = 'none';
        }
    };
    
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_WAITING') {
            updateAvailable = true;
            showUpdateNotification();
        }
    });
}


/**
 * Tab switching functionality
 */
function openTab(evt, tabName) {
    const tabs = document.getElementsByClassName('tab-content');
    for (let t of tabs) t.style.display = 'none';
    const btns = document.getElementsByClassName('tab-button');
    for (let b of btns) b.className = b.className.replace(' active', '').replace(' cpr-active', '');
    
    document.getElementById(tabName).style.display = 'block';
    if (evt) {
        const targetBtn = evt.currentTarget;
        if (tabName === 'cpr') {
            targetBtn.className += ' cpr-active';
        } else {
            targetBtn.className += ' active';
        }
    }
    
    // Re-render the chart/timeline when opening the tab
    if (tabName === 'vitals') renderVitalsChart();
    if (tabName === 'cpr') renderCprTimeline();
}

/**
 * Toggle menu dropdown
 */
function toggleMenu() {
    document.getElementById('menu-dropdown').classList.toggle('show');
}

/**
 * Service Worker Update Management
 */
function showUpdateNotification() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.style.display = 'block';
    }
}

function checkForUpdates() {
    if (updateAvailable) {
        showUpdateNotification();
    } else {
        showNotification('No updates available.', 'info');
    }
}

function applyUpdate() {
    if (window.swRegistration && window.swRegistration.waiting) {
        window.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
        window.location.reload();
    }
}

function dismissUpdate() {
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

/**
 * Utility functions
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert-banner alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}


/**
 * Initialize app when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initApp);


// =========================================================================
// !!! CRITICAL FIX: EXPOSE FUNCTIONS TO THE GLOBAL WINDOW OBJECT !!!
// This is necessary because the HTML uses inline event handlers (onclick=\"...\")
// and functions inside ES Modules (like app.js) are private by default.
// =========================================================================

window.openTab = openTab;
window.toggleMenu = toggleMenu;
window.showResults = showResults; // Imported from results.js
window.closeResults = closeResults; // Imported from results.js
window.copyResults = copyResults; // Imported from results.js
window.downloadReport = downloadReport; // Imported from results.js
window.checkForUpdates = checkForUpdates;
window.applyUpdate = applyUpdate;
window.dismissUpdate = dismissUpdate;

// Expose other functions used directly in the HTML
window.submitVitals = submitVitals; // Used on Vitals tab
window.submitGCS = submitGCS; // Used on GCS tab
window.addNote = addNote; // Used on Notes tab
window.startCPR = startCPR; // Used on CPR tab
window.stopCPR = stopCPR; // Used on CPR tab
window.addCprEvent = addCprEvent; // Used on CPR tab
window.togglePauseCPR = togglePauseCPR; // Used on CPR tab
window.addPatient = addPatient; // Used on Patient Info tab
window.switchPatient = switchPatient; // Used on Patient Info tab (must be exposed if used in dynamic HTML)
window.deletePatient = deletePatient; // Used on Patient Info tab (must be exposed if used in dynamic HTML)
window.showVitalInfo = showVitalInfo; // Used on Vitals tab
window.updateVitalIndicator = updateVitalIndicator; // Used on Vitals tab
window.patientInfoChanged = patientInfoChanged; // Used on Vitals tab
