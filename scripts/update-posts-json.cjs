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

function extractFrontmatter(content) {
  const match = content.match(/^---([\s\S]*?)---/);
  if (!match) return {};
  const yaml = match[1];
  const result = {};
  yaml.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (m) {
      const key = m[1].trim();
      let value = m[2].trim();
      if (key === 'tags') {
        value = value.split(',').map(t => t.trim()).filter(Boolean);
      }
      result[key] = value;
    }
  });
  return result;
}

function main() {
  const files = fs.readdirSync(BLOG_DIR)
    .filter(isMarkdown)
    .sort();
  const posts = files.map(filename => {
    const content = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf8');
    const meta = extractFrontmatter(content);
    return {
      filename,
      title: meta.title || '',
      date: meta.date || '',
      tags: meta.tags || [],
      category: meta.category || ''
    };
  });
  fs.writeFileSync(OUTPUT, JSON.stringify(posts, null, 2) + '\n');
  console.log(`posts.json actualizado con ${posts.length} posts y metadatos.`);
}

if (require.main === module) {
  main();
}
