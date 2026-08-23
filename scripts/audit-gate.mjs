#!/usr/bin/env node
/**
 * Binding npm-audit gate (#22).
 *
 * Runs `npm audit --json` in a package dir and fails (exit 1) when any
 * HIGH or CRITICAL advisory is present that is not listed in the
 * documented allowlist (.github/audit-allowlist.json). Every allowlist
 * entry must carry a reason and a tracking issue — this is the
 * "documented exceptions mechanism" from Task 1.7.
 *
 * Usage: node scripts/audit-gate.mjs <package-dir> [--include-dev]
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/audit-gate.mjs <package-dir> [--include-dev]');
  process.exit(2);
}

const includeDev = process.argv.includes('--include-dev');
const args = ['--json'];
if (!includeDev) args.push('--omit=dev');

let report;
try {
  report = JSON.parse(execSync(`npm audit ${args.join(' ')}`, { cwd: resolve(dir), stdio: ['ignore', 'pipe', 'pipe'] }).toString());
} catch (err) {
  // npm audit exits non-zero when advisories exist — stdout still carries JSON
  try {
    report = JSON.parse(err.stdout?.toString() ?? '{}');
  } catch {
    console.error(`✗ Could not parse npm audit output for ${dir}`);
    process.exit(2);
  }
}

if (!report || typeof report !== 'object' || !('vulnerabilities' in report)) {
  console.error(`✗ Could not parse npm audit output for ${dir} — treating as gate failure`);
  process.exit(2);
}

const allowlistPath = resolve('.github/audit-allowlist.json');
const allowlist = existsSync(allowlistPath)
  ? JSON.parse(readFileSync(allowlistPath, 'utf8'))
  : { exceptions: [] };
const allowedIds = new Set(allowlist.exceptions.flatMap(e => e.ids ?? (e.id ? [e.id] : [])));
const allowedModules = new Set(allowlist.exceptions.map(e => e.module).filter(Boolean));

// npm audit report v2: advisories live under `vulnerabilities`; each entry
// lists its underlying advisories (with GHSA urls) in `via`.
const findings = [];
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  if (!['high', 'critical'].includes(vuln.severity)) continue;
  if (allowedModules.has(vuln.name)) continue; // documented module-level exception
  const ghsas = (Array.isArray(vuln.via) ? vuln.via : [])
    .map(v => {
      const m = typeof v?.url === 'string' ? v.url.match(/GHSA-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}/i) : null;
      return m ? m[0] : null;
    })
    .filter(Boolean);
  const unallowed = ghsas.filter(g => !allowedIds.has(g));
  if (unallowed.length > 0 || ghsas.length === 0) {
    findings.push({ name: vuln.name, severity: vuln.severity, unallowed });
  }
}

if (findings.length === 0) {
  const counts = report.metadata?.vulnerabilities ?? {};
  console.log(`✓ audit gate passed for ${dir} (${counts.total ?? 0} total advisories; high/critical covered by allowlist or none)`);
  process.exit(0);
}

console.error(`✗ audit gate FAILED for ${dir}:`);
for (const f of findings) {
  console.error(`  - [${f.severity}] ${f.name}: unlisted advisories ${f.unallowed.join(', ') || '(no GHSA id — investigate)'}`);
}
console.error('Add an entry to .github/audit-allowlist.json only with a reason + tracking issue.');
process.exit(1);
