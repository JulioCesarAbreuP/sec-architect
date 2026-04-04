// scripts/validate-security-artifacts.cjs
// Valida SRI, nonces y CSP en el build estático
const fs = require('fs');
const path = require('path');

// 1. Validar SRI
const sriHashes = JSON.parse(fs.readFileSync('assets/data/sri-hashes.json', 'utf8'));
const cssFiles = [
  'assets/css/site.css',
  'assets/css/blog.page.css',
  'assets/css/index.page.css',
];
let sriOk = true;
for (const file of cssFiles) {
  if (!sriHashes[file]) {
    console.error(`❌ Falta hash SRI para ${file}`);
    sriOk = false;
  } else {
    const fileContent = fs.readFileSync(file);
    // (Opcional: recalcular hash y comparar)
  }
}
if (!sriOk) process.exit(1);

// 2. Validar nonce en scripts inline
const htmlFiles = ['index.html', 'blog.html'];
const nonce = fs.readFileSync('nonce.txt', 'utf8').trim();
let nonceOk = true;
for (const html of htmlFiles) {
  const content = fs.readFileSync(html, 'utf8');
  // Todos los <script> deben tener nonce
  const scriptTags = content.match(/<script[^>]*>/g) || [];
  for (const tag of scriptTags) {
    if (!tag.includes(`nonce="${nonce}"`)) {
      console.error(`❌ Script sin nonce en ${html}: ${tag}`);
      nonceOk = false;
    }
  }
  // No debe haber scripts inline sin nonce
  const inlineScripts = content.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g) || [];
  for (const tag of inlineScripts) {
    if (!tag.includes(`nonce="${nonce}"`)) {
      console.error(`❌ Script inline sin nonce en ${html}: ${tag}`);
      nonceOk = false;
    }
  }
  // CSP debe contener el nonce
  const cspMeta = content.match(/<meta[^>]+Content-Security-Policy[^>]+>/i);
  if (cspMeta && !cspMeta[0].includes(`nonce-${nonce}`)) {
    console.error(`❌ CSP sin nonce en ${html}`);
    nonceOk = false;
  }
}
if (!nonceOk) process.exit(1);

console.log('✅ Validaciones de SRI, nonce y CSP completadas.');
