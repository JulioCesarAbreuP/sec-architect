/**
 * digital-twin.js
 * Digital Twin of the Azure Tenant — simulates changes, attacks, and remediation.
 * Maintains a mutable state derived from an Entra ID payload or a live scan.
 */

// ── Internal state ───────────────────────────────────────────────────────────

class TenantSnapshot {
  constructor(data) {
    this.identities  = (data.identities  || []).map(i => ({ ...i }));
    this.policies    = (data.policies    || []).map(p => ({ ...p }));
    this.resources   = (data.resources   || []).map(r => ({ ...r }));
    this.timestamp   = data.timestamp    || new Date().toISOString();
  }

  clone() {
    return new TenantSnapshot({
      identities:  this.identities.map(i => ({ ...i })),
      policies:    this.policies.map(p => ({ ...p })),
      resources:   this.resources.map(r => ({ ...r })),
      timestamp:   new Date().toISOString()
    });
  }
}

// ── Attack catalog ───────────────────────────────────────────────────────────

const ATTACKS = {
  "T1078.004": {
    name: "Cloud Account Compromise",
    tactic: "Initial Access",
    steps: [
      "1. Attacker obtains credentials via phishing or credential stuffing.",
      "2. Authentication succeeds — MFA not enforced on target identity.",
      "3. Attacker enumerates role assignments via ARM / Graph API.",
      "4. Lateral movement to Key Vault via Contributor role.",
      "5. Secrets exfiltrated — database connection strings, API keys."
    ],
    impactLevel: "critical"
  },
  "T1556": {
    name: "Modify Authentication Process",
    tactic: "Credential Access / Defense Evasion",
    steps: [
      "1. Attacker gains write access to identity configuration plane.",
      "2. Modifies Conditional Access Policy to exclude attacker's IP/identity.",
      "3. Disables MFA requirement for Global Admin role.",
      "4. Registers persistent backdoor identity / app registration.",
      "5. Maintains long-term covert access."
    ],
    impactLevel: "critical"
  },
  "T1548": {
    name: "Abuse Elevation Control Mechanism",
    tactic: "Privilege Escalation",
    steps: [
      "1. Attacker compromises service principal with Contributor access.",
      "2. Exploits excessive API permissions to self-assign Owner role.",
      "3. Deploys malicious Azure Function with managed identity.",
      "4. Function accesses Storage Account — mass data exfiltration.",
      "5. Covers tracks by modifying diagnostic settings."
    ],
    impactLevel: "high"
  },
  "T1090": {
    name: "Proxy / C2 Relay",
    tactic: "Command and Control",
    steps: [
      "1. Attacker deploys Azure VM or Container Instance as C2 relay.",
      "2. Routes traffic through legitimate Azure IP ranges.",
      "3. Bypasses perimeter controls — traffic appears internal.",
      "4. Long-term persistence via auto-scaling group."
    ],
    impactLevel: "high"
  }
};

// ── Digital Twin class ───────────────────────────────────────────────────────

export class DigitalTwin {
  constructor() {
    this._baseline = null;
    this._current  = null;
    this._history  = [];
  }

  // ── Load ─────────────────────────────────────────────────────────────────

  /**
   * Load state from an Entra ID payload (from the Analyzer tab).
   */
  loadFromPayload(payload, objectType) {
    const identity = {
      id:          payload.servicePrincipal || payload.principalId || payload.appId || `identity-${Date.now()}`,
      type:        objectType || "unknown",
      mfa:         payload.mfa || payload.authentication?.mfa || "unknown",
      role:        payload.role || payload.roleDefinitionName || payload.assignedRole || "unknown",
      permissions: Array.isArray(payload.permissions) ? [...payload.permissions] : [],
      resource:    payload.resource || payload.scope || payload.targetResource || "unknown"
    };

    const policies = payload.grantControls
      ? [{ name: payload.displayName || "CA-Policy", state: payload.state || "unknown" }]
      : [];

    return this._init({ identities: [identity], policies, resources: [] });
  }

  /**
   * Load state from a Graph API scan result (CA policies, SPNs).
   */
  loadFromScan({ caPolicies = [], servicePrincipals = [] } = {}) {
    const identities = servicePrincipals.map(spn => ({
      id:          spn.id,
      type:        "Service Principal",
      mfa:         "unknown",
      role:        (spn.appRoles || []).map(r => r.displayName).join(", ") || "none",
      permissions: (spn.oauth2PermissionScopes || []).map(s => s.value),
      resource:    "Azure AD"
    }));

    const policies = caPolicies.map(p => ({
      name:  p.displayName,
      state: p.state
    }));

    return this._init({ identities, policies, resources: [] });
  }

