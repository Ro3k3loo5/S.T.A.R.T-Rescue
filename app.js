/**
 * Main Application Controller
 * Coordinates all modules and handles global functionality
 */

// Import modules
import { loadFromLocalStorage, saveToLocalStorage, updateAllTabPatientDisplays, patientInfo, patientInfoChanged, patientNameChanged, patientPriorityChanged, addPatient, switchPatient, deletePatient, renderPatientList, updateCurrentPatientDisplay, currentPatientId, patients } from './patient.js';
import { renderVitalsLog, submitVitals, clearVitalsInputs, renderVitalsChart, showVitalInfo, updateVitalIndicator, loadFromLocalStorage as loadVitals } from './vitals.js';
import { renderGcsLog, submitGCS, clearGCSInputs, loadFromLocalStorage as loadGcs } from './gcs.js';
import { renderNotesLog, addNote, clearNoteInput, setupAudioRecorder, loadFromLocalStorage as loadNotes } from './notes.js';
import { renderCprLog, renderCprEvents, renderCprTimeline, startCPR, stopCPR, addCprEvent, togglePauseCPR, loadFromLocalStorage as loadCpr } from './cpr.js';
import { generateResults, showResults, closeResults, copyResults, downloadReport } from './results.js';
import { q } from './utils.js';

// Global variables
let updateAvailable = false;

// =========================================================================
// UI Functions that need to be globally accessible (exposed to HTML onclick)
// =========================================================================

/**
 * Changes the active tab in the UI.
 * @param {string} tabName - The ID of the tab content to show (e.g., 'vitals-tab').
 */
function openTab(evt, tabName) {
    // Hide all tab content
    const tabs = document.getElementsByClassName('tab-content');
    for (let t of tabs) t.style.display = 'none';

    // Clear active class from all tab buttons
    const btns = document.getElementsByClassName('tab-button');
    for (let b of btns) b.classList.remove('active');

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) selectedTab.style.display = 'block';

    // Set active button
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
    else {
        const found = Array.from(btns).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`openTab(event,'${tabName}')`));
        if (found) found.classList.add('active');
    }

    // Special rendering for vitals
    if (tabName === 'vitals') renderVitalsChart();
}

/**
 * Toggles the visibility of the dropdown menu.
 */
function toggleMenu() {
    const dropdown = document.getElementById("menu-dropdown");
    dropdown.classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.addEventListener('click', function(event) {
    if (!event.target.matches('.menu-button') && !event.target.matches('.menu-container')) {
        const dropdown = document.getElementById("menu-dropdown");
        if (dropdown && dropdown.classList && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
});


// =========================================================================
// PWA Update Logic (Kept from original index.html script block)
// =========================================================================

function checkForUpdates() {
    if (window.swRegistration) {
        window.swRegistration.update();
        console.log("Checking for updates...");
        // This is a placeholder. Real update logic relies on the service worker.
    }
}

function applyUpdate() {
    if (window.swRegistration && window.swRegistration.waiting) {
        // Send message to the waiting Service Worker to skip waiting
        window.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        // Optional: Wait for the service worker to activate before reloading
        window.swRegistration.waiting.addEventListener('statechange', e => {
            if (e.target.state === 'activated') {
                window.location.reload();
            }
        });
        const un = q('update-notification'); if (un) un.style.display = 'none';
    } else {
        window.location.reload(); // Simple reload if no waiting SW is detected
    }
}

function dismissUpdate() {
    const un = q('update-notification'); if (un) un.style.display = 'none';
}


/**
 * Initialize the application
 */
function initApp() {
    // Load data from localStorage
    loadFromLocalStorage();
    // Module-specific data
    loadVitals();
    loadGcs();
    loadNotes();
    loadCpr();

    // Render all initial data
    renderVitalsLog();
    renderGcsLog();
    renderNotesLog();
    renderCprLog();
    // No need to call renderCprEvents or renderCprTimeline here unless you have data to show on load
    renderVitalsChart();
    renderPatientList();
    
    // Update UI displays
    updateAllTabPatientDisplays();
    updateCurrentPatientDisplay();

    // Set up event listener for the audio recorder setup
    setupAudioRecorder();

    // Ensure we have a current patient set.
    // Prefer restoring an existing patient rather than creating a new empty one to avoid duplicate "New Patient" chips from previous runs.
    if (!currentPatientId) {
        const ids = Object.keys(patients);
        if (ids.length > 0) {
            // Switch to the first saved patient
            switchPatient(ids[0]);
        } else {
            addPatient();
        }
    } else if (!patients[currentPatientId]) {
        // If currentPatientId points to a missing patient, fall back to any existing one or create new
        const ids = Object.keys(patients);
        if (ids.length > 0) switchPatient(ids[0]);
        else addPatient();
    }

    // Ensure a sensible tab is opened on load
    openTab(null, 'patient-info');
}

// =========================================================================
// Expose functions to the global window object (CRITICAL FIX)
// All functions called via HTML onclick="..." must be exposed here.
// =========================================================================

// Global UI / Core functions
window.openTab = openTab;
window.toggleMenu = toggleMenu;
window.showResults = showResults; 
window.closeResults = closeResults; 
window.copyResults = copyResults; 
window.downloadReport = downloadReport; 
window.checkForUpdates = checkForUpdates;
window.applyUpdate = applyUpdate;
window.dismissUpdate = dismissUpdate;

// Module-specific functions used in HTML
window.submitVitals = submitVitals; 
window.submitGCS = submitGCS; 
window.addNote = addNote; 
window.startCPR = startCPR; 
window.stopCPR = stopCPR; 
window.addCprEvent = addCprEvent; 
window.togglePauseCPR = togglePauseCPR; 
window.addPatient = addPatient; 
window.switchPatient = switchPatient; 
window.deletePatient = deletePatient; 
window.showVitalInfo = showVitalInfo; 
window.updateVitalIndicator = updateVitalIndicator; 
window.patientInfoChanged = patientInfoChanged; 
window.patientNameChanged = patientNameChanged; 
window.patientPriorityChanged = patientPriorityChanged; 
// CPR Modal functions (assuming they are in one of the imported modules or need defining)
// Defining placeholders for modal functions if they are missing from your modules
window.closeVitalInfoModal = () => { const m = q('vital-info-modal'); if (m) m.style.display = 'none'; };
window.closePulseCheckModal = () => { const p = q('pulse-check-modal'); if (p) p.style.display = 'none'; };
// Assuming pulseDetected and noPulseDetected are defined in cpr.js or similar
// window.pulseDetected = pulseDetected;
// window.noPulseDetected = noPulseDetected;


// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
