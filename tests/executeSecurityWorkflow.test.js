import { jest } from '@jest/globals';
// tests/executeSecurityWorkflow.test.js
import { AzureParser } from '../azure-parser.js';
import { ThreatIntel } from '../threat-intel.js';
import { IaCEngine } from '../iac-engine.js';
import { executeSecurityWorkflow } from '../main-orchestrator.js';

// Mock UI functions
global.updateUIConsole = jest.fn();
global.updateRadarChart = jest.fn();
global.renderRemediationPanel = jest.fn();

// Mock ThreatIntel
ThreatIntel.fetchLiveThreats = jest.fn(async () => [
  { vulnerabilityName: 'CVE-2026-1234' },
  { vulnerabilityName: 'CVE-2026-5678' }
]);

describe('executeSecurityWorkflow', () => {
  it('detecta brechas de MFA y genera remediación', async () => {
    const rawJson = JSON.stringify([
      { state: 'enabled', grantControls: { builtInControls: [] } },
      { state: 'enabled', grantControls: { builtInControls: ['mfa'] } }
    ]);
    await executeSecurityWorkflow(rawJson);
    expect(updateUIConsole).toHaveBeenCalledWith(
      expect.stringContaining('Detectadas 1 brechas'),
      'warning'
    );
    expect(renderRemediationPanel).toHaveBeenCalledWith(
      expect.stringContaining('resource "azuread_conditional_access_policy"')
    );
    expect(updateRadarChart).toHaveBeenCalledWith(75);
  });

  it('pasa si no hay brechas', async () => {
    const rawJson = JSON.stringify([
      { state: 'enabled', grantControls: { builtInControls: ['mfa'] } }
    ]);
    await executeSecurityWorkflow(rawJson);
    expect(updateUIConsole).toHaveBeenCalledWith(
      expect.stringContaining('Configuración alineada'),
      'success'
    );
    expect(renderRemediationPanel).toHaveBeenCalledWith('');
    expect(updateRadarChart).toHaveBeenCalledWith(100);
  });

  it('maneja error de parseo', async () => {
    await executeSecurityWorkflow('no es json');
    expect(updateUIConsole).toHaveBeenCalledWith(
      expect.stringContaining('Error de parseo'),
      'error'
    );
  });
});
