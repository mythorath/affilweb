#!/usr/bin/env node
import { setTimeout as wait } from 'timers/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCycle() {
  // Run orchestrator as a child process
  const { spawn } = await import('child_process');
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(__dirname, 'run-automation.mjs')], { stdio: 'inherit' });
    p.on('close', () => resolve());
  });
}

async function main() {
  const minutes = parseInt(process.env.CYCLE_MINUTES || '60', 10);
  console.log(`♻️  Continuous mode: generating every ${minutes} minutes. CTRL+C to stop.`);
  // Continuous loop with sleep between cycles
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const start = Date.now();
    try {
      await runCycle();
    } catch (e) {
      console.warn('⚠️ Cycle failed:', e.message);
    }
    const elapsed = (Date.now() - start) / 1000;
    const sleep = Math.max(0, minutes * 60 - elapsed);
    console.log(`⏱️  Sleeping ${Math.round(sleep)}s until next cycle...`);
    await wait(sleep * 1000);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}


