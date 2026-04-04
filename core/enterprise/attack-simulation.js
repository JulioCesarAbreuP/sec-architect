const ATTACK_PROFILES = {
  T1078: {
    name: "Valid Accounts",
    path: "User -> Global Admin Role -> Key Vault -> Secret Exfiltration",
    impact: 82
  },
  T1556: {
    name: "Modify Authentication Process",
    path: "User -> Auth Policy Weakness -> Token Abuse -> Control Bypass",
    impact: 88
  },
  T1548: {
    name: "Abuse Elevation Control Mechanism",
    path: "User -> Role Assignment Drift -> Privilege Escalation -> Resource Takeover",
    impact: 74
  }
};

export function simulateAttack(techniqueId) {
  const profile = ATTACK_PROFILES[techniqueId] || ATTACK_PROFILES.T1078;
  const dynamicImpact = Math.max(1, Math.min(99, profile.impact + Math.round((Math.random() - 0.5) * 8)));

  return {
    technique: techniqueId,
    name: profile.name,
    attackPath: profile.path,
    impact: dynamicImpact,
    recommendation: "Aplicar JIT, restringir rol privilegiado y reforzar MFA resistente al phishing."
  };
}
