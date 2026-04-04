export const IaCEngine = {
    generateTerraform: (riskType) => {
        const fixes = {
            "MFA_MISSING": `resource "azuread_conditional_access_policy" "enforce_mfa" {\n  display_name = "Enforce MFA for Admins"\n  state        = "enabled"\n  # Remediation: T1556 - Modify Authentication Process\n}`,
            "OPEN_RDP": `resource "azurerm_network_security_rule" "block_rdp" {\n  name = "DenyRDPInbound"\n  access = "Deny"\n  protocol = "Tcp"\n  destination_port_range = "3389"\n}`
        };
        return fixes[riskType] || "# [INFO] Manual Architectural Review Required.";
    }
};
