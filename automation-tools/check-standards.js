#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const required = ['AGENTS.md', 'GEMINI.md', 'core-rules/INSTRUCTIONS.md', 'core-rules/governance.md', 'adapters/compatibility.md'];
for (const file of required) {
  if (!fs.readFileSync(path.join(root, file), 'utf8').trim()) throw new Error('缺少有效入口 ' + file);
}
const entry = fs.readFileSync(path.join(root, 'GEMINI.md'), 'utf8');
if (entry.includes('<!-- ACTIVE_ROLE:')) throw new Error('共享入口包含会话角色');
for (const file of ['core-rules/INSTRUCTIONS.md', 'core-rules/governance.md']) {
  if (fs.readFileSync(path.join(root, file), 'utf8').includes('/Users/')) throw new Error('通用总控含个人路径 ' + file);
}
const policies = JSON.parse(fs.readFileSync(path.join(root, 'core-rules/policies.json'), 'utf8'));
const ids = new Set();
for (const control of policies.controls) {
  if (ids.has(control.id) || !control.ownerRole || !control.enforcement.length) throw new Error('控制元信息无效');
  ids.add(control.id);
  if (control.status === 'verified' && !control.evidence.length) throw new Error('控制通过缺少证据');
  if (!fs.existsSync(path.join(root, 'core-rules', control.documentation))) throw new Error('缺少控制正文');
}
console.log('公司规约入口检查通过');
