/**
 * Vitals Module
 * Handles vital signs recording and display
 */

// Import patient management
import { patientInfo, currentPatientId, patients, saveToLocalStorage } from './patient.js';
import { nowTimestamp, getValue, setValue } from './utils.js';

// Global vitals data
let vitalsLog = []; // newest first

/**
 * Get a read-only reference to the current vitals log
 */
export function getVitalsLog() { return vitalsLog; }

/**
 * Show detailed vital info modal
 */
export function showVitalInfo(vitalType) {
    const modal = document.getElementById('vital-info-modal');
    const title = document.getElementById('vital-info-title');
    const content = document.getElementById('vital-info-content');
    if (!modal || !title || !content) return; // Defensive guard in case DOM not present

    // Define vital information (shortened for brevity — mirrors OldIndex.html ranges)
    const vitalInfo = {
        'bp': {
            title: 'Blood Pressure',
            description: 'Blood pressure is the force of blood pushing against the walls of the arteries as the heart pumps blood.',
            ranges: `
            <table class="vital-range-table">
              <tr>
                <th>Category</th>
                <th>Systolic (mmHg)</th>
                <th>Diastolic (mmHg)</th>
              </tr>
              <tr>
                <td class="range-normal">Normal</td>
                <td class="range-normal">101-159</td>
                <td class="range-normal">71-99</td>
              </tr>
              <tr>
                <td class="range-abnormal">Abnormal</td>
                <td class="range-abnormal">90-100 or 160-200</td>
                <td class="range-abnormal">60-70 or 100-120</td>
              </tr>
              <tr>
                <td class="range-critical">Critical</td>
                <td class="range-critical">&lt;90 or &gt;200</td>
                <td class="range-critical">&lt;60 or &gt;120</td>
              </tr>
            </table>
            `
        },
        'pulse': {
            title: 'Pulse',
            description: 'Pulse is the rate at which the heart beats, measured in beats per minute (bpm).',
            ranges: `
            <table class="vital-range-table">
              <tr>
                <th>Category</th>
                <th>Range (bpm)</th>
              </tr>
              <tr>
                <td class="range-normal">Normal</td>
                <td class="range-normal">51-99</td>
              </tr>
              <tr>
                <td class="range-abnormal">Abnormal</td>
                <td class="range-abnormal">40-50 or 100-130</td>
              </tr>
              <tr>
                <td class="range-critical">Critical</td>
                <td class="range-critical">&lt;40 or &gt;130</td>
              </tr>
            </table>
            `
        },
        'spo2': {
            title: 'SPO₂ (Oxygen Saturation)',
            description: 'SPO₂ measures the percentage of hemoglobin in the blood that is saturated with oxygen.',
            ranges: `
            <table class="vital-range-table">
              <tr>
                <th>Category</th>
                <th>Range (%)</th>
              </tr>
              <tr>
                <td class="range-normal">Normal</td>
                <td class="range-normal">95-100</td>
              </tr>
              <tr>
                <td class="range-abnormal">Abnormal</td>
                <td class="range-abnormal">90-94</td>
              </tr>
              <tr>
                <td class="range-critical">Critical</td>
                <td class="range-critical">&lt;90</td>
              </tr>
            </table>
            `
        }
    };

    const info = vitalInfo[vitalType] || { title: 'Vital', description: '', ranges: '' };
    title.textContent = info.title;
    content.innerHTML = `<p>${info.description}</p>${info.ranges}`;
    modal.style.display = 'block';
}


/**
 * Load vitals data from localStorage
 */
export function loadFromLocalStorage() {
    const savedVitals = localStorage.getItem('vitalsLog');
    if (savedVitals) vitalsLog = JSON.parse(savedVitals);
}

/**
 * Persist vitals into the current patient object and save using patient.saveToLocalStorage
 */
export function persistVitals() {
    if (currentPatientId) {
        patients[currentPatientId] = patients[currentPatientId] || { info: {...patientInfo}, vitals: [], gcs: [], notes: [] };
        patients[currentPatientId].vitals = [...vitalsLog];
        saveToLocalStorage();
    }
}

export function setVitalsLog(arr) {
    vitalsLog = Array.isArray(arr) ? [...arr] : [];
    renderVitalsLog();
    renderVitalsChart();
}

/**
 * Vitals assessment functions
 */
