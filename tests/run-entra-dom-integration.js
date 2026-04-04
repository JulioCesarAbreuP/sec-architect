import assert from "node:assert/strict";

import { parseIdentityJson, validateIdentityObject } from "../core/identity-validator.js";
import { evaluateEntraRules } from "../core/rules-engine.js";
import { generateEntraTerraformFix } from "../core/remediation-engine.js";
import { paintEntraRadar, renderEntraConsole, renderEntraRemediationPanel, copyTextToClipboard } from "../ui/renderer.js";

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.attributes = {};
    this.textContent = "";
    this.className = "";
    this.disabled = false;
    this.value = "";
    this.parentNode = null;
    this.id = "";
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === "id") {
      this.id = String(value);
      this.ownerDocument.registerElement(this);
    }
    if (name === "class") {
      this.className = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentNode) {
      return;
    }
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  select() {
    return true;
  }
}

class FakeDocument {
  constructor() {
    this.elementsById = new Map();
    this.body = new FakeElement("body", this);
    this.execCommandCalls = [];
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  getElementById(id) {
    return this.elementsById.get(String(id)) || null;
  }

  registerElement(element) {
    if (element && element.id) {
      this.elementsById.set(element.id, element);
    }
  }

  execCommand(command) {
    this.execCommandCalls.push(command);
    return command === "copy";
  }
}

function register(doc, tagName, id) {
  var element = doc.createElement(tagName);
  element.setAttribute("id", id);
  doc.body.appendChild(element);
  return element;
}

async function main() {
  var payload = {
    user: "john@contoso.com",
    roles: ["Global Admin", "Security Administrator"],
    mfa: "disabled",
    conditionalAccess: { requireMfa: true },
    resource: "Entra Portal",
    accountType: "cloud"
  };

  var parsed = parseIdentityJson(JSON.stringify(payload));
  assert.equal(parsed.ok, true, "payload should parse");

  var validated = validateIdentityObject(parsed.value);
  assert.equal(validated.ok, true, "payload should validate structurally");

  var evaluation = evaluateEntraRules(validated.value);
  var terraformFix = generateEntraTerraformFix(validated.value, evaluation);

  var doc = new FakeDocument();
  var fill = register(doc, "path", "entra-arc-fill");
  var needle = register(doc, "line", "entra-needle");
  var label = register(doc, "div", "entra-radar-label");
  var consoleList = register(doc, "ul", "entra-console");
  var codeBlock = register(doc, "pre", "entra-remediation-code");
  var copyBtn = register(doc, "button", "entra-copy-fix");
  var riskScore = register(doc, "div", "entra-risk-score");

  paintEntraRadar(doc, evaluation.radarLevel);
  renderEntraConsole(doc, evaluation.logs);
  renderEntraRemediationPanel(doc, {
    hasFix: Boolean(terraformFix),
    terraformFix: terraformFix,
    riskScore: evaluation.riskScore,
    radarLevel: evaluation.radarLevel
  });

  assert.equal(fill.getAttribute("stroke"), "#f87171", "risk radar should paint red");
  assert.equal(needle.getAttribute("x2"), "140", "risk radar needle should point right");
  assert.match(label.textContent, /CRITICAL RISK/i, "risk label should describe critical risk");

  assert.equal(consoleList.children.length >= 2, true, "console should render multiple SOC lines");
  assert.match(consoleList.children[0].textContent, /\[CHECK\]|\[FAIL\]|\[MITRE\]/, "console lines should contain SOC prefixes");

  assert.equal(copyBtn.disabled, false, "copy button should be enabled when remediation exists");
  assert.match(codeBlock.textContent, /azuread_conditional_access_policy/i, "panel should render Terraform remediation");
  assert.match(codeBlock.textContent, /included_roles\s*=\s*\["Global Admin", "Security Administrator"\]/i, "panel should render multi-role remediation");
  assert.equal(riskScore.textContent, "Risk Score: " + evaluation.riskScore + "/100", "panel should display computed score");
  assert.match(riskScore.className, /is-risk/, "risk score tone should match radar state");

  var clipboardWrites = [];
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async function (text) {
          clipboardWrites.push(text);
        }
      }
    }
  });

  var copied = await copyTextToClipboard(codeBlock.textContent);
  assert.equal(copied, true, "clipboard helper should report success");
  assert.equal(clipboardWrites.length, 1, "clipboard helper should write once");
  assert.equal(clipboardWrites[0], codeBlock.textContent, "clipboard helper should copy remediation text");

  renderEntraRemediationPanel(doc, null);
  paintEntraRadar(doc, "neutral");
  assert.equal(copyBtn.disabled, true, "copy button should disable when no remediation exists");
  assert.match(codeBlock.textContent, /No remediation generated/i, "empty remediation state should render fallback text");
  assert.equal(fill.getAttribute("stroke"), "#7e96ad", "neutral radar should reset stroke color");

  console.log("Entra DOM integration test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
