/**
 * Results Module
 * Generates handover reports in different formats
 */

// Import patient management
import { patientInfo } from './patient.js';
import { getVitalsLog } from './vitals.js';
import { getGcsLog } from './gcs.js';
import { getNotesLog } from './notes.js';
import { getValue, q } from './utils.js';

/**
 * Generate handover results
 */
export function generateResults() {
    // Ensure patient info up to date (use safe getters)
    patientInfo.responderId = getValue('responder-id');
    const vitalsLog = getVitalsLog();
    const gcsLog = getGcsLog();
    const notesLog = getNotesLog();

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

    const showTS = getValue('show-timestamps', false);
    const useSbarFormat = getValue('sbar-format', false);
    
    let report = '';
    
    if (useSbarFormat) {
        report = `--- SBAR HANDOVER REPORT ---\n\n`;
        
        report += `SITUATION:\n`;
        report += `${patientInfo.name || 'Unknown'}, ${patientInfo.age || 'Unknown'}y/o, ${patientInfo.incident || 'Unknown incident'}\n`;
        report += `Responder: ${patientInfo.responderId || 'Unknown'}\n\n`;
        
        report += `BACKGROUND:\n`;
        report += `Allergies: ${patientInfo.allergies || 'None known'}\n`;
        report += `Medications: ${patientInfo.medication || 'None'}\n`;
        report += `History: ${patientInfo.history || 'None'}\n\n`;
        
        report += `ASSESSMENT:\n`;
        // Add vitals summary
        if (vitalsLog.length > 0) {
            const latest = vitalsLog[0];
            report += `Latest vitals (${latest.time}):\n`;
            if (latest.bpSys && latest.bpDia) report += `- BP: ${latest.bpSys}/${latest.bpDia} mmHg\n`;
            if (latest.pulse) report += `- Pulse: ${latest.pulse} bpm\n`;
            if (latest.spo2) report += `- SPO₂: ${latest.spo2}%\n`;
            if (latest.rrate) report += `- RR: ${latest.rrate}/min\n`;
            if (latest.temp) report += `- Temp: ${latest.temp}°C\n`;
            if (latest.ecg) report += `- ECG: ${latest.ecg}\n`;
            if (latest.skin) report += `- Skin: ${latest.skin}\n`;
        }
        
        // Add GCS
        if (gcsLog.length > 0) {
            report += `GCS: ${gcsLog[0].total}/15 (E${gcsLog[0].eye} V${gcsLog[0].verbal} M${gcsLog[0].motor})\n`;
        }
        
        report += `\nRECOMMENDATION:\n`;
        report += `[Add your recommendation here]\n\n`;
        
        // Only include signs/symptoms if there's content
        if (patientInfo.signsSymptoms) {
            report += `--- SIGNS / SYMPTOMS ---\n\n`;
            report += patientInfo.signsSymptoms + '\n\n';
        }
        
        report += `--- ADDITIONAL NOTES ---\n\n`;
        if (notesLog.length === 0) report += '(none)\n';
        else {
            notesLog.forEach(n => {
                report += `${showTS ? n.time + ' - ' : '' }${n.note}\n`;
            });
        }
    } else {
        // Use original format
        report = `--- PATIENT HANDOVER REPORT ---\n\n`;
        
        const addLine = (label, value, unit='') => { 
            if (value && String(value).trim() !== '') report += `${label.padEnd(15)}: ${value}${unit}\n`; 
        };

        addLine('Responder ID', patientInfo.responderId);
        addLine('Name', patientInfo.name);
        addLine('Age', patientInfo.age);
        addLine('Priority', patientInfo.priority);
        addLine('Incident', patientInfo.incident);
        addLine('Allergies', patientInfo.allergies);
        addLine('Medication', patientInfo.medication);
        addLine('Past History', patientInfo.history);
        addLine('Last Intake', patientInfo.lastIntake);

        report += `\n--- VITALS ---\n\n`;

        // For each vitals entry, output only fields that exist
        if (vitalsLog.length === 0) report += 'No vitals recorded\n';
        else {
            vitalsLog.forEach(v => {
                if (v.bpSys && v.bpDia) {
                    report += `BP             : ${v.bpSys}/${v.bpDia} mmHg${ showTS ? ' ' + v.time : '' }\n`;
                }
                if (v.pulse) report += `Pulse          : ${v.pulse} bpm${ showTS ? ' ' + v.time : '' }\n`;
                if (v.spo2) {
                    report += `SPO₂           : ${v.spo2}%${ showTS ? ' ' + v.time : '' }\n`;
                    if (v.o2Delivery) report += ` (${v.o2Delivery})\n`;
                }
                if (v.rrate) report += `Resp Rate      : ${v.rrate}/min${ showTS ? ' ' + v.time : '' }\n`;
                if (v.hgt) report += `HGT            : ${v.hgt} mmol/L${ showTS ? ' ' + v.time : '' }\n`;
                if (v.temp) report += `Temperature    : ${v.temp} °C${ showTS ? ' ' + v.time : '' }\n`;
                if (v.capRefill) report += `Cap Refill     : ${v.capRefill} s${ showTS ? ' ' + v.time : '' }\n`;
                if (v.pupilLeft || v.pupilRight) {
                    const pupilText = `Pupils         : L${v.pupilLeft || ''} R${v.pupilRight || ''}`;
                    if (v.pupilsReactive) {
                        report += `${pupilText} (Reactive)${ showTS ? ' ' + v.time : '' }\n`;
                    } else {
                        report += `${pupilText}${ showTS ? ' ' + v.time : '' }\n`;
                    }
                }
                if (v.pain) report += `Pain           : ${v.pain} /10${ showTS ? ' ' + v.time : '' }\n`;
                if (v.ecg) report += `ECG            : ${v.ecg}${ showTS ? ' ' + v.time : '' }\n`;
                if (v.painLocation) report += `Pain Location  : ${v.painLocation}${ showTS ? ' ' + v.time : '' }\n`;
                if (v.skin) report += `Skin           : ${v.skin}${ showTS ? ' ' + v.time : '' }\n`;
                // small spacer between entries for readability
                report += '\n';
            });
        }

        report += `\n--- GCS ---\n\n`;
        if (gcsLog.length === 0) report += 'No GCS recorded\n\n';
        else {
            gcsLog.forEach(g => {
                report += `Total GCS Score: ${g.total} / 15 (E${g.eye} V${g.verbal} M${g.motor})${ showTS ? ' ' + g.time : '' }\n\n`;
            });
        }

        // Only include signs/symptoms if there's content
        if (patientInfo.signsSymptoms) {
            report += `--- SIGNS / SYMPTOMS ---\n\n`;
            report += patientInfo.signsSymptoms + '\n\n';
        }

        report += `--- ADDITIONAL NOTES ---\n\n`;
        if (notesLog.length === 0) report += '(none)\n';
        else {
            notesLog.forEach(n => {
                report += `${showTS ? n.time + ' - ' : '' }${n.note}\n`;
            });
        }
    }

    const out = q('results-output');
    if (out) out.value = report;
    else console.warn('results-output element not found');
}

/**
 * Show results modal
 */
export function showResults() {
    const modal = q('results-modal');
    if (modal) modal.style.display = 'block';
    generateResults();
}

/**
 * Close results modal
 */
export function closeResults() {
    const modal = q('results-modal');
    if (modal) modal.style.display = 'none';
}

/**
 * Copy results to clipboard
 */
export function copyResults() {
    const resultsArea = q('results-output');
    if (!resultsArea || !resultsArea.value) { 
        alert('Generate results first'); 
        return; 
    }
    
    resultsArea.select();
    navigator.clipboard.writeText(resultsArea.value).then(
        () => alert('Results copied to clipboard!'), 
        () => alert('Copy failed')
    );
}

/**
 * Download results as text file
 */
export function downloadReport() {
    const out = q('results-output');
    const txt = out ? out.value : '';
    if (!txt) { 
        alert('Generate results first'); 
        return; 
    }
    
    const blob = new Blob([txt], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handover_${new Date().toISOString().replace(/[:.]/g,'-')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
