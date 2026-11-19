'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build, hash } = require('../../automation-tools/build-standards');
const { run, loadBundle, restore } = require('../../automation-tools/manage-standards');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'standards-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bundle = path.join(root, 'bundle');
  const sha256 = build('1.0.0', bundle);
  const project = path.join(root, 'project with spaces');
  fs.mkdirSync(project);
  return { root, bundle, project: fs.realpathSync(project), sha256, version: '1.0.0', client: 'codex,antigravity' };
}
test('构建可复现且拒绝覆盖已发布目录', t => {
  const options = fixture(t);
  assert.equal(build('1.0.0', path.join(options.root, 'another')), options.sha256);
  assert.throws(() => build('1.0.0', options.bundle), /exist/i);
});
test('预览无写入，安装保留正文，重复幂等，回滚恢复', t => {
  const options = fixture(t);
  fs.writeFileSync(path.join(options.project, 'AGENTS.md'), '# 团队原规则\n');
  assert.equal(run('install', options).action, 'preview');
  assert.equal(fs.existsSync(path.join(options.project, '.agents')), false);
  assert.equal(run('install', { ...options, apply: true }).status, 'installed');
  assert.deepEqual(run('doctor', options).issues, []);
  assert.match(fs.readFileSync(path.join(options.project, 'AGENTS.md'), 'utf8'), /团队原规则/);
  assert.equal(run('install', { ...options, apply: true }).status, 'unchanged');
  assert.equal(run('rollback', options).status, 'restored');
  assert.equal(fs.readFileSync(path.join(options.project, 'AGENTS.md'), 'utf8'), '# 团队原规则\n');
  assert.equal(fs.existsSync(path.join(options.project, 'GEMINI.md')), false);
});
test('版本升级后回滚恢复旧版本', t => {
  const options = fixture(t);
  run('install', { ...options, apply: true });
  const bundle = path.join(options.root, 'v2');
  const sha256 = build('1.1.0', bundle);
  run('install', { ...options, bundle, sha256, version: '1.1.0', apply: true });
  assert.equal(run('doctor', options).version, '1.1.0');
  run('rollback', options);
  assert.equal(run('doctor', options).version, '1.0.0');
});
test('拒绝错误摘要、篡改产物和版本不符', t => {
  const options = fixture(t);
  assert.throws(() => run('install', { ...options, sha256: '0'.repeat(64) }), /摘要/);
  assert.throws(() => run('install', { ...options, version: '9.0.0' }), /版本/);
  fs.writeFileSync(path.join(options.bundle, 'extra'), 'bad');
  assert.throws(() => loadBundle(options.bundle, options.sha256), /清单/);
});
test('拒绝链接及悬空链接，保留外部文件', t => {
  const options = fixture(t);
  const external = path.join(options.root, 'external');
  fs.symlinkSync(external, path.join(options.project, 'AGENTS.md'));
  assert.throws(() => run('install', options), /链接/);
  assert.equal(fs.existsSync(external), false);
});
test('并发锁阻止覆盖且保留现有事务', t => {
  const options = fixture(t);
  const state = path.join(options.project, '.agents/state');
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(path.join(state, 'install.lock'), 'running');
  assert.throws(() => run('install', { ...options, apply: true }), /EEXIST/);
  assert.equal(fs.readFileSync(path.join(state, 'install.lock'), 'utf8'), 'running');
});
test('回滚遇到人工修改时整体拒绝，诊断报告漂移', t => {
  const options = fixture(t);
  run('install', { ...options, apply: true });
  fs.appendFileSync(path.join(options.project, 'AGENTS.md'), 'manual edit');
  assert.match(run('doctor', options).issues.join(), /漂移/);
  assert.throws(() => run('rollback', options), /冲突/);
  assert.equal(fs.existsSync(path.join(options.project, 'GEMINI.md')), true);
});
test('中断事务恢复，拒绝路径逃逸和未完成事务新安装', t => {
  const options = fixture(t);
  const state = path.join(options.project, '.agents/state');
  fs.mkdirSync(state, { recursive: true });
  fs.writeFileSync(path.join(options.project, 'AGENTS.md'), 'after');
  fs.writeFileSync(path.join(state, 'transaction.json'), JSON.stringify({status:'pending',changes:[{path:'AGENTS.md',before:'before',after:'after',mode:0o644}]}));
  assert.throws(() => run('install', { ...options, apply: true }), /未完成/);
  run('recover', options);
  assert.equal(fs.readFileSync(path.join(options.project, 'AGENTS.md'), 'utf8'), 'before');
  assert.throws(() => restore(options.project, { changes: [{path:'../escape', before:null,after:''}] }), /非法路径/);
});

