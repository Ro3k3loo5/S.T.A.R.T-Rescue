/**
 * Patient Management Module
 * Handles patient data, switching between patients, and patient info updates
 */

// Global patient data
let patientInfo = {
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

let currentPatientId = null;
let patients = {};

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
    // Save current patient if exists
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: [],
            gcs: [],
            notes: []
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
    
    // Clear all current data
    // Clear UI elements
    document.getElementById('patient-name').value = '';
    document.getElementById('responder-id').value = patientInfo.responderId;
    document.getElementById('incident-type').value = '';
    document.getElementById('patient-age').value = '';
    document.getElementById('allergies').value = '';
    document.getElementById('medication').value = '';
    document.getElementById('history').value = '';
    document.getElementById('last-intake').value = '';
    document.getElementById('signs-symptoms').value = '';
    document.getElementById('patient-priority').value = '';
    document.getElementById('pupils-reactive').checked = false;
    
    saveToLocalStorage();
    renderPatientList();
    updateCurrentPatientDisplay();
}

/**
 * Switch to a specific patient
 */
export function switchPatient(patientId) {
    if (!patients[patientId]) return;
    
    // Save current patient if exists
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: [],
            gcs: [],
            notes: []
        };
    }
    
    currentPatientId = patientId;
    patientInfo = {...patients[patientId].info};
    
    // Update UI
    updatePatientInfoFields();
    renderPatientList();
    updateCurrentPatientDisplay();
    saveToLocalStorage();
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

/**
 * Render patient list
 */
export function renderPatientList() {
    const patientListEl = document.getElementById('patient-list');
    patientListEl.innerHTML = '';
    
    // Only show patients with names
    const namedPatients = Object.keys(patients).filter(id => 
        patients[id].info.name && patients[id].info.name.trim() !== ''
    );
    
    if (namedPatients.length === 0) {
        patientListEl.innerHTML = '<div class="meta">No named patients yet</div>';
        return;
    }
    
    namedPatients.forEach(id => {
        const patient = patients[id];
        const displayName = patient.info.name;
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
            <span class="remove" onclick="event.stopPropagation(); removePatient('${id}')">×</span>
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
    document.getElementById('responder-id').value = patientInfo.responderId;
    document.getElementById('incident-type').value = patientInfo.incident;
    document.getElementById('patient-name').value = patientInfo.name;
    document.getElementById('patient-age').value = patientInfo.age;
    document.getElementById('allergies').value = patientInfo.allergies;
    document.getElementById('medication').value = patientInfo.medication;
    document.getElementById('history').value = patientInfo.history;
    document.getElementById('last-intake').value = patientInfo.lastIntake;
    document.getElementById('signs-symptoms').value = patientInfo.signsSymptoms || '';
    document.getElementById('patient-priority').value = patientInfo.priority || '';
    document.getElementById('pupils-reactive').checked = patientInfo.pupilsReactive || false;
}

/**
 * Handle patient info changes
 */
export function patientInfoChanged() {
    // Update patientInfo object with current form values
    patientInfo.responderId = document.getElementById('responder-id').value.trim();
    patientInfo.incident = document.getElementById('incident-type').value;
    patientInfo.age = document.getElementById('patient-age').value.trim();
    patientInfo.allergies = document.getElementById('allergies').value.trim();
    patientInfo.medication = document.getElementById('medication').value.trim();
    patientInfo.history = document.getElementById('history').value.trim();
    patientInfo.lastIntake = document.getElementById('last-intake').value.trim();
    patientInfo.signsSymptoms = document.getElementById('signs-symptoms').value.trim();
    patientInfo.pupilsReactive = document.getElementById('pupils-reactive').checked;
    
    // Save current patient data
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: [],
            gcs: [],
            notes: []
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
    const newName = document.getElementById('patient-name').value.trim();
    
    // Update patientInfo object with current form values
    patientInfo.responderId = document.getElementById('responder-id').value.trim();
    patientInfo.incident = document.getElementById('incident-type').value;
    patientInfo.name = newName;
    patientInfo.age = document.getElementById('patient-age').value.trim();
    patientInfo.allergies = document.getElementById('allergies').value.trim();
    patientInfo.medication = document.getElementById('medication').value.trim();
    patientInfo.history = document.getElementById('history').value.trim();
    patientInfo.lastIntake = document.getElementById('last-intake').value.trim();
    patientInfo.signsSymptoms = document.getElementById('signs-symptoms').value.trim();
    patientInfo.pupilsReactive = document.getElementById('pupils-reactive').checked;
    
    // Save current patient data
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: [],
            gcs: [],
            notes: []
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
    const newPriority = document.getElementById('patient-priority').value;
    
    // Update patientInfo object
    patientInfo.priority = newPriority;
    
    // Save current patient data
    if (currentPatientId) {
        patients[currentPatientId] = {
            info: {...patientInfo},
            vitals: [],
            gcs: [],
            notes: []
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
    
    // Update all tab patient displays
    document.getElementById('patient-info-current').textContent = patientName;
    document.getElementById('vitals-current').textContent = patientName;
    document.getElementById('gcs-current').textContent = patientName;
    document.getElementById('cpr-current').textContent = patientName;
    document.getElementById('notes-current').textContent = patientName;
}
