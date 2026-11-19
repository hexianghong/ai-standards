#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function inventory(root) {
  const files = {};
  function walk(directory) {
    for (const entry of fs.readdirSync(directory).sort()) {
      const file = path.join(directory, entry);
      const relative = path.relative(root, file).split(path.sep).join('/');
      if (relative === 'manifest.json') continue;
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error('发布目录包含链接 ' + relative);
      if (stat.isDirectory()) walk(file);
      else if (stat.isFile()) files[relative] = hash(fs.readFileSync(file));
      else throw new Error('不支持的发布文件 ' + relative);
    }
  }
  walk(root);
  return files;
}
function build(version, destination) {
  if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('需要完整版本 x.y.z');
  if (!destination) throw new Error('需要输出目录');
  const output = path.resolve(destination);
  fs.mkdirSync(output); // 已存在产物禁止覆盖
  for (const name of ['core-rules', 'stack-templates']) {
    fs.cpSync(path.join(ROOT, name), path.join(output, name), { recursive: true, dereference: false });
  }
  for (const relative of Object.keys(inventory(output))) {
    if (!relative.endsWith('.md')) continue;
    const file = path.join(output, relative);
    const content = fs.readFileSync(file, 'utf8').replace(/file:\/\/\/Users\/hexianghong\/code\/ai-standards\/([^\s)]+)/g,
      (_, target) => path.relative(path.dirname(file), path.join(output, target)).split(path.sep).join('/'));
    fs.writeFileSync(file, content);
  }
  const sourceCommit = execFileSync('git', ['-c', 'core.fsmonitor=false', 'rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const manifest = { schemaVersion: 1, sourceCommit, runtime: 'node >= 22', version, clients: ['codex', 'antigravity'], files: inventory(output) };
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return hash(fs.readFileSync(path.join(output, 'manifest.json')));
}
module.exports = { build, inventory, hash };
if (require.main === module) {
  try { console.log(build(...process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
