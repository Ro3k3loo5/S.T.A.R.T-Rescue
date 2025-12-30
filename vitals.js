/**
 * Vitals Module
 * Handles vital signs recording and display
 */

// Import patient management
import { patientInfo, currentPatientId, patients, saveToLocalStorage } from './patient.js';
import { nowTimestamp } from './utils.js';

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
 * Save vitals data to localStorage
 */
export function saveToLocalStorage() {
    localStorage.setItem('vitalsLog', JSON.stringify(vitalsLog));
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
    // Remove all existing classes
    input.classList.remove('vital-normal', 'vital-abnormal', 'vital-critical');
    
    const assessment = assessVital(input.value, vitalType);
    if (input.value && input.value !== '') {
        input.classList.add(`vital-${assessment}`);
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
    patientInfo.responderId = document.getElementById('responder-id').value.trim();
    patientInfo.incident = document.getElementById('incident-type').value;
    patientInfo.name = document.getElementById('patient-name').value.trim();
    patientInfo.age = document.getElementById('patient-age').value.trim();
    patientInfo.allergies = document.getElementById('allergies').value.trim();
    patientInfo.medication = document.getElementById('medication').value.trim();
    patientInfo.history = document.getElementById('history').value.trim();
    patientInfo.lastIntake = document.getElementById('last-intake').value.trim();
    patientInfo.signsSymptoms = document.getElementById('signs-symptoms').value.trim();
    patientInfo.priority = document.getElementById('patient-priority').value;
    patientInfo.pupilsReactive = document.getElementById('pupils-reactive').checked;

    const item = {
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        bpSys: document.getElementById('bp-sys').value.trim(),
        bpDia: document.getElementById('bp-dia').value.trim(),
        pulse: document.getElementById('pulse').value.trim(),
        spo2: document.getElementById('spo2').value.trim(),
        o2Delivery: document.getElementById('o2-delivery').value,
        o2Flow: document.getElementById('o2-flow').value.trim(),
        rrate: document.getElementById('rrate').value.trim(),
        hgt: document.getElementById('hgt').value.trim(),
        temp: document.getElementById('temp').value.trim(),
        capRefill: document.getElementById('cap-refill').value.trim(),
        pupilLeft: document.getElementById('pupil-left').value.trim(),
        pupilRight: document.getElementById('pupil-right').value.trim(),
        pain: document.getElementById('pain').value.trim(),
        ecg: document.getElementById('ecg').value,
        painLocation: document.getElementById('pain-location').value.trim(),
        skin: document.getElementById('skin').value,
        pupilsReactive: document.getElementById('pupils-reactive').checked
    };

    // Prepend newest
    vitalsLog.unshift(item);
    // Keep only reasonable history length
    if (vitalsLog.length > 200) vitalsLog.length = 200;

    saveToLocalStorage();
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
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
        // Remove color classes
        el.classList.remove('vital-normal', 'vital-abnormal', 'vital-critical');
    });
}

/**
 * Render vitals log
 */
export function renderVitalsLog() {
    const el = document.getElementById('vitals-log');
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
    container.innerHTML = '';
    
    if (vitalsLog.length < 2) return;
    
    // Create BP trend chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'vitals-chart';
    
    const chartTitle = document.createElement('div');
    chartTitle.className = 'chart-title';
    chartTitle.textContent = 'BP Trend (Systolic)';
    container.appendChild(chartTitle);
    
    const maxBP = Math.max(...vitalsLog.map(v => parseInt(v.bpSys) || 0));
    const minBP = Math.min(...vitalsLog.map(v => parseInt(v.bpSys) || 0));
    
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
