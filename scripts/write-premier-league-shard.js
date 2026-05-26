#!/usr/bin/env node
/** @deprecated Use `node scripts/write-league-shard.js premier-league` */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'write-league-shard.js');
const result = spawnSync(process.execPath, [script, 'premier-league'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
