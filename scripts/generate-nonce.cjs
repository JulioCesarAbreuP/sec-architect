#!/usr/bin/env node
// scripts/generate-nonce.cjs
// Genera un nonce seguro (base64, 128 bits) y lo imprime o guarda para el build

const crypto = require('crypto');
const fs = require('fs');

const nonce = crypto.randomBytes(16).toString('base64');
fs.writeFileSync('nonce.txt', nonce);
console.log(nonce);
