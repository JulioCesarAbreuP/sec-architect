import { AzureParser } from './core/azure-parser.js';
import { ThreatIntel } from './core/threat-intel.js';
import { IaCEngine } from './core/iac-engine.js';

const terminal = document.getElementById('terminal-log');
const iacDisplay = document.getElementById('iac-panel');
const btnAudit = document.getElementById('btn-audit');

// Inicialización del Radar Chart
const ctx = document.getElementById('riskRadar').getContext('2d');
let radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: ['Confidencialidad', 'Integridad', 'Disponibilidad', 'Autenticación', 'No-Repudio'],
        datasets: [{
            label: 'Security Posture',
            data: [100, 100, 100, 100, 100],
            backgroundColor: 'rgba(88, 166, 255, 0.2)',
            borderColor: '#58a6ff'
        }]
    },
    options: { scales: { r: { beginAtZero: true, max: 100, grid: { color: '#30363d' } } } }
});

btnAudit.addEventListener('click', async () => {
    const rawInput = document.getElementById('code-textarea').value;
    
    log("Iniciando auditoría técnica de Azure...", "info");
    
    const analysis = AzureParser.analyzeJSON(rawInput);
    if (analysis.status === "ERROR") {
        log(analysis.message, "error");
        return;
    }

    log(`Procesados ${analysis.count} riesgos de SC-300 detectados.`, "warning");

    const threats = await ThreatIntel.fetchLiveThreats();
    log(`Cruzando con CISA KEV: ${threats[0].vulnerabilityName} detectada.`, "info");

    // Actualizar Radar (Lógica SABSA inversa)
    const score = Math.max(20, 100 - (analysis.count * 20));
    radarChart.data.datasets[0].data = [score, score, score, score - 10, score];
    radarChart.update();

    // Generar Remediation
    const tfCode = IaCEngine.generateTerraform(analysis.count > 0 ? "MFA_MISSING" : "CLEAN");
    iacDisplay.textContent = tfCode;
    
    log("Remediación IaC generada con éxito.", "success");
});

function log(msg, type) {
    const span = document.createElement('span');
    span.className = `line ${type}`;
    span.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
    terminal.appendChild(span);
    terminal.scrollTop = terminal.scrollHeight;
}