function assessVital(value, vitalType) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'normal';
    
    switch(vitalType) {
        case 'bp-sys':
            if (num < 90 || num > 200) return 'critical';
            if (num >= 90 && num <= 100) return 'abnormal';
            if (num >= 160 && num <= 200) return 'abnormal';
            return 'normal';
            
        case 'bp-dia':
            if (num < 60 || num > 120) return 'critical';
            if (num >= 60 && num <= 70) return 'abnormal';
            if (num >= 100 && num <= 120) return 'abnormal';
            return 'normal';
            
        case 'pulse':
            if (num < 40 || num > 130) return 'critical';
            if (num >= 40 && num <= 50) return 'abnormal';
            if (num >= 100 && num <= 130) return 'abnormal';
            return 'normal';
            
        case 'spo2':
            if (num < 90) return 'critical';
            if (num >= 90 && num <= 94) return 'abnormal';
            return 'normal';
            
        case 'rrate':
            if (num < 8 || num > 30) return 'critical';
            if (num >= 8 && num <= 12) return 'abnormal';
            if (num >= 25 && num <= 30) return 'abnormal';
            return 'normal';
            
        case 'hgt':
            if (num < 2.5 || num > 20) return 'critical';
            if (num >= 2.5 && num <= 4) return 'abnormal';
            if (num >= 15 && num <= 20) return 'abnormal';
            return 'normal';
            
        case 'temp':
            if (num < 35 || num > 39) return 'critical';
            if (num >= 35 && num <= 36) return 'abnormal';
            if (num >= 38 && num <= 39) return 'abnormal';
            return 'normal';
            
        case 'cap-refill':
            if (num > 3) return 'critical';
            if (num >= 2 && num <= 3) return 'abnormal';
            return 'normal';
            
        case 'pain':
            if (num >= 8) return 'critical';
            if (num >= 5 && num <= 7) return 'abnormal';
            return 'normal';
            
        default:
            return 'normal';
    }
}

/**
 * Update vital indicator styling
 */
export function updateVitalIndicator(input, vitalType) {
    if (!input) return; // Defensive
    // Remove all existing classes
    if (input.classList) input.classList.remove('vital-normal', 'vital-abnormal', 'vital-critical');
    
    const val = input.value || '';
    const assessment = assessVital(val, vitalType);
    if (val !== '') {
        if (input.classList) input.classList.add(`vital-${assessment}`);
    }
}

/**
 * Get vital class for display
 */
export function getVitalClass(value, vitalType) {
    const assessment = assessVital(value, vitalType);
    return `vital-value-${assessment}`;
}

/**
 * Submit vitals
 */
export function submitVitals() {
    // pull patient info (keep patientInfo up to date)
    patientInfo.responderId = getValue('responder-id');
    patientInfo.incident = getValue('incident-type');
    patientInfo.name = getValue('patient-name');
    patientInfo.age = getValue('patient-age');
    patientInfo.allergies = getValue('allergies');
    patientInfo.medication = getValue('medication');
    patientInfo.history = getValue('history');
    patientInfo.lastIntake = getValue('last-intake');
    patientInfo.signsSymptoms = getValue('signs-symptoms');
    patientInfo.priority = getValue('patient-priority');
    patientInfo.pupilsReactive = getValue('pupils-reactive', false);

    const item = {
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        bpSys: getValue('bp-sys'),
        bpDia: getValue('bp-dia'),
        pulse: getValue('pulse'),
        spo2: getValue('spo2'),
        o2Delivery: getValue('o2-delivery'),
        o2Flow: getValue('o2-flow'),
        rrate: getValue('rrate'),
        hgt: getValue('hgt'),
        temp: getValue('temp'),
        capRefill: getValue('cap-refill'),
        pupilLeft: getValue('pupil-left'),
        pupilRight: getValue('pupil-right'),
        pain: getValue('pain'),
        ecg: getValue('ecg'),
        painLocation: getValue('pain-location'),
        skin: getValue('skin'),
        pupilsReactive: getValue('pupils-reactive', false)
    };

    // Prepend newest
    vitalsLog.unshift(item);
    // Keep only reasonable history length
    if (vitalsLog.length > 200) vitalsLog.length = 200;

    persistVitals();
    renderVitalsLog();
    clearVitalsInputs();
}

/**
 * Clear vitals inputs
 */
