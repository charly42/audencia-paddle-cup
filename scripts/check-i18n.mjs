// Vérifie que fr.ts et en.ts ont exactement les mêmes clés, et signale les clés utilisées
// dans le code mais absentes des dictionnaires.  Usage : npm run check:i18n
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const keysOf = (f) => new Set([...readFileSync(f, "utf8").matchAll(/"([\w.]+)":\s*"/g)].map((m) => m[1]));
const fr = keysOf("src/lib/i18n/fr.ts");
const en = keysOf("src/lib/i18n/en.ts");
const onlyFr = [...fr].filter((k) => !en.has(k));
const onlyEn = [...en].filter((k) => !fr.has(k));

const used = new Set();
const walk = (d) => readdirSync(d).forEach((n) => {
  const p = join(d, n);
  if (statSync(p).isDirectory()) return walk(p);
  if (!/\.(tsx?|mjs)$/.test(n) || p.includes("i18n")) return;
  for (const m of readFileSync(p, "utf8").matchAll(/\bt\(\s*["'`]([a-zA-Z]+\.[\w.]+)["'`]/g)) used.add(m[1]);
});
walk("src");
const unknown = [...used].filter((k) => !fr.has(k));

let ok = true;
if (onlyFr.length) { ok = false; console.error("Clés absentes de en.ts :", onlyFr); }
if (onlyEn.length) { ok = false; console.error("Clés absentes de fr.ts :", onlyEn); }
if (unknown.length) { ok = false; console.error("Clés utilisées mais non définies :", unknown); }
console.log(`${fr.size} clés · ${used.size} utilisées littéralement · ${ok ? "OK" : "ERREURS"}`);
process.exit(ok ? 0 : 1);
