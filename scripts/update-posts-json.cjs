#!/usr/bin/env node
// Script: update-posts-json.cjs
// Descripción: Automatiza la generación de blog/posts.json con todos los archivos .md del directorio blog/
// Uso: node scripts/update-posts-json.cjs

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '../blog');
const OUTPUT = path.join(BLOG_DIR, 'posts.json');

function isMarkdown(file) {
  return file.endsWith('.md');
}

function main() {
  const files = fs.readdirSync(BLOG_DIR)
    .filter(isMarkdown)
    .sort();
  fs.writeFileSync(OUTPUT, JSON.stringify(files, null, 2) + '\n');
  console.log(`posts.json actualizado con ${files.length} archivos.`);
}

if (require.main === module) {
  main();
}
