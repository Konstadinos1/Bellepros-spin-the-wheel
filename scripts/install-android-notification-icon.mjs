#!/usr/bin/env node
// Installs the status-bar icon referenced by `LocalNotifications.smallIcon`
// ("ic_stat_icon") into the generated Android project.
//
// Android keeps only the ALPHA channel of a status-bar icon, so it must be a white
// silhouette on transparent — the full-colour badge would render as a solid blob.
// @capacitor/assets does not generate notification icons, and `android/` is generated
// (gitignored), so this runs as part of `npm run sync`.
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets', 'android-notification');
const RES = join(ROOT, 'android', 'app', 'src', 'main', 'res');
const DENSITIES = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

if (!existsSync(RES)) {
  console.log('android/ not present — skipping notification icon (run `npm run add:android` first)');
  process.exit(0);
}

let installed = 0;
for (const density of DENSITIES) {
  const from = join(SRC, `ic_stat_icon-${density}.png`);
  if (!existsSync(from)) throw new Error(`missing source icon: ${from}`);
  const dir = join(RES, `drawable-${density}`);
  mkdirSync(dir, { recursive: true });
  copyFileSync(from, join(dir, 'ic_stat_icon.png'));
  installed++;
}
console.log(`installed ic_stat_icon.png into ${installed} drawable-* folders`);
