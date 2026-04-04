import { AzureParser } from '../azure-parser.js';
import { IaCEngine } from '../iac-engine.js';

describe('ARMOR-OS Core Engine Tests', () => {
    test('Detección de brechas en SC-300', () => {
        const mockData = [{ state: "enabled", grantControls: { builtInControls: ["block"] } }];
        const result = AzureParser.analyzeJSON(mockData);
        expect(result.count).toBe(1);
    });

    test('Generación de código IaC consistente', () => {
        const code = IaCEngine.generateTerraform("OPEN_RDP");
        expect(code).toContain("Deny");
        expect(code).toContain("3389");
    });
});
