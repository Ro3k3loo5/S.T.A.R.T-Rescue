/**
 * Patient Management Module
 * Handles patient data, switching between patients, and patient info updates
 */

// Global patient data
import { getValue, setValue } from './utils.js';

export let patientInfo = {
    responderId: '',
    incident: '',
    name: '',
    age: '',
    allergies: '',
    medication: '',
    history: '',
    lastIntake: '',
    signsSymptoms: '',
    priority: '',
    pupilsReactive: false
};

export let currentPatientId = null;
export let patients = {};

/**
 * Load patient data from localStorage
 */
export function loadFromLocalStorage() {
    const savedPatientInfo = localStorage.getItem('patientInfo');
    if (savedPatientInfo) patientInfo = JSON.parse(savedPatientInfo);
    
    const savedCurrentPatientId = localStorage.getItem('currentPatientId');
    if (savedCurrentPatientId) currentPatientId = savedCurrentPatientId;
    
    const savedPatients = localStorage.getItem('patients');
    if (savedPatients) patients = JSON.parse(savedPatients);
}

/**
 * Save patient data to localStorage
 */
export function saveToLocalStorage() {
    localStorage.setItem('patientInfo', JSON.stringify(patientInfo));
    localStorage.setItem('currentPatientId', currentPatientId);
    localStorage.setItem('patients', JSON.stringify(patients));
}

/**
 * Add a new patient
 */
export function addPatient() {
    // Save current patient if exists (placeholder — modules will persist their own logs)
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: patients[currentPatientId] ? patients[currentPatientId].vitals : [],
            gcs: patients[currentPatientId] ? patients[currentPatientId].gcs : [],
            notes: patients[currentPatientId] ? patients[currentPatientId].notes : []
        };
    }
    
    // Create new patient with empty data
    const patientId = Date.now().toString();
    patients[patientId] = {
        info: {
            responderId: patientInfo.responderId, // Keep responder ID
            incident: '',
            name: '',
            age: '',
            allergies: '',
            medication: '',
            history: '',
            lastIntake: '',
            signsSymptoms: '',
            priority: '',
            pupilsReactive: false
        },
        vitals: [],
        gcs: [],
        notes: []
    };
    
    currentPatientId = patientId;
    patientInfo = {...patients[patientId].info};
    
    // Clear all current data (defensive) using safe setters
    setValue('patient-name', '');
    setValue('responder-id', patientInfo.responderId);
    setValue('incident-type', '');
    setValue('patient-age', '');
    setValue('allergies', '');
    setValue('medication', '');
    setValue('history', '');
    setValue('last-intake', '');
    setValue('signs-symptoms', '');
    setValue('patient-priority', '');
    setValue('pupils-reactive', false);
    
    saveToLocalStorage();
    renderPatientList();
    updateCurrentPatientDisplay();
    return patientId;
}

/**
 * Switch to a specific patient
 */
export function switchPatient(patientId) {
    if (!patients[patientId]) return;
    
    // Save current patient if exists (placeholder)
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: patients[currentPatientId] ? patients[currentPatientId].vitals : [],
            gcs: patients[currentPatientId] ? patients[currentPatientId].gcs : [],
            notes: patients[currentPatientId] ? patients[currentPatientId].notes : []
        };
    }
    
    currentPatientId = patientId;
    patientInfo = {...patients[patientId].info};
    
    // Update UI
    updatePatientInfoFields();
    renderPatientList();
    updateCurrentPatientDisplay();
    saveToLocalStorage();
    return patientId;
}

/**
 * Remove a patient
 */
export function removePatient(patientId) {
    if (!confirm('Remove this patient and all their data?')) return;
    
    delete patients[patientId];
    
    if (currentPatientId === patientId) {
        // Switch to another patient or create new one
        const remainingIds = Object.keys(patients);
        if (remainingIds.length > 0) {
            switchPatient(remainingIds[0]);
        } else {
            addPatient();
        }
    }
    
    saveToLocalStorage();
    renderPatientList();
    updateCurrentPatientDisplay();
}

// Provide deletePatient alias for compatibility with UI and other modules
export const deletePatient = removePatient;

/**
 * Render patient list
 */
