#!/usr/bin/env node
// Assembles the web payload the native shells load (Capacitor's `webDir`).
// Dependency-free on purpose: the game is a single HTML file plus static assets,
// so "building" is a copy — no bundler to keep in sync or to break the page.
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WWW = join(ROOT, 'www');

const ENTRIES = ['index.html', 'manifest.webmanifest', 'assets'];

rmSync(WWW, { recursive: true, force: true });
mkdirSync(WWW, { recursive: true });

for (const entry of ENTRIES) {
  const from = join(ROOT, entry);
  if (!existsSync(from)) throw new Error(`missing required entry: ${entry}`);
  cpSync(from, join(WWW, entry), { recursive: true });
}

// The native shells serve index.html from the bundle root, so any absolute path
// would 404 inside the app. Fail loudly here rather than shipping a broken build.
const html = readFileSync(join(WWW, 'index.html'), 'utf8');
const absolute = [...html.matchAll(/\b(?:src|href)="(\/[^/][^"]*)"/g)].map(m => m[1]);
if (absolute.length) {
  throw new Error(`index.html references absolute paths that break in the app shell: ${absolute.join(', ')}`);
}

const size = (p) => statSync(p).size;
console.log(`built www/ -> ${(size(join(WWW, 'index.html')) / 1024).toFixed(0)} KB index.html + assets`);
for (const entry of ENTRIES) console.log(`  · ${entry}`);
