/**
 * Glasgow Coma Scale Module
 * Handles GCS assessment and scoring
 */

// Import patient management
import { patientInfo, currentPatientId, patients, saveToLocalStorage } from './patient.js';
import { nowTimestamp } from './utils.js';

// Global GCS data
let gcsLog = []; // newest first

export function getGcsLog() { return gcsLog; }


/**
 * Load GCS data from localStorage
 */
export function loadFromLocalStorage() {
    const savedGCS = localStorage.getItem('gcsLog');
    if (savedGCS) gcsLog = JSON.parse(savedGCS);
}

/**
 * Persist gcs into the current patient object and save using patient.saveToLocalStorage
 */
export function persistGcs() {
    if (currentPatientId) {
        patients[currentPatientId] = patients[currentPatientId] || { info: {...patientInfo}, vitals: [], gcs: [], notes: [] };
        patients[currentPatientId].gcs = [...gcsLog];
        saveToLocalStorage();
    }
}

export function setGcsLog(arr) {
    gcsLog = Array.isArray(arr) ? [...arr] : [];
    renderGcsLog();
}

/**
 * Submit GCS assessment
 */
export function submitGCS() {
    // calculate scores (read selected radio values)
    const eye = parseInt(document.querySelector('input[name="gcs-eye"]:checked')?.value || 0);
    const verbal = parseInt(document.querySelector('input[name="gcs-verbal"]:checked')?.value || 0);
    const motor = parseInt(document.querySelector('input[name="gcs-motor"]:checked')?.value || 0);
    const total = (eye||0) + (verbal||0) + (motor||0);
    
    const item = { 
        time: nowTimestamp(), 
        iso: new Date().toISOString(), 
        eye, verbal, motor, total 
    };
    
    gcsLog.unshift(item);
    if (gcsLog.length > 200) gcsLog.length = 200;

    // Update display (defensive)
    const totalEl = document.getElementById('gcs-total');
    if (totalEl) totalEl.innerText = `Total GCS Score: ${total} / 15 (E${eye} V${verbal} M${motor})`;
    
    persistGcs();
    renderGcsLog();
    clearGCSInputs();
}

/**
 * Clear GCS inputs
 */
export function clearGCSInputs() {
    const groups = ['gcs-eye', 'gcs-verbal', 'gcs-motor'];
    
    groups.forEach(name => {
        const inputs = document.querySelectorAll(`input[name="${name}"]`);
        if (inputs && inputs.forEach) inputs.forEach(i => i.checked = false);
    });
    
    const totalEl = document.getElementById('gcs-total'); if (totalEl) totalEl.innerText = 'Total GCS Score: 0 / 15';
}

/**
 * Render GCS log
 */
export function renderGcsLog() {
    const el = document.getElementById('gcs-log');
    if (!el) return; // Defensive guard
    el.innerHTML = '';
    if (gcsLog.length === 0) {
        el.innerHTML = '<div class="log-item meta">No GCS recorded yet</div>';
        return;
    }
    
    gcsLog.forEach(item => {
        const gcsClass = item.total <= 8 ? 'vital-value-critical' : 
                        item.total <= 12 ? 'vital-value-abnormal' : 'vital-value-normal';
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `<div><strong>${item.time}</strong> — Total: <span class="${gcsClass}">${item.total}</span>/15 (E${item.eye} V${item.verbal} M${item.motor})</div>`;
        el.appendChild(div);
    });
}
