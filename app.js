/**
 * Main Application Controller
 * Coordinates all modules and handles global functionality
 */

// Import modules
import { loadFromLocalStorage, saveToLocalStorage, updateAllTabPatientDisplays } from './patient.js';
import { renderVitalsLog, submitVitals, clearVitalsInputs, renderVitalsChart, showVitalInfo, updateVitalIndicator, nowTimestamp } from './vitals.js';
import { renderGcsLog, submitGCS, clearGCSInputs } from './gcs.js';
import { renderNotesLog, addNote, clearNoteInput, setupAudioRecorder } from './notes.js';
import { renderCprLog, renderCprEvents, renderCprTimeline, startCPR, stopCPR, addCprEvent, togglePauseCPR } from './cpr.js';
import { generateResults, showResults, closeResults, copyResults, downloadReport } from './results.js';
import { patientInfo, patientInfoChanged, patientPriorityChanged, addPatient, switchPatient, deletePatient, renderPatientList, updateCurrentPatientDisplay } from './patient.js';
import { patientData } from './patient.js'; // Ensure patientData is imported

// Global variables
let updateAvailable = false;

// =========================================================================
// UI Functions that need to be globally accessible (exposed to HTML onclick)
// =========================================================================

/**
 * Changes the active tab in the UI.
 * @param {string} tabName - The ID of the tab content to show (e.g., 'vitals-tab').
 */
function openTab(tabName) {
    // Get all tab content elements
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }

    // Get all tab buttons
    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    // Show the current tab and add an "active" class to the button
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.style.display = "block";
    }
    
    // Find the button that corresponds to the tabName and activate it
    const activeBtn = Array.from(tabButtons).find(btn => 
        btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`openTab('${tabName}')`)
    );
    if (activeBtn) {
        activeBtn.classList.add("active");
    }

    // Special rendering logic for specific tabs
    if (tabName === 'vitals-tab') {
        renderVitalsChart();
    }
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
        if (dropdown.classList.contains('show')) {
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
        document.getElementById('update-notification').style.display = 'none';
    } else {
        window.location.reload(); // Simple reload if no waiting SW is detected
    }
}

function dismissUpdate() {
    document.getElementById('update-notification').style.display = 'none';
}


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
    // No need to call renderCprEvents or renderCprTimeline here unless you have data to show on load
    renderVitalsChart();
    renderPatientList();
    
    // Update UI displays
    updateAllTabPatientDisplays();
    updateCurrentPatientDisplay();

    // Set up event listener for the audio recorder setup
    setupAudioRecorder();

    // Check if there is a current patient, otherwise create one
    if (!patientData.currentPatientId || !patientData.patients[patientData.currentPatientId]) {
        addPatient();
    } else {
        // Ensure the correct tab is opened on load (e.g., 'vitals-tab')
        openTab('vitals-tab'); 
    }
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
// CPR Modal functions (assuming they are in one of the imported modules or need defining)
// Defining placeholders for modal functions if they are missing from your modules
window.closeVitalInfoModal = () => document.getElementById('vital-info-modal').style.display = 'none';
window.closePulseCheckModal = () => document.getElementById('pulse-check-modal').style.display = 'none';
// Assuming pulseDetected and noPulseDetected are defined in cpr.js or similar
// window.pulseDetected = pulseDetected;
// window.noPulseDetected = noPulseDetected;


// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);
