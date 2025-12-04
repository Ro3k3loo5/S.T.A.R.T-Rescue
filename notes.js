/**
 * Notes Module
 * Handles patient notes and audio recording
 */

// Import patient management
import { patientInfo, currentPatientId, patients, saveToLocalStorage } from './patient.js';

// Global notes data
let notesLog = []; // newest first

// Audio recording variables
let mediaRecorder;
let audioChunks = [];

/**
 * Load notes data from localStorage
 */
export function loadFromLocalStorage() {
    const savedNotes = localStorage.getItem('notesLog');
    if (savedNotes) notesLog = JSON.parse(savedNotes);
}

/**
 * Save notes data to localStorage
 */
export function saveToLocalStorage() {
    localStorage.setItem('notesLog', JSON.stringify(notesLog));
}

/**
 * Add a new note
 */
export function addNote() {
    const text = document.getElementById('general-note').value.trim();
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
    
    saveToLocalStorage();
    renderNotesLog();
    document.getElementById('general-note').value = '';
}

/**
 * Clear note input
 */
export function clearNoteInput() { 
    document.getElementById('general-note').value = ''; 
    // Also clear audio notes display
    document.getElementById('audio-notes').innerHTML = '';
    // Remove audio notes from notesLog
    notesLog = notesLog.filter(note => !note.audioData);
    saveToLocalStorage();
    renderNotesLog();
}

/**
 * Render notes log
 */
export function renderNotesLog() {
    const el = document.getElementById('notes-log');
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
                        
                        const audioContainer = document.getElementById('audio-notes');
                        const audioItem = document.createElement('div');
                        audioItem.className = 'log-item';
                        
                        const timestamp = nowTimestamp();
                        audioItem.innerHTML = `
                            <div><strong>${timestamp}</strong> - Audio Note</div>
                            <audio controls src="${audioUrl}"></audio>
                        `;
                        
                        audioContainer.insertBefore(audioItem, audioContainer.firstChild);
                        
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
                            saveToLocalStorage();
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
