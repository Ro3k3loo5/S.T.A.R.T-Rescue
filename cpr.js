/**
 * CPR Module
 * Handles CPR metronome, events, and timeline tracking
 */

// Import patient management
import { patientInfo, currentPatientId, patients, saveToLocalStorage } from './patient.js';

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
    if (!document.getElementById('audio-enabled').checked) return;
    
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
    document.getElementById('rate-value').textContent = value;
    document.getElementById('metronome-rate').textContent = value;
    
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
    
    document.getElementById('metronome-start').textContent = 'Stop';
    document.getElementById('metronome-display').classList.add('active');
}

/**
 * Stop metronome
 */
function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    
    document.getElementById('metronome-start').textContent = 'Start';
    document.getElementById('metronome-display').classList.remove('active');
    document.getElementById('metronome-beat').classList.remove('active');
}

/**
 * Flash beat indicator
 */
function flashBeatIndicator() {
    const beatIndicator = document.getElementById('metronome-beat');
    beatIndicator.classList.add('active');
    setTimeout(() => {
        beatIndicator.classList.remove('active');
    }, 200);
}

/**
 * Update compression count
 */
function updateCompressionCount() {
    compressionCount++;
    document.getElementById('compression-counter').textContent = compressionCount;
    
    // Check if we've reached 2 minutes (120 compressions at 60/min)
    if (compressionCount >= cycleTarget) {
        // Pause metronome
        stopMetronome();
        
        // Show pulse check modal
        document.getElementById('pulse-check-modal').style.display = 'block';
    }
    
    const currentCycle = Math.ceil(compressionCount / cycleTarget);
    const cycleProgress = compressionCount % cycleTarget || cycleTarget;
    document.getElementById('compression-cycle').textContent = `Cycle: ${currentCycle}/${cycleProgress}`;
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
    
    document.getElementById('compression-counter').textContent = '0';
    document.getElementById('compression-cycle').textContent = 'Cycle: 0/0';
    document.getElementById('cpr-timer').textContent = '00:00';
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
        document.getElementById('cpr-timer').textContent = display;
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
    document.getElementById('pulse-check-modal').style.display = 'none';
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
    document.getElementById('compression-cycle').textContent = `Cycle: ${cycleCount}/0`;
    
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
    const rhythm = document.getElementById('rhythm-select').value;
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
    const energy = document.getElementById('shock-energy').value;
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
    
    document.getElementById('shock-energy').value = '';
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Handle medication change
 */
export function handleMedicationChange() {
    const medication = document.getElementById('medication-select').value;
    const otherGroup = document.getElementById('other-med-group');
    const epiGroup = document.getElementById('epi-dose-group');
    
    // Hide all special groups first
    otherGroup.style.display = 'none';
    epiGroup.style.display = 'none';
    
    if (medication === 'other') {
        otherGroup.style.display = 'block';
    } else if (medication === 'epinephrine') {
        epiGroup.style.display = 'block';
    }
}

/**
 * Log medication administration
 */
export function logMedication() {
    const medication = document.getElementById('medication-select').value;
    if (!medication) {
        alert('Please select a medication');
        return;
    }
    
    let details = medication;
    
    if (medication === 'other') {
        const otherMed = document.getElementById('other-medication').value;
        if (!otherMed) {
            alert('Please specify medication');
            return;
        }
        details = otherMed;
    } else if (medication === 'epinephrine') {
        const dose = document.getElementById('epi-dose').value;
        const interval = document.getElementById('epi-interval').value;
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
    document.getElementById('medication-select').value = '';
    document.getElementById('other-medication').value = '';
    document.getElementById('epi-dose').value = '1';
    
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Handle intervention change
 */
export function handleInterventionChange() {
    const intervention = document.getElementById('intervention-select').value;
    const otherGroup = document.getElementById('other-int-group');
    const notesGroup = document.getElementById('int-notes-group');
    
    // Hide all special groups first
    otherGroup.style.display = 'none';
    notesGroup.style.display = 'none';
    
    if (intervention === 'other-int') {
        otherGroup.style.display = 'block';
        notesGroup.style.display = 'block';
    } else if (intervention) {
        notesGroup.style.display = 'block';
    }
}

/**
 * Log intervention
 */
export function logIntervention() {
    const intervention = document.getElementById('intervention-select').value;
    if (!intervention) {
        alert('Please select an intervention');
        return;
    }
    
    let details = intervention;
    
    if (intervention === 'other-int') {
        const otherInt = document.getElementById('other-intervention').value;
        if (!otherInt) {
            alert('Please specify intervention');
            return;
        }
        details = otherInt;
    }
    
    const notes = document.getElementById('intervention-notes').value;
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
    document.getElementById('intervention-select').value = '';
    document.getElementById('other-intervention').value = '';
    document.getElementById('intervention-notes').value = '';
    
    saveToLocalStorage();
    renderCprEvents();
    renderCprTimeline();
}

/**
 * Render CPR log
 */
export function renderCprLog() {
    const el = document.getElementById('cpr-log');
    if (!el) return;
    
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
