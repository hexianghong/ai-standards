#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

function checkSpecs(directory, phase) {
  const spec = fs.readFileSync(path.join(directory, 'spec.md'), 'utf8');
  const tasks = fs.readFileSync(path.join(directory, 'task.md'), 'utf8');
  const plan = fs.readFileSync(path.join(directory, 'implementation_plan.md'), 'utf8');
  const errors = [];
  const criteria = new Set();
  for (const [, id] of spec.matchAll(/^- (AC-\d+)[ \t]+\S.*$/gm)) {
    if (criteria.has(id)) errors.push(`重复验收条件 ${id}`);
    criteria.add(id);
  }
  if (!criteria.size) errors.push('spec.md 缺少验收条件');
  if (!plan.trim()) errors.push('implementation_plan.md 为空');

  const coverage = new Set();
  for (const [, state, description] of tasks.matchAll(/^- \[([ x/])\][ \t]+(.+)$/gm)) {
    const ids = description.match(/\bAC-\d+\b/g) || [];
    if (!ids.length) errors.push(`任务缺少验收条件引用：${description}`);
    for (const id of ids) {
      if (!criteria.has(id)) errors.push(`任务引用未知验收条件 ${id}`);
      coverage.add(id);
    }
    if (phase === 'done' && state !== 'x') errors.push(`任务未完成：${description}`);
  }

  const evidence = new Set();
  if (phase === 'done') {
    const report = fs.readFileSync(path.join(directory, 'walkthrough.md'), 'utf8');
    for (const [, id] of report.matchAll(/^- (AC-\d+) 通过[：:][ \t]*\S.*$/gm)) {
      if (!criteria.has(id)) errors.push(`验证报告引用未知验收条件 ${id}`);
      if (evidence.has(id)) errors.push(`验证报告重复记录 ${id}`);
      evidence.add(id);
    }
  }
  for (const id of criteria) {
    if (!coverage.has(id)) errors.push(`${id} 缺少关联任务`);
    if (phase === 'done' && !evidence.has(id)) errors.push(`${id} 缺少通过证据`);
  }
  return errors;
}

function checkKanbanTransition(root, specPath, stage) {
  const phase = stage === 'development' ? 'plan' : ['release', 'done'].includes(stage) ? 'done' : null;
  if (!phase || typeof specPath !== 'string' ||
      !/^docs\/specs\/(?!archive\/)[a-zA-Z0-9_][a-zA-Z0-9_-]*\/spec\.md$/.test(specPath)) return [];
  try {
    return checkSpecs(path.join(root, path.dirname(specPath)), phase);
  } catch (error) {
    if (error.code === 'ENOENT') return [`缺少过程文档：${path.basename(error.path)}`];
    throw error;
  }
}

module.exports = { checkKanbanTransition };

if (require.main === module) {
  const [phase, directory] = process.argv.slice(2);
  try {
    if (!directory || !['plan', 'done'].includes(phase)) {
      throw new Error('用法：node check-specs.js <plan|done> <需求目录>');
    }
    const errors = checkSpecs(directory, phase);
    if (errors.length) throw new Error(errors.join('\n'));
    console.log(`规格检查通过（${phase}）：${directory}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
