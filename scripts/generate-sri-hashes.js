#!/usr/bin/env node
// scripts/generate-sri-hashes.js
// Genera hashes SRI SHA-384 para recursos externos y sugiere el bloque HTML actualizado

const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const resources = [
  {
    file: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
    tag: 'link',
    attr: 'href',
    local: false
  },
  {
    file: 'assets/js/site.js',
    tag: 'script',
    attr: 'src',
    local: true
  },
  {
    file: 'assets/css/site.css',
    tag: 'link',
    attr: 'href',
    local: true
  },
  {
    file: 'assets/css/blog.page.css',
    tag: 'link',
    attr: 'href',
    local: true
  }
];

function fetchRemote(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function getFileBuffer(resource) {
  if (resource.local) {
    return fs.promises.readFile(resource.file);
  } else {
    return fetchRemote(resource.file);
  }
}

async function main() {
  const sri = {};
  for (const resource of resources) {
    try {
      const buf = await getFileBuffer(resource);
      const hash = crypto.createHash('sha384').update(buf).digest('base64');
      sri[resource.file] = `sha384-${hash}`;
      console.log(`${resource.file}: ${sri[resource.file]}`);
    } catch (e) {
      console.error(`Error hashing ${resource.file}:`, e.message);
    }
  }
  fs.writeFileSync('sri-hashes.json', JSON.stringify(sri, null, 2));
}

main();