export function clearVitalsInputs() {
    const fields = [
        'bp-sys', 'bp-dia', 'pulse', 'spo2', 'o2-delivery', 'o2-flow', 
        'rrate', 'hgt', 'temp', 'cap-refill', 'pupil-left', 'pupil-right', 
        'pain', 'ecg', 'pain-location', 'skin'
    ];
    
    fields.forEach(id => {
        setValue(id, '');
        const el = document.getElementById(id);
        if (!el) return;
        // Remove color classes
        if (el.classList) el.classList.remove('vital-normal', 'vital-abnormal', 'vital-critical');
    });
}

/**
 * Render vitals log
 */
export function renderVitalsLog() {
    const el = document.getElementById('vitals-log');
    if (!el) return; // Defensive guard
    el.innerHTML = '';
    if (vitalsLog.length === 0) {
        el.innerHTML = '<div class="log-item meta">No vitals recorded yet</div>';
        return;
    }
    
    vitalsLog.forEach(item => {
        const lines = [];
        if (item.bpSys && item.bpDia) {
            const sysClass = getVitalClass(item.bpSys, 'bp-sys');
            const diaClass = getVitalClass(item.bpDia, 'bp-dia');
            lines.push(`BP: <span class="${sysClass}">${item.bpSys}</span>/<span class="${diaClass}">${item.bpDia}</span> mmHg`);
        }
        if (item.pulse) {
            const pulseClass = getVitalClass(item.pulse, 'pulse');
            lines.push(`Pulse: <span class="${pulseClass}">${item.pulse}</span> bpm`);
        }
        if (item.spo2) {
            const spo2Class = getVitalClass(item.spo2, 'spo2');
            let s = `SPO₂: <span class="${spo2Class}">${item.spo2}</span>%`;
            if (item.o2Delivery) s += ` (${item.o2Delivery})`;
            lines.push(s);
        }
        if (item.rrate) {
            const rrClass = getVitalClass(item.rrate, 'rrate');
            lines.push(`Resp Rate: <span class="${rrClass}">${item.rrate}</span>/min`);
        }
        if (item.hgt) {
            const tempClass = getVitalClass(item.hgt, 'hgt');
            lines.push(`HGT: <span class="${tempClass}">${item.hgt}</span> mmol/L`);
        }
        if (item.temp) {
            const tempClass = getVitalClass(item.temp, 'temp');
            lines.push(`Temp: <span class="${tempClass}">${item.temp}</span> °C`);
        }
        if (item.capRefill) {
            const capClass = getVitalClass(item.capRefill, 'cap-refill');
            lines.push(`Cap Refill: <span class="${capClass}">${item.capRefill}</span> s`);
        }
        if (item.pupilLeft || item.pupilRight) {
            const pupilText = `Pupils: L${item.pupilLeft || ''} R${item.pupilRight || ''}`;
            if (item.pupilsReactive) {
                lines.push(`${pupilText} (Reactive)`);
            } else {
                lines.push(pupilText);
            }
        }
        if (item.pain) {
            const painClass = getVitalClass(item.pain, 'pain');
            lines.push(`Pain: <span class="${painClass}">${item.pain}</span>/10`);
        }
        if (item.ecg) lines.push(`ECG: ${item.ecg}`);
        if (item.painLocation) lines.push(`Pain Location: ${item.painLocation}`);
        if (item.skin) lines.push(`Skin: ${item.skin}`);

        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `<div><strong>${item.time}</strong> — ${lines.join(' • ')}</div>`;
        el.appendChild(div);
    });
}

/**
 * Render vitals chart
 */
export function renderVitalsChart() {
    const container = document.getElementById('vitals-chart-container');
    if (!container) return; // Defensive guard
    container.innerHTML = '';
    
    if (vitalsLog.length < 2) return;
    
    // Create BP trend chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'vitals-chart';
    
    const chartTitle = document.createElement('div');
    chartTitle.className = 'chart-title';
    chartTitle.textContent = 'BP Trend (Systolic)';
    container.appendChild(chartTitle);
    
    const bps = vitalsLog.map(v => parseInt(v.bpSys)).filter(n => !isNaN(n));
    const maxBP = bps.length > 0 ? Math.max(...bps) : 0;
    const minBP = bps.length > 0 ? Math.min(...bps) : 0;
    
    // Show last 5 readings
    vitalsLog.slice(0, 5).reverse().forEach((v, i) => {
        const height = maxBP > minBP ? 
            `${((parseInt(v.bpSys) - minBP) / (maxBP - minBP)) * 100}%` : '50%';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = height;
        bar.title = `${v.time}: ${v.bpSys}/${v.bpDia}`;
        chartContainer.appendChild(bar);
    });
    
    container.appendChild(chartContainer);
}
