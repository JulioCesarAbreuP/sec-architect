/* --- Datos base --- */
const SABSA_ATTRIBUTES = ['Confidencialidad','Integridad','Disponibilidad','Resiliencia','Auditabilidad'];

const RULES = [
    { id:'SC-300-01', name:'MFA Phishing-Resistant', attr:'Confidencialidad' },
    { id:'AZ-305-05', name:'Network Micro-Segmentation', attr:'Disponibilidad' },
    { id:'AZ-104-12', name:'RBAC Governance', attr:'Integridad' },
    { id:'NIST-RA-05', name:'Risk Assessment', attr:'Resiliencia' },
    { id:'NIST-AU-06', name:'Audit Review, Analysis, and Reporting', attr:'Auditabilidad' }
];

const SCENARIOS = {
    'cred-stuffing': {
        name:'Credential Stuffing',
        attr:'Confidencialidad',
        delta:[30,10,0,5,15],
        sev:'high',
        cliHint:'Revisión de inicios de sesión anómalos y MFA.'
    },
    'excess-priv': {
        name:'Privilegios Excesivos',
        attr:'Integridad',
        delta:[10,40,5,10,20],
        sev:'high',
        cliHint:'Inventario de roles y objetos con privilegios elevados.'
    },
    'no-mfa': {
        name:'Identidad sin MFA',
        attr:'Confidencialidad',
        delta:[35,15,0,5,10],
        sev:'med',
        cliHint:'Detección de cuentas sin MFA habilitado.'
    },
    'segmentation': {
        name:'Segmentación Inconsistente',
        attr:'Disponibilidad',
        delta:[5,15,35,10,10],
        sev:'med',
        cliHint:'Revisión de NSG, rutas y zonas de confianza.'
    },
    'legacy-config': {
        name:'Configuración Legacy',
        attr:'Auditabilidad',
        delta:[10,10,5,15,35],
        sev:'med',
        cliHint:'Identificación de protocolos y configuraciones obsoletas.'
    }
};

const PROFILES = {
    'gov':        { label:'Gobierno Federal Estratégico', weight:[1.2,1.3,1.1,1.2,1.3] },
    'enterprise': { label:'Enterprise Global',       weight:[1.1,1.1,1.1,1.1,1.1] },
    'critical':   { label:'Infraestructura Crítica',weight:[1.1,1.3,1.3,1.2,1.2] },
    'finance':    { label:'Finanzas',               weight:[1.3,1.2,1.0,1.1,1.3] },
    'startup':    { label:'Startup Zero Trust',     weight:[1.2,1.0,1.0,1.2,1.1] }
};

const IG_LEVELS = {
    1: { label:'IG1 · Inicial',      sensitivity:0.6 },
    2: { label:'IG2 · Repetible',    sensitivity:0.8 },
    3: { label:'IG3 · Gestionado',   sensitivity:1.0 },
    4: { label:'IG4 · Optimizado',   sensitivity:1.2 }
};

const MITRE_KNOWLEDGE_BASE = {
    'SC-300': { tactic: 'Initial Access', technique: 'T1078.004', description: 'Cloud Accounts' },
    'AZ-305': { tactic: 'Lateral Movement', technique: 'T1210', description: 'Exploitation of Remote Services' },
    'AZ-104': { tactic: 'Privilege Escalation', technique: 'T1078', description: 'Valid Accounts' },
    'NIST-RA': { tactic: 'Discovery', technique: 'T1595', description: 'Active Scanning' },
    'NIST-AU': { tactic: 'Defense Evasion', technique: 'T1562', description: 'Impair Defenses' }
};

const SCENARIO_MITRE_FALLBACK = {
    'cred-stuffing': { tactic: 'Initial Access', technique: 'T1078', description: 'Valid Accounts' },
    'excess-priv': { tactic: 'Privilege Escalation', technique: 'T1078', description: 'Valid Accounts' },
    'no-mfa': { tactic: 'Initial Access', technique: 'T1078.004', description: 'Cloud Accounts' },
    'segmentation': { tactic: 'Lateral Movement', technique: 'T1210', description: 'Exploitation of Remote Services' },
    'legacy-config': { tactic: 'Defense Evasion', technique: 'T1562', description: 'Impair Defenses' }
};

