/**
 * CPR Module
 * Handles CPR metronome, events, and timeline tracking
 */

// Import patient management
import { patientInfo, currentPatientId, patients } from './patient.js';
import { nowTimestamp, getValue, setValue, q } from './utils.js';

// Global CPR data
let cprLog = [];
let cprEvents = [];
let cprTimeline = [];
let currentRhythm = 'unknown';

// Metronome variables
let metronomeInterval = null;
let metronomeRate = 100;
let compressionCount = 0;
let cycleCount = 0;
let cycleTarget = 120; // 2 minutes at 60 compressions/min
let cprStartTime = null;
let cprTimerInterval = null;
let audioContext = null;
let oscillator = null;
let gainNode = null;

/**
 * Load CPR data from localStorage
 */
export function loadFromLocalStorage() {
    const savedCPR = localStorage.getItem('cprLog');
    if (savedCPR) cprLog = JSON.parse(savedCPR);
    
    const savedEvents = localStorage.getItem('cprEvents');
    if (savedEvents) cprEvents = JSON.parse(savedEvents);
    
    const savedTimeline = localStorage.getItem('cprTimeline');
    if (savedTimeline) cprTimeline = JSON.parse(savedTimeline);
}

/**
 * Save CPR data to localStorage
 */
export function saveToLocalStorage() {
    localStorage.setItem('cprLog', JSON.stringify(cprLog));
    localStorage.setItem('cprEvents', JSON.stringify(cprEvents));
    localStorage.setItem('cprTimeline', JSON.stringify(cprTimeline));
}

/**
 * Initialize audio context for metronome
 */
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

/**
 * Play metronome beep
 */
function playBeep() {
    if (!getValue('audio-enabled', false)) return;
    
    initAudioContext();
    
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

/**
 * Update metronome rate
 */
export function updateMetronomeRate(value) {
    metronomeRate = parseInt(value);
    const rv = q('rate-value'); if (rv) rv.textContent = value;
    const mr = q('metronome-rate'); if (mr) mr.textContent = value;
    
    if (metronomeInterval) {
        stopMetronome();
        startMetronome();
    }
}

/**
 * Toggle metronome
 */
export function toggleMetronome() {
    if (metronomeInterval) {
        stopMetronome();
    } else {
        startMetronome();
    }
}

/**
 * Start metronome
 */
function startMetronome() {
    if (!cprStartTime) {
        cprStartTime = Date.now();
        startCPRTimer();
        
        // Add CPR session start to timeline
        cprTimeline.unshift({
            time: nowTimestamp(),
            iso: new Date().toISOString(),
            type: 'session-start',
            details: 'CPR started'
        });
        saveToLocalStorage();
        renderCprTimeline();
    }
    
    const interval = 60000 / metronomeRate;
    
    metronomeInterval = setInterval(() => {
        playBeep();
        flashBeatIndicator();
        updateCompressionCount();
    }, interval);
    
    const ms = q('metronome-start'); if (ms) ms.textContent = 'Stop';
    const md = q('metronome-display'); if (md && md.classList) md.classList.add('active');
}

/**
 * Stop metronome
 */
function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    
    const ms = q('metronome-start'); if (ms) ms.textContent = 'Start';
    const md = q('metronome-display'); if (md && md.classList) md.classList.remove('active');
    const mb = q('metronome-beat'); if (mb && mb.classList) mb.classList.remove('active');
}

/**
 * Flash beat indicator
 */
function flashBeatIndicator() {
    const beatIndicator = q('metronome-beat');
    if (!beatIndicator) return;
    if (beatIndicator.classList) beatIndicator.classList.add('active');
    setTimeout(() => {
        if (beatIndicator.classList) beatIndicator.classList.remove('active');
    }, 200);
}

/**
 * Update compression count
 */
function updateCompressionCount() {
    compressionCount++;
    const cc = q('compression-counter'); if (cc) cc.textContent = compressionCount;
    
    // Check if we've reached 2 minutes (120 compressions at 60/min)
    if (compressionCount >= cycleTarget) {
        // Pause metronome
        stopMetronome();
        
        // Show pulse check modal
        const pcm = q('pulse-check-modal'); if (pcm) pcm.style.display = 'block';
    }
    
    const currentCycle = Math.ceil(compressionCount / cycleTarget);
    const cycleProgress = compressionCount % cycleTarget || cycleTarget;
    const ccy = q('compression-cycle'); if (ccy) ccy.textContent = `Cycle: ${currentCycle}/${cycleProgress}`;
}

/**
 * Reset metronome
 */
