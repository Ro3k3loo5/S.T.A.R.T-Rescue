/**
 * Main Application Controller
 * Coordinates all modules and handles global functionality
 */

// Import modules (these will be created as separate files)
import { loadFromLocalStorage, saveToLocalStorage, updateAllTabPatientDisplays } from './patient.js';
import { renderVitalsLog, submitVitals, clearVitalsInputs, renderVitalsChart } from './vitals.js';
import { renderGcsLog, submitGCS, clearGCSInputs } from './gcs.js';
import { renderNotesLog, addNote, clearNoteInput } from './notes.js';
import { renderCprLog, renderCprEvents, renderCprTimeline } from './cpr.js';
import { generateResults, showResults, closeResults, copyResults, downloadReport } from './results.js';

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
    
    // Update UI displays
    updateAllTabPatientDisplays();
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
    evt.currentTarget.className += ' active';
    
    if (tabName === 'cpr') {
        evt.currentTarget.className += ' cpr-active';
    }
}

/**
 * Update management
 */
function checkForUpdates() {
    if (!window.swRegistration) {
        showNotification('Service worker not available. Please refresh the page.', 'info');
        return;
    }
    
    window.swRegistration.update().then(() => {
        setTimeout(() => {
            if (!updateAvailable) {
                showNotification('No updates available. You have the latest version.', 'info');
            }
        }, 1000);
    });
}

// Listen for service worker updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
});

navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        showUpdateNotification();
    }
});

function showUpdateNotification() {
    updateAvailable = true;
    const notification = document.getElementById('update-notification');
    if (notification) {
        notification.style.display = 'block';
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
 * Close modal when clicking outside of it
 */
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

/**
 * Initialize app when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initApp);