const MITRE_CATALOG_URL = 'assets/data/azure-mitre-top50.json';

const SEVERITY_MULTIPLIER = { low: 0.88, med: 1.0, high: 1.12 };
const MITRE_RECOMMENDATIONS = {
    'T1078.004': 'Aplicar MFA resistente al phishing y Conditional Access por riesgo.',
    'T1078': 'Reducir cuentas compartidas y aplicar JIT/JEA para privilegios.',
    'T1210': 'Aislar segmentos con micro-segmentación y endurecer servicios remotos.',
    'T1562': 'Proteger telemetría y bloquear manipulación de logs y defensas.',
    'T1595': 'Limitar superficie expuesta y habilitar detección temprana de scanning.'
};

let dynamicMitreCatalog = [];
let isMitreCatalogReady = false;

/* --- DOM --- */
const ruleList = document.getElementById('rule-list');
const consoleEl = document.getElementById('console');
const matrixBody = document.getElementById('matrix-body');
const remediationPanel = document.getElementById('remediation-panel');
const igSelect = document.getElementById('ig-select');
const igBadge = document.getElementById('ig-badge');
const policyJsonInput = document.getElementById('policy-json-input');
const btnRun = document.getElementById('btn-run');
const scenarioSelect = document.getElementById('scenario-select');
const profileSelect = document.getElementById('profile-select');
const targetInput = document.getElementById('target-input');
const doctrinePanel = document.querySelector('.panel-doctrine');
const operationsPanel = document.querySelector('.panel-operations');
const threatPanel = document.querySelector('.panel-threat');
const consoleShell = document.querySelector('.console-shell');
const chartShell = document.querySelector('.chart-shell');
const matrixShell = document.querySelector('.matrix-shell');
const btnExportAI = document.getElementById('btn-export-ai');

function animatePanelTransition(element){
    element.classList.remove('panel-transition');
    void element.offsetWidth;
    element.classList.add('panel-transition');
}

function setActivePanel(panel){
    [doctrinePanel, operationsPanel, threatPanel].forEach(current=> current.classList.remove('is-active'));
    if(panel){
        panel.classList.add('is-active');
        animatePanelTransition(panel);
    }
}

function setExecutionState(isLoading){
    operationsPanel.classList.toggle('is-loading', isLoading);
    btnRun.classList.toggle('is-loading', isLoading);
    consoleShell.classList.toggle('is-live', isLoading);
    consoleEl.classList.toggle('is-streaming', isLoading);
    chartShell.classList.toggle('is-live', isLoading);
}

function setThreatSeverityState(severity){
    threatPanel.classList.remove('sev-low','sev-med','sev-high');
    if(severity){
        threatPanel.classList.add(`sev-${severity}`);
    }
    matrixShell.classList.remove('is-highlighted');
    void matrixShell.offsetWidth;
    matrixShell.classList.add('is-highlighted');
    setTimeout(()=> matrixShell.classList.remove('is-highlighted'), 520);
}

function pulseElement(element){
    element.classList.remove('feedback-flash','is-engaged','is-pressed');
    void element.offsetWidth;
    if(element.matches('.btn-primary')){
        element.classList.add('is-pressed');
        setTimeout(()=> element.classList.remove('is-pressed'),180);
        return;
    }

    element.classList.add('feedback-flash','is-engaged');
    setTimeout(()=>{
        element.classList.remove('feedback-flash','is-engaged');
    },420);
}

function wait(ms){
    return new Promise(resolve=> setTimeout(resolve, ms));
}

function clearChildren(element){
    while(element && element.firstChild){
        element.removeChild(element.firstChild);
    }
}

function clamp(value, min, max){
    return Math.min(max, Math.max(min, value));
}