export function resetMetronome() {
    stopMetronome();
    compressionCount = 0;
    cycleCount = 0;
    cprStartTime = null;
    
    if (cprTimerInterval) {
        clearInterval(cprTimerInterval);
        cprTimerInterval = null;
    }
    
    const cc = q('compression-counter'); if (cc) cc.textContent = '0';
    const ccy = q('compression-cycle'); if (ccy) ccy.textContent = 'Cycle: 0/0';
    const ct = q('cpr-timer'); if (ct) ct.textContent = '00:00';
}

/**
 * Start CPR timer
 */
function startCPRTimer() {
    cprTimerInterval = setInterval(() => {
        const elapsed = Date.now() - cprStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const ct = q('cpr-timer'); if (ct) ct.textContent = display;
    }, 1000);
}

/**
 * Format duration
 */
function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Close pulse check modal
 */
export function closePulseCheckModal() {
    const pcm = q('pulse-check-modal'); if (pcm) pcm.style.display = 'none';
}

/**
 * Pulse detected - stop CPR
 */
export function pulseDetected() {
    closePulseCheckModal();
    
    // Add to timeline
    cprTimeline.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'pulse-check',
        details: 'Pulse detected - CPR stopped'
    });
    
    // End CPR session
    if (cprStartTime) {
        const duration = formatDuration(Date.now() - cprStartTime);
        
        cprLog.unshift({
            time: nowTimestamp(),
            iso: new Date().toISOString(),
            duration: duration,
            rate: metronomeRate,
            cycles: Math.ceil(compressionCount / cycleTarget),
            rhythm: currentRhythm
        });
        
        // Add session end to timeline
        cprTimeline.unshift({
            time: nowTimestamp(),
            iso: new Date().toISOString(),
            type: 'session-end',
            details: `CPR stopped after ${duration} - Pulse detected`
        });
    }
    
    resetMetronome();
    saveToLocalStorage();
    renderCprLog();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * No pulse detected - continue CPR
 */
export function noPulseDetected() {
    closePulseCheckModal();
    
    // Add to timeline
    cprTimeline.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'pulse-check',
        details: 'No pulse detected - CPR continued'
    });
    
    // Reset compression count but continue metronome
    compressionCount = 0;
    cycleCount++;
    const ccy = q('compression-cycle'); if (ccy) ccy.textContent = `Cycle: ${cycleCount}/0`;
    
    // Continue CPR
    startMetronome();
    saveToLocalStorage();
    renderCprTimeline();
}

/**
 * Get rhythm name
 */
function getRhythmName(value) {
    const rhythmNames = {
        'unknown': 'Unknown',
        'vf': 'VF (Ventricular Fibrillation)',
        'vt': 'VT (Ventricular Tachycardia)',
        'asystole': 'Asystole',
        'pea': 'PEA (Pulseless Electrical Activity)'
    };
    return rhythmNames[value] || value;
}

/**
 * Log rhythm change
 */
export function logRhythmChange() {
    const sel = q('rhythm-select');
    const rhythm = sel ? sel.value : '';
    if (!rhythm) {
        alert('Please select a rhythm');
        return;
    }
    
    currentRhythm = rhythm;
    
    // Add to events log
    cprEvents.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'rhythm',
        details: rhythm
    });
    
    // Add to timeline
    cprTimeline.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'rhythm',
        details: `Rhythm: ${getRhythmName(rhythm)}`
    });
    
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Log shock delivery
 */
export function logShock() {
    const energy = getValue('shock-energy');
    if (!energy || energy <= 0) {
        alert('Please enter a valid energy level');
        return;
    }
    
    // Add to events log
    cprEvents.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'shock',
        details: `${energy}J`
    });
    
    // Add to timeline
    cprTimeline.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'shock',
        details: `Shock delivered: ${energy}J`
    });
    
    setValue('shock-energy','');
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Handle medication change
 */
export function handleMedicationChange() {
    const medication = getValue('medication-select');
    const otherGroup = q('other-med-group');
    const epiGroup = q('epi-dose-group');
    
    // Hide all special groups first
    if (otherGroup) otherGroup.style.display = 'none';
    if (epiGroup) epiGroup.style.display = 'none';
    
    if (medication === 'other') {
        if (otherGroup) otherGroup.style.display = 'block';
    } else if (medication === 'epinephrine') {
        if (epiGroup) epiGroup.style.display = 'block';
    }
}

/**
 * Log medication administration
 */
export function logMedication() {
    const medication = getValue('medication-select');
    if (!medication) {
        alert('Please select a medication');
        return;
    }
    
    let details = medication;
    
    if (medication === 'other') {
        const otherMed = getValue('other-medication');
        if (!otherMed) {
            alert('Please specify medication');
            return;
        }
        details = otherMed;
    } else if (medication === 'epinephrine') {
        const dose = getValue('epi-dose');
        const interval = getValue('epi-interval');
        details = `Epinephrine ${dose}mg every ${interval} min`;
    }
    
    // Add to events log
    cprEvents.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'medication',
        details: details
    });
    
    // Add to timeline
    cprTimeline.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'medication',
        details: `Medication: ${details}`
    });
    
    // Reset form
    setValue('medication-select','');
    setValue('other-medication','');
    setValue('epi-dose','1');
    
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Handle intervention change
 */
