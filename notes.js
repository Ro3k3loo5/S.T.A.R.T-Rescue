/**
 * Notes Module
 * Handles patient notes and audio recording
 */

// Import patient management
import { patientInfo, currentPatientId, patients, saveToLocalStorage } from './patient.js';
import { nowTimestamp, getValue, setValue, q } from './utils.js';

// Global notes data
let notesLog = []; // newest first

// Audio recording variables
let mediaRecorder;
let audioChunks = []; 

export function getNotesLog() { return notesLog; }

export function setupAudioRecorder() { initAudioRecording(); }


/**
 * Load notes data from localStorage
 */
export function loadFromLocalStorage() {
    const savedNotes = localStorage.getItem('notesLog');
    if (savedNotes) notesLog = JSON.parse(savedNotes);
}

/**
 * Persist notes into the current patient object and save using patient.saveToLocalStorage
 */
export function persistNotes() {
    if (currentPatientId) {
        patients[currentPatientId] = patients[currentPatientId] || { info: {...patientInfo}, vitals: [], gcs: [], notes: [] };
        patients[currentPatientId].notes = [...notesLog];
        saveToLocalStorage();
    }
}

export function setNotesLog(arr) {
    notesLog = Array.isArray(arr) ? [...arr] : [];
    renderNotesLog();
}

/**
 * Add a new note
 */
export function addNote() {
    const text = getValue('general-note').trim();
    if (!text) { 
        alert('Add a note before hitting Add Note'); 
        return; 
    }
    
    notesLog.unshift({ 
        time: nowTimestamp(), 
        iso: new Date().toISOString(), 
        note: text 
    });
    
    if (notesLog.length > 200) notesLog.length = 200;
    
    persistNotes();
    renderNotesLog();
    setValue('general-note', '');
}

/**
 * Clear note input
 */
export function clearNoteInput() { 
    setValue('general-note', ''); 
    // Also clear audio notes display
    const audioEl = q('audio-notes'); if (audioEl) audioEl.innerHTML = '';
    // Remove audio notes from notesLog
    notesLog = notesLog.filter(note => !note.audioData);
    persistNotes();
    renderNotesLog();
}

/**
 * Render notes log
 */
export function renderNotesLog() {
    const el = document.getElementById('notes-log');
    if (!el) return; // Defensive guard
    el.innerHTML = '';
    if (notesLog.length === 0) {
        el.innerHTML = '<div class="log-item meta">No notes added</div>';
        return;
    }
    
    notesLog.forEach(n => {
        const div = document.createElement('div');
        div.className = 'log-item';
        div.innerHTML = `<div><strong>${n.time}</strong> — ${n.note}</div>`;
        el.appendChild(div);
    });
}

/**
 * Audio recording functionality
 */
export function initAudioRecording() {
    const recordButton = document.getElementById('record-note');
    if (!recordButton) return;
    
    recordButton.addEventListener('click', function() {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            this.textContent = "Record Audio Note";
            this.classList.remove("btn-primary");
            this.classList.add("btn-secondary");
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.start();
                    
                    mediaRecorder.addEventListener("dataavailable", event => {
                        audioChunks.push(event.data);
                    });
                    
                    mediaRecorder.addEventListener("stop", () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = new Audio(audioUrl);
                        
                        const audioContainer = q('audio-notes');
                        const audioItem = document.createElement('div');
                        audioItem.className = 'log-item';
                        
                        const timestamp = nowTimestamp();
                        audioItem.innerHTML = `
                            <div><strong>${timestamp}</strong> - Audio Note</div>
                            <audio controls src="${audioUrl}"></audio>
                        `;
                        
                        if (audioContainer) audioContainer.insertBefore(audioItem, audioContainer.firstChild);
                        
                        // Save audio data
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = function() {
                            notesLog.unshift({ 
                                time: timestamp, 
                                iso: new Date().toISOString(), 
                                note: "[Audio recording]",
                                audioData: reader.result
                            });
                            if (notesLog.length > 200) notesLog.length = 200;
                            persistNotes();
                            renderNotesLog();
                        };
                        
                        audioChunks = [];
                    });
                })
                .catch(err => {
                    console.error("Error accessing microphone:", err);
                    alert("Could not access microphone. Audio recording unavailable.");
                });
        }
    });
}