test('技能接入保留项目技能，同名内容冲突在写入前拒绝', t => {
  const options = fixture(t);
  const custom = path.join(options.project, '.agents/skills/project-only');
  fs.mkdirSync(custom, { recursive: true });
  fs.writeFileSync(path.join(custom, 'SKILL.md'), 'team skill');
  run('install', { ...options, apply: true });
  assert.equal(fs.readFileSync(path.join(custom, 'SKILL.md'), 'utf8'), 'team skill');
  const companySkill = path.join(options.project, '.agents/skills/product-manager/SKILL.md');
  assert.equal(fs.existsSync(companySkill), true);
  fs.appendFileSync(companySkill, 'manual');
  assert.throws(() => run('install', { ...options, apply: true }), /技能内容冲突/);
});
test('升级清理移除的公司技能，回滚恢复', t => {
  const options = fixture(t);
  run('install', { ...options, apply: true });
  const bundle = path.join(options.root, 'without-pm');
  build('2.0.0', bundle);
  fs.rmSync(path.join(bundle, 'stack-templates/skills/product-manager'), { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(bundle, 'manifest.json'), 'utf8'));
  const { inventory } = require('../../automation-tools/build-standards');
  manifest.files = inventory(bundle);
  fs.writeFileSync(path.join(bundle, 'manifest.json'), JSON.stringify(manifest));
  const sha256 = hash(fs.readFileSync(path.join(bundle, 'manifest.json')));
  run('install', { ...options, bundle, sha256, version: '2.0.0', apply: true });
  const skill = path.join(options.project, '.agents/skills/product-manager/SKILL.md');
  assert.equal(fs.existsSync(skill), false);
  run('rollback', options);
  assert.equal(fs.existsSync(skill), true);
});
test('安装中途权限故障回退，保留原始文件权限', t => {
  const options = fixture(t);
  const entry = path.join(options.project, 'AGENTS.md');
  fs.writeFileSync(entry, 'before');
  fs.chmodSync(entry, 0o600);
  const originalRename = fs.renameSync;
  let failed = false;
  t.mock.method(fs, 'renameSync', function (from, to) {
    if (!failed && to === path.join(options.project, 'GEMINI.md')) {
      failed = true;
      const error = new Error('injected permission failure');
      error.code = 'EACCES';
      throw error;
    }
    return originalRename(from, to);
  });
  assert.throws(() => run('install', { ...options, apply: true }), /permission failure/);
  assert.equal(fs.readFileSync(entry, 'utf8'), 'before');
  assert.equal(fs.statSync(entry).mode & 0o777, 0o600);
  assert.equal(fs.existsSync(path.join(options.project, '.agents/standards.lock.json')), false);
});
test('真实进程中断后 recover 识别失效锁并恢复', t => {
  const options = fixture(t);
  const { spawnSync } = require('node:child_process');
  const manager = path.resolve('automation-tools/manage-standards.js');
  const script = `
    const fs = require('node:fs');
    const rename = fs.renameSync;
    fs.renameSync = function(from, to) {
      const result = rename(from, to);
      if (to === process.env.TARGET_ENTRY) process.kill(process.pid, 'SIGKILL');
      return result;
    };
    require(process.env.MANAGER).run('install', JSON.parse(process.env.INSTALL_OPTIONS));
  `;
  const result = spawnSync(process.execPath, ['-e', script], { env: {
    ...process.env, MANAGER: manager, TARGET_ENTRY: path.join(options.project, 'AGENTS.md'),
    INSTALL_OPTIONS: JSON.stringify({ ...options, apply: true })
  } });
  assert.equal(result.signal, 'SIGKILL');
  assert.equal(run('recover', options).status, 'restored');
  assert.equal(fs.existsSync(path.join(options.project, 'AGENTS.md')), false);
});

test('反馈草稿记录版本并只写项目本地状态目录', t => {
  const options = fixture(t);
  const { spawnSync } = require('node:child_process');
  fs.mkdirSync(path.join(options.project, '.agents'));
  fs.writeFileSync(path.join(options.project, '.agents/standards.lock.json'), JSON.stringify({ version: '1.0.0' }));
  const result = spawnSync('bash', [path.resolve('automation-tools/record-feedback.sh'), '--draft', 'test-project', 'case', 'test summary'], { cwd: options.project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const directory = path.join(options.project, '.agents/state/feedback');
  const files = fs.readdirSync(directory);
  assert.equal(files.length, 1);
  assert.match(fs.readFileSync(path.join(directory, files[0]), 'utf8'), /规约版本.*1\.0\.0/);
});