export function renderPatientList() {
    const patientListEl = document.getElementById('patient-list');
    if (!patientListEl) return; // Defensive guard
    patientListEl.innerHTML = '';
    
    // Show all patients (use a friendly name for unnamed patients)
    const allIds = Object.keys(patients);
    if (allIds.length === 0) {
        patientListEl.innerHTML = '<div class="meta">No patients yet</div>';
        return;
    }
    
    allIds.forEach(id => {
        const patient = patients[id];
        const displayName = patient.info.name && patient.info.name.trim() !== '' ? patient.info.name : 'New Patient';
        const priority = patient.info.priority;
        
        const chip = document.createElement('div');
        chip.className = `patient-chip ${id === currentPatientId ? 'active' : ''}`;
        
        let priorityIndicator = '';
        if (priority) {
            priorityIndicator = `<span class="priority-indicator priority-${priority.toLowerCase()}">${priority}</span>`;
        }
        
        chip.innerHTML = `
            ${displayName}
            ${priorityIndicator}
            <span class="remove" onclick="event.stopPropagation(); deletePatient('${id}')">×</span>
        `;
        chip.onclick = () => {
            switchPatient(id);
        };
        
        patientListEl.appendChild(chip);
    });
}

/**
 * Update current patient display
 */
export function updateCurrentPatientDisplay() {
    const displayEl = document.getElementById('current-patient-display');
    if (!displayEl) return;
    if (patientInfo.name && patientInfo.name.trim() !== '') {
        displayEl.textContent = patientInfo.name;
    } else {
        displayEl.textContent = 'New Patient';
    }
}

/**
 * Update patient info fields
 */
export function updatePatientInfoFields() {
    const fields = [
        'responder-id','incident-type','patient-name','patient-age','allergies','medication',
        'history','last-intake','signs-symptoms','patient-priority','pupils-reactive'
    ];
    
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        switch(id) {
            case 'pupils-reactive':
                el.checked = patientInfo.pupilsReactive || false;
                break;
            default:
                el.value = patientInfo[id.replace(/-/g,'')] || patientInfo[id] || '';
        }
    });
}

/**
 * Handle patient info changes
 */
export function patientInfoChanged() {
    // Update patientInfo object with current form values using safe getters
    patientInfo.responderId = getValue('responder-id');
    patientInfo.incident = getValue('incident-type');
    patientInfo.age = getValue('patient-age');
    patientInfo.allergies = getValue('allergies');
    patientInfo.medication = getValue('medication');
    patientInfo.history = getValue('history');
    patientInfo.lastIntake = getValue('last-intake');
    patientInfo.signsSymptoms = getValue('signs-symptoms');
    patientInfo.pupilsReactive = getValue('pupils-reactive', false);
    
    // Save current patient data
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: patients[currentPatientId] ? patients[currentPatientId].vitals : [],
            gcs: patients[currentPatientId] ? patients[currentPatientId].gcs : [],
            notes: patients[currentPatientId] ? patients[currentPatientId].notes : []
        };
        
        saveToLocalStorage();
        renderPatientList();
        updateCurrentPatientDisplay();
    }
}

/**
 * Handle patient name changes (special handling for patient list)
 */
export function patientNameChanged() {
    const newName = getValue('patient-name');
    
    // Update patientInfo object with current form values using safe getters
    patientInfo.responderId = getValue('responder-id');
    patientInfo.incident = getValue('incident-type');
    patientInfo.name = newName;
    patientInfo.age = getValue('patient-age');
    patientInfo.allergies = getValue('allergies');
    patientInfo.medication = getValue('medication');
    patientInfo.history = getValue('history');
    patientInfo.lastIntake = getValue('last-intake');
    patientInfo.signsSymptoms = getValue('signs-symptoms');
    patientInfo.pupilsReactive = getValue('pupils-reactive', false);

    // Save current patient data
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: patients[currentPatientId] ? patients[currentPatientId].vitals : [],
            gcs: patients[currentPatientId] ? patients[currentPatientId].gcs : [],
            notes: patients[currentPatientId] ? patients[currentPatientId].notes : []
        };
        
        saveToLocalStorage();
        renderPatientList();
        updateCurrentPatientDisplay();
    }
}

/**
 * Handle patient priority changes
 */
export function patientPriorityChanged() {
    const newPriority = getValue('patient-priority');
    
    // Update patientInfo object
    patientInfo.priority = newPriority;
    
    // Save current patient data
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: patients[currentPatientId] ? patients[currentPatientId].vitals : [],
            gcs: patients[currentPatientId] ? patients[currentPatientId].gcs : [],
            notes: patients[currentPatientId] ? patients[currentPatientId].notes : []
        };
        
        saveToLocalStorage();
        renderPatientList();
    }
}

/**
 * Update patient display in all tabs
 */
export function updateAllTabPatientDisplays() {
    const patientName = patientInfo.name && patientInfo.name.trim() !== '' ? patientInfo.name : 'New Patient';
    
    // Update all tab patient displays (defensive)
    const ids = ['patient-info-current','vitals-current','gcs-current','cpr-current','notes-current'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = patientName;
    });
}