function hashString(input){
    let hash = 2166136261;
    for(let i=0;i<input.length;i++){
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createDeterministicRng(seedString){
    let seed = hashString(seedString) || 1;
    return ()=>{
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function normalizeSeverity(value){
    if(value === 'high' || value === 'med' || value === 'low'){
        return value;
    }
    return 'med';
}

function normalizeList(value){
    return Array.isArray(value)
        ? value.filter(item=> typeof item === 'string' && item.trim()).map(item=> item.trim())
        : [];
}

function normalizeTechniqueEntry(entry){
    if(!entry || typeof entry !== 'object'){
        return null;
    }

    const technique = typeof entry.technique === 'string' ? entry.technique.trim() : '';
    const tactic = typeof entry.tactic === 'string' ? entry.tactic.trim() : '';
    const description = typeof entry.description === 'string' ? entry.description.trim() : '';
    if(!technique || !tactic || !description){
        return null;
    }

    return {
        technique,
        tactic,
        name: typeof entry.name === 'string' ? entry.name.trim() : 'Technique Mapping',
        description,
        severity: normalizeSeverity(entry.severity),
        scenarios: normalizeList(entry.scenarios),
        attributes: normalizeList(entry.attributes),
        rulePrefixes: normalizeList(entry.rulePrefixes),
        recommendation: typeof entry.recommendation === 'string' ? entry.recommendation.trim() : ''
    };
}

async function loadMitreCatalog(){
    if(isMitreCatalogReady){
        return dynamicMitreCatalog;
    }

    try{
        const response = await fetch(MITRE_CATALOG_URL, { cache: 'no-store' });
        if(!response.ok){
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const normalized = Array.isArray(data)
            ? data.map(normalizeTechniqueEntry).filter(Boolean)
            : [];

        dynamicMitreCatalog = normalized;
        isMitreCatalogReady = dynamicMitreCatalog.length > 0;
    } catch {
        dynamicMitreCatalog = [];
        isMitreCatalogReady = false;
    }

    return dynamicMitreCatalog;
}

/* --- Reglas --- */
RULES.forEach(r=>{
    ruleList.innerHTML += `
        <div class="rule-item">
            <div class="rule-id">[${r.id}]</div>
            <div>${r.name}</div>
            <div class="rule-attr">${r.attr}</div>
        </div>
    `;
});

/* --- Consola --- */
function log(msg, level='info'){
    const ts = new Date().toISOString().slice(11,19);
    let color = '#a5ffb5';
    if(level==='warn') color = 'var(--neon-gold)';
    if(level==='crit') color = 'var(--neon-red)';
    if(level==='sys')  color = '#60a5fa';

    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = `[${ts}] ${msg}`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

const TERRAFORM_MFA_REMEDIATION = [
    'resource "azuread_conditional_access_policy" "enforce_mfa" {',
    '  display_name = "Enforce MFA for Admins"',
    '  state        = "enabled"',
    '  # ... rest of the code',
    '}',
    '',
    'resource "azuread_conditional_access_policy" "enforce_mfa" {',
    '  display_name = "Enforce MFA for Admins"',
    '  state        = "enabled"',
    '  # ... rest of the code',
    '}'
].join('\n');

function renderTerraformRemediationInConsole(){
    const block = document.createElement('section');
    block.className = 'console-remediation';

    const title = document.createElement('p');
    title.className = 'console-remediation-title';
    title.textContent = 'SC-300 FAIL · Terraform Remediation';

    const pre = document.createElement('pre');
    pre.textContent = TERRAFORM_MFA_REMEDIATION;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'console-copy-btn';
    button.textContent = 'COPIAR TERRAFORM';
    button.addEventListener('click', async ()=>{
        try{
            await navigator.clipboard.writeText(TERRAFORM_MFA_REMEDIATION);
            log('Terraform copiado al portapapeles.','sys');
        } catch {
            log('No fue posible copiar Terraform al portapapeles.','warn');
        }
    });

    block.appendChild(title);
    block.appendChild(pre);
    block.appendChild(button);
    consoleEl.appendChild(block);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function parsePolicyJson(raw){
    try{
        return {
            ok: true,
            value: JSON.parse(raw)
        };
    } catch (error){
        return {
            ok: false,
            message: error?.message || 'JSON invalido.'
        };
    }
}

function searchMfaEnforced(node){
    if(node === null || node === undefined){
        return false;
    }

    if(Array.isArray(node)){
        return node.some(item=> searchMfaEnforced(item));
    }

    if(typeof node !== 'object'){
        return false;
    }

    if(typeof node.mfa === 'string' && node.mfa.toLowerCase() === 'enforced'){
        return true;
    }

    const builtInControls = node.grantControls?.builtInControls;
    if(Array.isArray(builtInControls) && builtInControls.some(value=> String(value).toLowerCase() === 'mfa')){
        return true;
    }

    return Object.values(node).some(value=> searchMfaEnforced(value));
}

function deriveTargetFromPolicy(policy, fallbackTarget){
    if(policy && typeof policy === 'object'){
        const preferred = [policy.displayName, policy.name, policy.id, policy.policyId]
            .find(value=> typeof value === 'string' && value.trim());
        if(preferred){
            return preferred.trim();
        }
    }

    const normalizedFallback = String(fallbackTarget || '').trim();
    return normalizedFallback || 'conditional-access-policy';
}

function resolveMitre(ruleId, scenarioKey){
    const mappedRuleKey = Object.keys(MITRE_KNOWLEDGE_BASE).find(prefix=> ruleId.startsWith(prefix));
    if(mappedRuleKey){
        return MITRE_KNOWLEDGE_BASE[mappedRuleKey];
    }

    return SCENARIO_MITRE_FALLBACK[scenarioKey] || null;
}

function getCatalogCandidates(rule, scenarioKey){
    if(!dynamicMitreCatalog.length){
        return [];
    }

    return dynamicMitreCatalog.filter(entry=>{
        const byScenario = entry.scenarios.includes(scenarioKey);
        const byAttribute = entry.attributes.includes(rule.attr);
        const byRulePrefix = entry.rulePrefixes.some(prefix=> rule.id.startsWith(prefix));
        return byScenario || byAttribute || byRulePrefix;
    });
}

function pickMitreForFinding(rule, scenarioKey, rng){
    const candidates = getCatalogCandidates(rule, scenarioKey);
    if(candidates.length > 0){
        const index = Math.floor(rng() * candidates.length);
        return candidates[index];
    }

    return resolveMitre(rule.id, scenarioKey);
}

function buildRiskContext({ scenarioKey, profileKey, igLevel }){
    const scenario = SCENARIOS[scenarioKey];
    const profile = PROFILES[profileKey];
    const igSensitivity = IG_LEVELS[igLevel].sensitivity;
    const severityFactor = SEVERITY_MULTIPLIER[scenario.sev] || 1;
    const weightedAverage = profile.weight.reduce((sum, weight)=> sum + weight, 0) / profile.weight.length;
    const globalPressure = clamp((weightedAverage * igSensitivity * severityFactor) / 1.5, 0.4, 1.35);

    return { scenario, profile, igSensitivity, severityFactor, globalPressure };
}

function evaluateControl(rule, scenarioKey, riskContext, rng){
    const isPrimary = rule.attr === riskContext.scenario.attr;
    const baseFailure = isPrimary ? 0.6 : 0.26;
    const pressureFailure = riskContext.globalPressure * (isPrimary ? 0.24 : 0.18);
    const failureChance = clamp(baseFailure + pressureFailure, 0.08, 0.94);
    const sample = rng();
    const hasFailure = sample <= failureChance;
    const confidence = clamp(Math.round((1 - Math.abs(sample - failureChance)) * 100), 55, 99);
    const mitre = hasFailure ? pickMitreForFinding(rule, scenarioKey, rng) : null;
    const severityBoost = mitre?.severity === 'high' ? 9 : (mitre?.severity === 'med' ? 5 : 2);
    const adjustedRisk = clamp(Math.round((failureChance * 100) + (hasFailure ? severityBoost : 0)), 5, 99);

    return {
        rule,
        hasFailure,
        isPrimary,
        failureChance,
        confidence,
        mitre,
        riskScore: adjustedRisk
    };
}

function summarizeFindings(results){
    const failed = results.filter(result=> result.hasFailure);
    const riskIndex = Math.round((results.reduce((sum, result)=> sum + result.riskScore, 0) / Math.max(1, results.length)));
    const topFinding = failed.sort((a, b)=> b.riskScore - a.riskScore)[0] || null;

    return {
        failedCount: failed.length,
        total: results.length,
        riskIndex,
        topFinding
    };
}

function formatMitreContext(mapped){
    if(!mapped){
        return '';
    }

    return ` [MITRE ATT&CK] [Tactic: ${mapped.tactic} | Technique: ${mapped.technique} (${mapped.description})]`;
}

function clearConsole(){
    consoleEl.textContent = '';
}

function downloadJsonFile(filename, payload){
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function exportAIArtifacts(){
    const artifacts = window.lastAIArtifacts;
    if(!artifacts){
        log('No hay AI Artifacts disponibles. Ejecuta primero una evaluación.','warn');
        return;
    }

    const payload = JSON.stringify(artifacts, null, 2);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ai-artifacts-${stamp}.json`;

    try{
        if(navigator.clipboard && typeof navigator.clipboard.writeText === 'function'){
            await navigator.clipboard.writeText(payload);
            log('AI Artifacts copiados al portapapeles y exportados como JSON.','sys');
        } else {
            log('Portapapeles no disponible. Se descargará solo archivo JSON.','warn');
        }
    } catch {
        log('No fue posible copiar al portapapeles. Se descargará archivo JSON.','warn');
    }

    downloadJsonFile(filename, payload);
}

function buildAIArtifacts(params){
    const ai = window.SECArchitectAI;
    if(!ai){
        return null;
    }

    const scenario = SCENARIOS[params.scenarioKey];
    const profile = PROFILES[params.profileKey];
    const topic = `${scenario.name} en ${profile.label} (IG${params.igLevel})`;
    const baseInput = `Escenario=${scenario.name}; objetivo=${params.target}; perfil=${profile.label}; IG=${params.igLevel}`;

    const availableModes = typeof ai.getModes === 'function'
        ? ai.getModes()
        : ['architect', 'grc', 'soc'];
    const selectedMode = typeof ai.getMode === 'function'
        ? ai.getMode()
        : 'architect';

    const promptsByMode = {};
    availableModes.forEach(mode=>{
        const riskPrompt = typeof ai.buildRiskAnalyzerPrompt === 'function'
            ? ai.buildRiskAnalyzerPrompt(baseInput, { mode })
            : '';
        const fullAnalysisPrompt = typeof ai.buildSecArchitectAnalysisPrompt === 'function'
            ? ai.buildSecArchitectAnalysisPrompt(baseInput, { mode, context: 'Contexto SABSA IG4 Command Center' })
            : '';
        const controlPrompt = typeof ai.buildControlMapperPrompt === 'function'
            ? ai.buildControlMapperPrompt(baseInput, 'Contexto SABSA IG4 Command Center', { mode })
            : '';
        const architecturePrompt = typeof ai.buildArchitectureExplainerPrompt === 'function'
            ? ai.buildArchitectureExplainerPrompt(topic, 'high-level security architecture', { mode })
            : '';

        promptsByMode[mode] = {
            secArchitectAnalysis: fullAnalysisPrompt,
            riskAnalyzer: riskPrompt,
            controlMapper: controlPrompt,
            architectureExplainer: architecturePrompt
        };
    });

    return {
        createdAt: new Date().toISOString(),
        input: {
            target: params.target,
            scenarioKey: params.scenarioKey,
            profileKey: params.profileKey,
            igLevel: params.igLevel
        },
        mode: selectedMode,
        modes: availableModes,
        promptsByMode,
        prompts: promptsByMode[selectedMode] || promptsByMode.architect || {}
    };
}

/* --- Radar --- */
const baseValues = [100,100,100,100,100];

const radarChart = {
    data: { datasets: [{}, { data: [...baseValues] }] },
    update(){ /* no-op fallback when Chart.js is unavailable */ }
};

function initializeRadarChart(){
    const canvas = document.getElementById('radarChart');
    if(!canvas){
        log('Canvas radar no encontrado. Continuando sin visualización de gráfico.','warn');
        return;
    }

    if(typeof window.Chart !== 'function'){
        log('Chart.js no disponible. La evaluación seguirá sin radar visual.','warn');
        return;
    }

    const radarCtx = canvas.getContext('2d');
    const chart = new window.Chart(radarCtx,{
        type:'radar',
        data:{
            labels:SABSA_ATTRIBUTES,
            datasets:[
                {
                    label:'Esperado',
                    data:baseValues,
                    borderColor:'#6b7280',
                    backgroundColor:'rgba(148,163,184,0.15)'
                },
                {
                    label:'Detectado',
                    data:baseValues,
                    borderColor:'#00f2ff',
                    backgroundColor:'rgba(0,242,255,0.18)'
                }
            ]
        },
        options:{
            scales:{
                r:{
                    ticks:{display:false},
                    grid:{color:'#1f2933'},
                    angleLines:{color:'#1f2933'}
                }
            },
            plugins:{
                legend:{ labels:{ color:'#9ca3af' } }
            }
        }
    });

    radarChart.data = chart.data;
    radarChart.update = chart.update.bind(chart);
}

/* --- Threat Matrix --- */
function renderMatrix(scenarioKey, igLevel, riskIndex = 60){
    clearChildren(matrixBody);
    const scenario = SCENARIOS[scenarioKey];
    const sensitivity = IG_LEVELS[igLevel].sensitivity;
    setThreatSeverityState(scenario.sev);
    animatePanelTransition(threatPanel);

    SABSA_ATTRIBUTES.forEach(attr=>{
        const isPrimary = scenario.attr===attr;
        let sev = 'low';
        let status = 'Estable';
        let action = 'Monitorizar';

        if(isPrimary){
            sev = scenario.sev;
            status = 'Degradado';
            action = igLevel >= 3 ? 'Aplicar directiva IG4' : 'Planificar remediación';
        } else if(sensitivity > 1 && riskIndex > 58){
            sev = 'med';
            status = 'Sensibilizado';
            action = 'Revisión contextual';
        }

        const row = document.createElement('tr');
        if(isPrimary){
            row.className = 'matrix-row-primary';
        }

        const attrCell = document.createElement('td');
        attrCell.textContent = attr;

        const statusCell = document.createElement('td');
        statusCell.textContent = status;

        const severityCell = document.createElement('td');
        const severityPill = document.createElement('span');
        severityPill.className = `sev-pill sev-${sev}`;
        severityPill.textContent = sev;
        severityCell.appendChild(severityPill);

        const actionCell = document.createElement('td');
        actionCell.textContent = action;

        row.appendChild(attrCell);
        row.appendChild(statusCell);
        row.appendChild(severityCell);
        row.appendChild(actionCell);
        matrixBody.appendChild(row);
    });
}

/* --- Remediación --- */
function renderRemediation(scenarioKey, igLevel, profileKey, summary = null){
    const s = SCENARIOS[scenarioKey];
    const profile = PROFILES[profileKey];
    const recommendation = summary?.topFinding?.mitre
        ? (summary.topFinding.mitre.recommendation || MITRE_RECOMMENDATIONS[summary.topFinding.mitre.technique] || 'Priorizar endurecimiento y monitoreo continuo del control afectado.')
        : 'Mantener baseline de seguridad y revisiones periódicas de control.';

    const mitreLine = summary?.topFinding?.mitre
        ? `${summary.topFinding.mitre.tactic} · ${summary.topFinding.mitre.technique} · ${summary.topFinding.mitre.name} (${summary.topFinding.mitre.description})`
        : 'Sin técnica dominante en esta corrida';

    animatePanelTransition(remediationPanel);
    clearChildren(remediationPanel);

    const card = document.createElement('div');
    card.className = 'remediation-card';

    const directive = document.createElement('strong');
    directive.style.color = 'var(--neon-red)';
    directive.textContent = `Directiva IG${igLevel}`;
    card.appendChild(directive);
    card.appendChild(document.createElement('br'));

    const lines = [
        ['Escenario: ', s.name],
        ['Atributo afectado: ', s.attr],
        ['Perfil: ', profile.label],
        ['Riesgo compuesto: ', summary ? `${summary.riskIndex}/100` : 'N/A'],
        ['Hallazgos: ', summary ? `${summary.failedCount}/${summary.total}` : 'N/A'],
        ['MITRE dominante: ', mitreLine]
    ];

    lines.forEach(([label, value])=>{
        const textNode = document.createTextNode(label);
        const strong = document.createElement('strong');
        strong.textContent = value;
        card.appendChild(textNode);
        card.appendChild(strong);
        card.appendChild(document.createElement('br'));
    });

    const code = document.createElement('code');
    code.textContent = [
        '# Comando conceptual (no ejecuta nada real)',
        `# Contexto: ${s.cliHint}`,
        'az ad user list --query "[].{id:id,displayName:displayName}" --all',
        '',
        '# Recomendación prioritaria',
        recommendation
    ].join('\n');
    card.appendChild(code);

    const note = document.createElement('p');
    note.style.fontSize = '0.75rem';
    note.style.color = 'var(--text-dim)';
    note.textContent = 'Esta salida representa una remediación conceptual basada en marcos SABSA y Zero Trust. No se ejecutan acciones reales ni se interactúa con recursos de producción.';
    card.appendChild(note);

    remediationPanel.appendChild(card);
}

/* --- IG Badge --- */
igSelect.addEventListener('change',()=>{
    const igLevel = igSelect.value;
    igBadge.textContent = IG_LEVELS[igLevel].label;
    pulseElement(igSelect);
    setActivePanel(doctrinePanel);
    renderMatrix(scenarioSelect.value, igLevel);
    renderRemediation(scenarioSelect.value, igLevel, profileSelect.value);
});

scenarioSelect.addEventListener('change',()=>{
    pulseElement(scenarioSelect);
    setActivePanel(threatPanel);
    renderMatrix(scenarioSelect.value, igSelect.value);
    renderRemediation(scenarioSelect.value, igSelect.value, profileSelect.value);
});

profileSelect.addEventListener('change',()=>{
    pulseElement(profileSelect);
    setActivePanel(doctrinePanel);
    renderRemediation(scenarioSelect.value, igSelect.value, profileSelect.value);
});

targetInput.addEventListener('change',()=>{
    pulseElement(targetInput);
    setActivePanel(operationsPanel);
});

policyJsonInput.addEventListener('change',()=>{
    pulseElement(policyJsonInput);
    setActivePanel(operationsPanel);
});

/* --- Ejecución --- */
let isAuditRunning = false;

async function runStrategicAudit(){
    pulseElement(btnRun);
    setActivePanel(operationsPanel);
    const rawTarget = document.getElementById('target-input').value.trim();
    const selectedScenarioKey = document.getElementById('scenario-select').value;
    const profileKey = document.getElementById('profile-select').value;
    const igLevel = igSelect.value;
    const rawPolicyJson = policyJsonInput.value.trim();

    if(isAuditRunning){
        log('Ejecución en curso. Espere finalización del análisis actual.','warn');
        return;
    }

    clearConsole();
    log('SYSTEM: Iniciando evaluación arquitectónica...','sys');
    setExecutionState(true);
    isAuditRunning = true;

    if(!rawPolicyJson){
        log('No se proporcionó JSON de política. Pegue un JSON válido para ejecutar el motor.','warn');
        setExecutionState(false);
        isAuditRunning = false;
        return;
    }

    const parsedPolicy = parsePolicyJson(rawPolicyJson);
    if(!parsedPolicy.ok){
        log(`JSON inválido: ${parsedPolicy.message}`,'crit');
        setExecutionState(false);
        isAuditRunning = false;
        return;
    }

    const hasMfaEnforced = searchMfaEnforced(parsedPolicy.value);
    const scenarioKey = hasMfaEnforced ? selectedScenarioKey : 'no-mfa';
    const target = deriveTargetFromPolicy(parsedPolicy.value, rawTarget);

    if(!isMitreCatalogReady){
        await loadMitreCatalog();
    }

    btnRun.disabled = true;

    log(`Objetivo: ${target}`,'info');
    log(`Escenario: ${SCENARIOS[scenarioKey].name}`,'info');
    log(`Perfil: ${PROFILES[profileKey].label}`,'info');
    log(`Nivel IG: ${IG_LEVELS[igLevel].label}`,'info');
    log(`MFA detectado en JSON: ${hasMfaEnforced ? 'enforced' : 'not enforced'}`,'info');
    log(`Base MITRE activa: ${dynamicMitreCatalog.length || 'fallback local'} técnicas disponibles.`,'sys');
    log('Inicio de telemetría doctrinal en tiempo real...','sys');

    const aiArtifacts = buildAIArtifacts({ target, scenarioKey, profileKey, igLevel });
    if(aiArtifacts){
        window.lastAIArtifacts = aiArtifacts;
        log('Módulos AI integrados: prompts Risk Analyzer / Control Mapper / Architecture Explainer listos.','sys');
    }

    await wait(260);
    log('Resolviendo controles asociados a la doctrina SABSA IG...','sys');

    const riskContext = buildRiskContext({ scenarioKey, profileKey, igLevel });
    const rng = createDeterministicRng(`${target}|${scenarioKey}|${profileKey}|${igLevel}`);
    const evaluationResults = [];

    for(let i=0;i<RULES.length;i++){
        const rule = RULES[i];
        const result = evaluateControl(rule, scenarioKey, riskContext, rng);
        evaluationResults.push(result);
        const progress = Math.round(((i + 1) / RULES.length) * 100);

        await wait(220 + (i * 60));

        if(result.hasFailure){
            log(`Evaluando control ${rule.id} (${rule.name})... [FALLO DETECTADO]${formatMitreContext(result.mitre)} [RISK:${result.riskScore}] [CONF:${result.confidence}%] [Progress: ${progress}%]`,'warn');
        } else {
            log(`Evaluando control ${rule.id} (${rule.name})... [OK] [RISK:${result.riskScore}] [CONF:${result.confidence}%] [Progress: ${progress}%]`,'info');
        }
    }

    await wait(260);

    const summary = summarizeFindings(evaluationResults);

    if(summary.failedCount > 0){
        log(`Desviación detectada en atributo clave. Hallazgos: ${summary.failedCount}/${summary.total}. Riesgo compuesto: ${summary.riskIndex}/100.`,'warn');
    } else {
        log('No se detectaron fallos críticos en esta corrida. Mantener monitoreo continuo.','sys');
    }

    if(!hasMfaEnforced){
        log('[CRITICAL] MITRE T1556 - MFA NOT DETECTED.','crit');
        log('SC-300 FAIL: La política JSON evaluada no incluye mfa=enforced.','crit');
        renderTerraformRemediationInConsole();
    }

    log('Generando Threat Matrix y directiva IG correspondiente...','crit');

    const deltas = SCENARIOS[scenarioKey].delta;
    const weights = PROFILES[profileKey].weight;
    const sensitivity = IG_LEVELS[igLevel].sensitivity;

    const newValues = baseValues.map((v,i)=>{
        const impact = deltas[i] * weights[i] * sensitivity;
        return Math.max(10, v - impact);
    });

    radarChart.data.datasets[1].data = newValues;
    radarChart.update();

    renderMatrix(scenarioKey, igLevel, summary.riskIndex);
    renderRemediation(scenarioKey, igLevel, profileKey, summary);

    log('Evaluación completada. Resultados disponibles en radar y Threat Matrix.','sys');
    btnRun.disabled = false;
    setExecutionState(false);
    isAuditRunning = false;
    setActivePanel(threatPanel);
}

document.getElementById('btn-run').addEventListener('click',()=>{
    runStrategicAudit().catch(()=>{
        log('Error interno de simulación. Reintente la ejecución.','crit');
        btnRun.disabled = false;
        setExecutionState(false);
        isAuditRunning = false;
    });
});

if(btnExportAI){
    btnExportAI.addEventListener('click',()=>{
        pulseElement(btnExportAI);
        setActivePanel(operationsPanel);
        exportAIArtifacts().catch(()=>{
            log('No fue posible exportar AI Artifacts.','crit');
        });
    });
}

initializeRadarChart();
void loadMitreCatalog();

targetInput.addEventListener('keydown',(event)=>{
    if(event.key === 'Enter'){
        btnRun.click();
    }
});

policyJsonInput.addEventListener('keydown',(event)=>{
    if(event.key === 'Enter' && (event.ctrlKey || event.metaKey)){
        event.preventDefault();
        btnRun.click();
    }
});

    renderMatrix(scenarioSelect.value, igSelect.value);
    renderRemediation(scenarioSelect.value, igSelect.value, profileSelect.value);
    setActivePanel(doctrinePanel);