export function handleInterventionChange() {
    const intervention = getValue('intervention-select');
    const otherGroup = q('other-int-group');
    const notesGroup = q('int-notes-group');
    
    // Hide all special groups first
    if (otherGroup) otherGroup.style.display = 'none';
    if (notesGroup) notesGroup.style.display = 'none';
    
    if (intervention === 'other-int') {
        if (otherGroup) otherGroup.style.display = 'block';
        if (notesGroup) notesGroup.style.display = 'block';
    } else if (intervention) {
        if (notesGroup) notesGroup.style.display = 'block';
    }
}

/**
 * Log intervention
 */
export function logIntervention() {
    const intervention = getValue('intervention-select');
    if (!intervention) {
        alert('Please select an intervention');
        return;
    }
    
    let details = intervention;
    
    if (intervention === 'other-int') {
        const otherInt = getValue('other-intervention');
        if (!otherInt) {
            alert('Please specify intervention');
            return;
        }
        details = otherInt;
    }
    
    const notes = getValue('intervention-notes');
    if (notes) {
        details += ` - ${notes}`;
    }
    
    // Add to events log
    cprEvents.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'intervention',
        details: details
    });
    
    // Add to timeline
    cprTimeline.unshift({
        time: nowTimestamp(),
        iso: new Date().toISOString(),
        type: 'intervention',
        details: `Intervention: ${details}`
    });
    
    // Reset form
    setValue('intervention-select','');
    setValue('other-intervention','');
    setValue('intervention-notes','');
    
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Render CPR log
 */
export function renderCprLog() {
    const el = document.getElementById('cpr-log');
    if (!el) return; // Defensive guard
    
    el.innerHTML = '';
    if (cprLog.length === 0) {
        el.innerHTML = '<div class="log-item meta">No CPR sessions recorded</div>';
        return;
    }
    
    cprLog.forEach(session => {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `
            <div><strong>${session.time}</strong> — CPR Session</div>
            <div>Duration: ${session.duration} | Rate: ${session.rate} bpm | Cycles: ${session.cycles} | Rhythm: ${getRhythmName(session.rhythm)}</div>
        `;
        el.appendChild(div);
    });
}

/**
 * Render CPR events
 */
export function renderCprEvents() {
    const el = document.getElementById('cpr-events-log');
    if (!el) return;
    
    el.innerHTML = '';
    if (cprEvents.length === 0) { 
        el.innerHTML = '<div class="log-item meta">No CPR events recorded</div>'; 
        return; 
    }
    
    cprEvents.forEach(event => {
        const div = document.createElement('div');
        div.className = 'cpr-event';
        
        let eventClass = '';
        let eventLabel = '';
        
        switch(event.type) {
            case 'rhythm':
                eventClass = 'event-rhythm';
                eventLabel = 'RHYTHM';
                break;
            case 'shock':
                eventClass = 'event-shock';
                eventLabel = 'SHOCK';
                break;
            case 'medication':
                eventClass = 'event-medication';
                eventLabel = 'MEDICATION';
                break;
            case 'intervention':
                eventClass = 'event-intervention';
                eventLabel = 'INTERVENTION';
                break;
        }
        
        div.innerHTML = `
            <div class="cpr-event-time">${event.time}</div>
            <div class="cpr-event-details">
                <span class="cpr-event-type ${eventClass}">${eventLabel}</span>
                ${event.details}
            </div>
        `;
        
        el.appendChild(div);
    });
}

/**
 * Render CPR timeline
 */
export function renderCprTimeline() {
    const el = document.getElementById('cpr-timeline-log');
    if (!el) return;
    
    el.innerHTML = '';
    if (cprTimeline.length === 0) { 
        el.innerHTML = '<div class="log-item meta">No CPR timeline events recorded</div>'; 
        return; 
    }
    
    cprTimeline.forEach(event => {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `<div><strong>${event.time}</strong> — ${event.details}</div>`;
        el.appendChild(div);
    });
}

// Compatibility wrappers expected by the UI
export function startCPR() { startMetronome(); }
export function stopCPR() { stopMetronome(); }
export function addCprEvent() {
    const details = prompt('Add CPR event (brief):');
    if (!details) return;
    const item = { time: nowTimestamp(), iso: new Date().toISOString(), type: 'note', details };
    cprEvents.unshift(item);
    cprTimeline.unshift(item);
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}
export const togglePauseCPR = toggleMetronome;
