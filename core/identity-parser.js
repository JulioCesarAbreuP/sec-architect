const TYPE_SCHEMAS = {
  "Conditional Access Policy": {
    required: ["displayName"],
    validate(payload) {
      const hasControls = Boolean(payload.grantControls) || Boolean(payload.conditions);
      return hasControls ? [] : ["grantControls o conditions es obligatorio"];
    }
  },
  "Service Principal": {
    required: ["servicePrincipal", "role"],
    validate(payload) {
      const errors = [];
      if (!Array.isArray(payload.permissions) || payload.permissions.length === 0) {
        errors.push("permissions debe ser un arreglo no vacio");
      }
      return errors;
    }
  },
  "App Registration": {
    required: ["appId", "displayName"],
    validate(payload) {
      return payload.requiredResourceAccess ? [] : ["requiredResourceAccess es obligatorio"];
    }
  },
  "Role Assignment": {
    required: ["principalId", "scope"],
    validate(payload) {
      if (payload.roleDefinitionId || payload.roleDefinitionName) {
        return [];
      }
      return ["roleDefinitionId o roleDefinitionName es obligatorio"];
    }
  }
};

function detectObjectType(payload) {
  if (payload.displayName && (payload.grantControls || payload.conditions)) {
    return "Conditional Access Policy";
  }
  if (payload.servicePrincipal || payload.principal || payload.role) {
    return "Service Principal";
  }
  if (payload.appId && payload.requiredResourceAccess) {
    return "App Registration";
  }
  if (payload.principalId && payload.scope && (payload.roleDefinitionId || payload.roleDefinitionName)) {
    return "Role Assignment";
  }
  return null;
}

function parseJson(rawText) {
  try {
    return JSON.parse(String(rawText || ""));
  } catch {
    throw new Error("[ERROR] JSON de Identidad No Válido");
  }
}

function validateSchema(payload, type) {
  const schema = TYPE_SCHEMAS[type];
  const errors = [];

  for (const key of schema.required) {
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
      errors.push("Falta campo critico: " + key);
    }
  }

  errors.push(...schema.validate(payload));
  return errors;
}

export function parseAndValidateIdentity(rawText) {
  const payload = parseJson(rawText);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("[TYPE-ERROR] El payload no corresponde a un objeto de Entra ID");
  }

  const objectType = detectObjectType(payload);
  if (!objectType) {
    throw new Error("[TYPE-ERROR] Objeto no reconocido para Entra ID");
  }

  const schemaErrors = validateSchema(payload, objectType);
  if (schemaErrors.length) {
    throw new Error("[SEMANTIC-ERROR] " + schemaErrors.join("; "));
  }

  return { payload, objectType };
}
