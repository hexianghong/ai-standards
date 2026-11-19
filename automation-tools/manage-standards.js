#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { inventory, hash } = require('./build-standards');
const START = '<!-- ai-standards:start -->';
const END = '<!-- ai-standards:end -->';
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null; }
function atomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = file + '.tmp-' + process.pid;
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, file);
}
function safeFile(root, relative) {
  if (path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('非法路径 ' + relative);
  let current = root;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    if (fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error('路径包含链接 ' + relative);
  }
  return current;
}
function loadBundle(bundle, expected) {
  const file = path.join(bundle, 'manifest.json');
  if (fs.lstatSync(file).isSymbolicLink()) throw new Error('清单必须是普通文件');
  const raw = fs.readFileSync(file);
  if (!/^[a-f0-9]{64}$/.test(expected || '') || hash(raw) !== expected) throw new Error('发布摘要不匹配，需要可信渠道提供的 SHA256');
  const manifest = JSON.parse(raw);
  if (!Array.isArray(manifest.clients) || !manifest.files || manifest.schemaVersion !== 1 || !/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error('无效发布版本');
  const actual = inventory(bundle);
  if (JSON.stringify(actual) !== JSON.stringify(manifest.files)) throw new Error('发布文件清单不匹配');
  for (const relative of Object.keys(manifest.files)) safeFile(bundle, relative);
  return manifest;
}
function managed(content, block) {
  content = content || '';
  if (content.includes(START) !== content.includes(END)) throw new Error('管理块不完整');
  if (content.includes(START)) {
    if (content.split(START).length !== 2 || content.indexOf(END) < content.indexOf(START)) throw new Error('管理块重复或顺序错误');
    return content.slice(0, content.indexOf(START)) + block + content.slice(content.indexOf(END) + END.length);
  }
  return block + '\n\n' + content;
}
function restore(project, journal) {
  // 先检查所有文件，避免部分恢复后才发现人工编辑
  for (const change of journal.changes) {
    const file = safeFile(project, change.path);
    const current = read(file);
    if (current !== change.before && current !== change.after) throw new Error('恢复冲突，保留人工修改 ' + change.path);
  }
  for (const change of [...journal.changes].reverse()) {
    const file = safeFile(project, change.path);
    if (change.before === null) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      atomic(file, change.before);
      fs.chmodSync(file, change.mode);
    }
  }
}
function run(action, options) {
  const project = fs.realpathSync(options.project || process.cwd());
  const state = safeFile(project, '.agents/state');
  const journalFile = path.join(state, 'transaction.json');
  if (action === 'doctor') {
    const lock = JSON.parse(read(safeFile(project, '.agents/standards.lock.json')) || 'null');
    const issues = [];
    if (lock) {
      const bundle = safeFile(project, '.agents/standards/releases/' + lock.digest);
      try { loadBundle(bundle, lock.digest); } catch (error) { issues.push(error.message); }
      for (const [relative, digest] of Object.entries(lock.entries)) {
        if (hash(read(safeFile(project, relative)) || '') !== digest) issues.push('入口漂移 ' + relative);
      }
    } else issues.push('项目尚未安装版本');
    const journal = JSON.parse(read(journalFile) || 'null');
    if (journal && journal.status === 'pending') issues.push('安装事务待恢复');
    return { version: lock?.version, digest: lock?.digest, issues, loading: '待客户端新会话验证', controls: '待公司执行点实测' };
  }
  let manifest;
  const changes = [];
  if (action === 'install') {
    const bundle = fs.realpathSync(options.bundle);
    manifest = loadBundle(bundle, options.sha256);
    if (manifest.version !== options.version) throw new Error('请求版本与发布版本不一致');
    const clients = (options.client || '').split(',');
    if (!clients.length || clients.some(client => !manifest.clients.includes(client))) throw new Error('客户端必须明确选择 codex 或 antigravity');
    const digest = options.sha256;
    const release = '.agents/standards/releases/' + digest;
    const block = START + '\n公司规约版本 ' + manifest.version + '\n读取 [' + manifest.version + ' 总控](' + release + '/core-rules/INSTRUCTIONS.md)，按任务读取其中技能。\n' + END;
    for (const relative of ['AGENTS.md', ...(clients.includes('antigravity') ? ['GEMINI.md'] : [])]) {
      const file = safeFile(project, relative);
      const before = read(file);
      changes.push({ path: relative, before, after: managed(before, block), mode: before === null ? 0o644 : fs.statSync(file).mode & 0o777 });
    }
    const oldLock = JSON.parse(read(safeFile(project, '.agents/standards.lock.json')) || 'null');
    const skillPrefix = 'stack-templates/skills/';
    for (const relative of Object.keys(manifest.files).filter(file => file.startsWith(skillPrefix))) {
      const skillPath = '.agents/skills/' + relative.slice(skillPrefix.length);
      const file = safeFile(project, skillPath);
      const before = read(file);
      const after = fs.readFileSync(path.join(bundle, relative), 'utf8');
      if (before !== null && before !== after && oldLock?.entries?.[skillPath] !== hash(before)) {
        throw new Error('技能内容冲突，保留项目自有技能 ' + skillPath);
      }
      changes.push({ path: skillPath, before, after, mode: before === null ? 0o644 : fs.statSync(file).mode & 0o777 });
    }
    for (const relative of Object.keys(oldLock?.entries || {}).filter(file => file.startsWith('.agents/skills/'))) {
      if (changes.some(change => change.path === relative)) continue;
      const before = read(safeFile(project, relative));
      if (before !== null && hash(before) !== oldLock.entries[relative]) throw new Error('待移除技能包含人工修改 ' + relative);
      changes.push({ path: relative, before, after: null, mode: 0o644 });
    }
    const entries = Object.fromEntries(changes.filter(change => change.after !== null).map(change => [change.path, hash(change.after)]));
    const lockPath = '.agents/standards.lock.json';
    changes.push({ path: lockPath, before: read(safeFile(project, lockPath)), after: JSON.stringify({ schemaVersion: 1, version: manifest.version, digest, clients, entries }, null, 2) + '\n', mode: 0o644 });
    if (!options.apply) return { action: 'preview', version: manifest.version, files: changes.map(change => change.path), skillDiscovery: '技能逐文件接入 .agents/skills，原生发现待客户端验证' };
  } else if (!['rollback', 'recover'].includes(action)) throw new Error('未知操作');
  fs.mkdirSync(state, { recursive: true });
  const guard = path.join(state, 'install.lock');
  if (action === 'recover' && fs.existsSync(guard)) {
    const stat = fs.statSync(guard);
    const owner = JSON.parse(fs.readFileSync(guard, 'utf8'));
    if (owner.host !== os.hostname() || !Number.isInteger(owner.pid)) throw new Error('锁归属不明，请人工核实');
    try {
      process.kill(owner.pid, 0);
      throw new Error('安装进程仍在运行');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
    const current = fs.statSync(guard);
    if (stat.ino !== current.ino || stat.mtimeMs !== current.mtimeMs) throw new Error('锁已变化，请重试');
    fs.unlinkSync(guard);
  }
  const descriptor = fs.openSync(guard, 'wx');
  try {
    fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, host: os.hostname() }));
    const previous = JSON.parse(read(journalFile) || 'null');
    if (action !== 'install') {
      if (!previous) throw new Error('没有可恢复事务');
      if (previous.status === 'rolled-back') return { action, status: 'already-restored' };
      restore(project, previous);
      atomic(journalFile, JSON.stringify({ ...previous, status: 'rolled-back' }, null, 2));
      return { action, status: 'restored' };
    }
    if (previous?.status === 'pending') throw new Error('存在未完成事务，先执行 recover');
    // 持锁后重新检查，拒绝覆盖并发编辑
    for (const change of changes) if (read(safeFile(project, change.path)) !== change.before) throw new Error('安装期间文件发生变化');
    if (changes.every(change => change.before === change.after)) return { action, status: 'unchanged' };
    const target = safeFile(project, '.agents/standards/releases/' + options.sha256);
    if (fs.existsSync(target)) loadBundle(target, options.sha256);
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const staging = target + '.staging-' + process.pid;
      fs.cpSync(fs.realpathSync(options.bundle), staging, { recursive: true });
      loadBundle(staging, options.sha256);
      fs.renameSync(staging, target);
    }
    if (previous) atomic(path.join(state, 'history-' + Date.now() + '-' + process.pid + '.json'), JSON.stringify(previous));
    const journal = { status: 'pending', version: manifest.version, changes };
    atomic(journalFile, JSON.stringify(journal, null, 2));
    try {
      for (const change of changes) {
        const file = safeFile(project, change.path);
        if (change.after === null) {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } else {
          atomic(file, change.after);
          fs.chmodSync(file, change.mode);
        }
      }
      atomic(journalFile, JSON.stringify({ ...journal, status: 'complete' }, null, 2));
    } catch (error) {
      restore(project, journal);
      atomic(journalFile, JSON.stringify({ ...journal, status: 'rolled-back' }, null, 2));
      throw error;
    }
    return { action, status: 'installed', version: manifest.version, message: '请新建客户端会话验证加载版本' };
  } finally {
    fs.closeSync(descriptor);
    fs.unlinkSync(guard);
  }
}
module.exports = { run, loadBundle, managed, restore };
if (require.main === module) {
  try {
    const [action, ...args] = process.argv.slice(2);
    const options = {};
    for (let index = 0; index < args.length; index++) {
      const key = args[index].replace(/^--/, '');
      if (key === 'apply') options.apply = true;
      else if (['dry-run', 'update', 'u'].includes(key)) continue;
      else {
        if (!['project', 'bundle', 'sha256', 'version', 'client'].includes(key) || !args[index + 1]) throw new Error('无效参数 ' + args[index]);
        options[key] = args[++index];
      }
    }
    console.log(JSON.stringify(run(action, options), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
