export function calculateZeroTrustScore(flags) {
  let score = 100;

  if (!flags.mfaEnabled) score -= 55;
  if (flags.hasDangerousRole) score -= 20;
  if (flags.hasExcessivePermissions) score -= 15;
  if (flags.targetsKeyVault) score -= 8;
  if (flags.targetsStorage) score -= 6;

  return Math.max(0, Math.min(100, score));
}

export function applyFixImpact(previousScore) {
  return Math.max(0, Math.min(100, Number(previousScore || 0) + 18));
}
