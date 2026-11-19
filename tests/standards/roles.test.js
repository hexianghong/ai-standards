'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { EventEmitter } = require('node:events');
const { createRequire } = require('node:module');

test('真实激活路由保持共享文档不变，两个浏览器会话角色独立', async t => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'roles-test-'));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const rules = path.join(workspace, 'GEMINI.md');
  fs.writeFileSync(rules, '# shared rules\n');
  const serverFile = path.resolve('.agents/gemini-web-chat/server.js');
  const realRequire = createRequire(serverFile);
  let handler;
  const fakeHttp = { ...require('node:http'), createServer(callback) {
    handler = callback;
    return { listen() {} };
  } };
  vm.runInNewContext(fs.readFileSync(serverFile, 'utf8'), {
    require(name) {
      if (name === 'http') return fakeHttp;
      if (name === './inspection-service') return {};
      return realRequire(name);
    },
    __dirname: path.dirname(serverFile),
    process: { env: { WORKSPACE_ROOT: workspace }, cwd: () => workspace },
    console: { log() {}, warn() {}, error() {} },
    Buffer, URL, setTimeout, clearTimeout
  });
  function request(roleId) {
    return new Promise(resolve => {
      const req = new EventEmitter();
      req.url = '/api/roles/activate';
      req.method = 'POST';
      let status;
      const res = { writeHead(code) { status = code; }, end(body) { resolve({ status, body: JSON.parse(body) }); } };
      handler(req, res);
      req.emit('data', JSON.stringify({ roleId }));
      req.emit('end');
    });
  }
  const html = fs.readFileSync(path.resolve('.agents/gemini-web-chat/public/index.html'), 'utf8');
  const start = html.indexOf('async function activateRole(');
  const end = html.indexOf("\n    document.querySelectorAll('.filter-chip')", start);
  assert.ok(start > 0 && end > start);
  function browser() {
    const stored = new Map();
    const context = {
      state: {}, sessionStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) },
      document: { getElementById: () => ({ textContent: '' }) },
      fetch: async (_, options) => { const result = await request(JSON.parse(options.body).roleId); return { ok: result.status === 200, json: async () => result.body }; },
      showToast() {}, renderRoles() {}, alert(message) { throw new Error(message); }
    };
    vm.createContext(context);
    vm.runInContext(html.slice(start, end), context);
    return context;
  }
  const first = browser();
  const second = browser();
  await first.activateRole({ id: 'architect', name: '架构师' });
  // 使用路由返回的实际内置角色 ID
  const source = fs.readFileSync(serverFile, 'utf8');
  const ids = [...source.matchAll(/id: '([^']+)'/g)].map(match => match[1]);
  const another = ids.find(id => id !== 'architect');
  await second.activateRole({ id: another, name: '另一角色' });
  assert.equal(first.sessionStorage.getItem('activeRoleId'), 'architect');
  assert.equal(second.sessionStorage.getItem('activeRoleId'), another);
  assert.equal(fs.readFileSync(rules, 'utf8'), '# shared rules\n');
  assert.equal((await request('unknown-role')).status, 404);
});