  _init(data) {
    this._baseline = new TenantSnapshot(data);
    this._current  = this._baseline.clone();
    this._history  = [];
    return this;
  }

  // ── Simulate changes ──────────────────────────────────────────────────────

  simulateChange(changeType, options = {}) {
    this._history.push({ changeType, before: this._current.clone(), applied: new Date().toISOString() });

    switch (changeType) {
      case "enable-mfa":
        for (const id of this._current.identities) id.mfa = "enabled";
        break;

      case "scope-role":
        for (const id of this._current.identities) {
          if (!options.targetId || options.targetId === id.id) {
            id.role        = options.newRole || "Reader";
            id.permissions = [options.newRole || "Reader"];
          }
        }
        break;

      case "add-policy":
        if (options.policy) this._current.policies.push({ ...options.policy });
        break;

      case "remove-resource":
        this._current.resources = this._current.resources.filter(r => r.id !== options.resourceId);
        break;

      case "restrict-permissions":
        for (const id of this._current.identities) {
          id.permissions = id.permissions.filter(p => !/owner|contributor|admin/i.test(p));
          if (!id.permissions.length) id.permissions = ["Reader"];
        }
        break;
    }

    return { applied: changeType, scoreBefore: this._score(this._history.at(-1).before), scoreAfter: this.score };
  }

  // ── Simulate attack ───────────────────────────────────────────────────────

  simulateAttack(techniqueId) {
    const attack = ATTACKS[techniqueId];
    if (!attack) {
      return { name: "Unknown", steps: ["Technique not in attack catalog."], probability: 0.5 };
    }

    // Probability is higher when MFA is off or roles are privileged
    let prob = 0.35;
    for (const id of this._current.identities) {
      if (!["enabled", "enforced"].includes(id.mfa)) prob += 0.30;
      if (/global.admin|owner/i.test(id.role))       prob += 0.20;
      if (id.permissions.length > 3)                  prob += 0.10;
    }
    prob = Math.min(0.97, prob);

    const impactedAssets = [
      ...this._current.identities.map(i => i.id),
      ...this._current.resources.map(r => r.id)
    ].filter(Boolean).slice(0, 6);

    return {
      techniqueId,
      name:          attack.name,
      tactic:        attack.tactic,
      steps:         attack.steps,
      probability:   parseFloat(prob.toFixed(2)),
      impactLevel:   attack.impactLevel,
      impactedAssets
    };
  }

  // ── Simulate remediation ──────────────────────────────────────────────────

  simulateRemediation(fixType) {
    const before = this.score;
    const result = this.simulateChange(fixType);
    const after  = this.score;
    return {
      fixType,
      scoreBefore: before,
      scoreAfter:  after,
      delta:       before - after,
      status:      after < before ? "IMPROVED" : "NO_CHANGE"
    };
  }

  // ── Scoring ───────────────────────────────────────────────────────────────

  _score(snapshot) {
    let score = 100;
    for (const id of (snapshot?.identities || [])) {
      if (!["enabled", "enforced"].includes(id.mfa)) score -= 35;
      if (/global.admin|owner/i.test(id.role))       score -= 20;
      if ((id.permissions || []).length > 3)          score -= 10;
    }
    const mfaPolicy = (snapshot?.policies || []).find(p => /mfa|conditional/i.test(p.name));
    if (mfaPolicy?.state === "enabled") score = Math.min(100, score + 15);
    return Math.max(0, score);
  }

  get score() { return this._score(this._current); }

  // ── State export ──────────────────────────────────────────────────────────

  getState() {
    const current = this._current;
    return {
      identities:    current?.identities ?? [],
      policies:      current?.policies   ?? [],
      resources:     current?.resources  ?? [],
      score:         this.score,
      deltaChanges:  this._history.length,
      isLoaded:      Boolean(this._baseline),
      lastChange:    this._history.at(-1)?.applied ?? null
    };
  }

  reset() {
    if (this._baseline) {
      this._current = this._baseline.clone();
      this._history = [];
    }
    return this.getState();
  }

  isLoaded() {
    return Boolean(this._baseline);
  }
}
