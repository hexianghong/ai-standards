#!/usr/bin/env node

/**
 * Gemini Web Chat Service for Antigravity Simple Browser
 * Zero-dependency Node.js HTTP Server
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Simple built-in .env parser (Zero dependencies)
function resolveWorkspaceRoot() {
  if (process.env.WORKSPACE_ROOT && fs.existsSync(process.env.WORKSPACE_ROOT)) {
    return path.resolve(process.env.WORKSPACE_ROOT);
  }
  let current = path.resolve(process.cwd());
  while (true) {
    if (
      fs.existsSync(path.join(current, 'GEMINI.md')) ||
      fs.existsSync(path.join(current, 'GEMINI_GLOBAL.md')) ||
      fs.existsSync(path.join(current, '.agents')) ||
      fs.existsSync(path.join(current, '.agent')) ||
      fs.existsSync(path.join(current, '.git')) ||
      fs.existsSync(path.join(current, 'package.json')) ||
      fs.existsSync(path.join(current, 'go.mod')) ||
      fs.existsSync(path.join(current, 'pom.xml'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return path.resolve(process.cwd());
}

const WORKSPACE_ROOT = resolveWorkspaceRoot();
const GEMINI_MD_PATH = path.join(WORKSPACE_ROOT, 'GEMINI.md');
const CUSTOM_ROLES_PATH = path.join(__dirname, 'custom-roles.json');

function getDocsDir() {
  const docCandidate = path.join(WORKSPACE_ROOT, 'doc');
  const docsCandidate = path.join(WORKSPACE_ROOT, 'docs');
  if (fs.existsSync(docCandidate) && fs.statSync(docCandidate).isDirectory()) {
    return docCandidate;
  }
  if (fs.existsSync(docsCandidate) && fs.statSync(docsCandidate).isDirectory()) {
    return docsCandidate;
  }
  // 都不存在时优先创建 docs 目录
  try {
    fs.mkdirSync(docsCandidate, { recursive: true });
  } catch (e) {}
  return docsCandidate;
}

function getSkillsDir() {
  const candidates = [
    path.join(WORKSPACE_ROOT, '.agents/skills'),
    path.join(WORKSPACE_ROOT, '.agent/skills'),
    path.join(__dirname, '../skills'),
    path.resolve(__dirname, '../../stack-templates/skills')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return path.join(WORKSPACE_ROOT, '.agents/skills');
}

function getKanbanPath() {
  const candidates = [
    path.join(WORKSPACE_ROOT, '.agents/agile-kanban.json'),
    path.join(WORKSPACE_ROOT, '.agents/gemini-web-chat/agile-kanban.json'),
    path.join(WORKSPACE_ROOT, 'agile-kanban.json'),
    path.join(__dirname, 'agile-kanban.json')
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  return path.join(__dirname, 'agile-kanban.json');
}

function loadEnv() {
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(WORKSPACE_ROOT, '.agents/gemini-web-chat/.env'),
    path.join(WORKSPACE_ROOT, '.env'),
    path.join(process.cwd(), '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        });
        console.log(`[Config] 已成功加载配置文件: ${envPath}`);
        break;
      } catch (e) {
        console.warn(`[Config] 加载 ${envPath} 失败:`, e.message);
      }
    }
  }
}

loadEnv();

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5280;
const PUBLIC_DIR = path.join(__dirname, 'public');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key, x-gemini-base-url'
  });
  res.end(JSON.stringify(data));
}
// Built-in HTTPS Proxy Agent over HTTP CONNECT (Zero external dependencies)
const net = require('net');
const tls = require('tls');

function getProxyUrl() {
  return process.env.HTTPS_PROXY || 
         process.env.https_proxy || 
         process.env.HTTP_PROXY || 
         process.env.http_proxy || 
         process.env.ALL_PROXY || 
         process.env.all_proxy || 
         '';
}

function createTunnelAgent(proxyUrlStr) {
  try {
    const proxyParsed = new url.URL(proxyUrlStr);
    const agent = new https.Agent({ keepAlive: true });
    
    agent.createConnection = (options, callback) => {
      const connectReq = http.request({
        host: proxyParsed.hostname,
        port: proxyParsed.port || (proxyParsed.protocol === 'https:' ? 443 : 8080),
        method: 'CONNECT',
        path: `${options.host || options.hostname}:${options.port || 443}`,
        headers: {
          Host: `${options.host || options.hostname}:${options.port || 443}`,
          ...(proxyParsed.username ? {
            'Proxy-Authorization': 'Basic ' + Buffer.from(`${decodeURIComponent(proxyParsed.username)}:${decodeURIComponent(proxyParsed.password || '')}`).toString('base64')
          } : {})
        }
      });

      connectReq.on('connect', (res, socket, head) => {
        if (res.statusCode !== 200) {
          callback(new Error(`Proxy CONNECT failed with status ${res.statusCode}: ${res.statusMessage}`));
          return;
        }
        const tlsSocket = tls.connect({
          socket: socket,
          servername: options.servername || options.host || options.hostname
        }, () => {
          callback(null, tlsSocket);
        });
        tlsSocket.on('error', err => callback(err));
      });

      connectReq.on('error', err => {
        callback(err);
      });

      connectReq.end();
    };

    return agent;
  } catch (e) {
    console.warn('[Proxy Warning] 无效的代理地址:', proxyUrlStr, e.message);
    return null;
  }
}

function handleOptions(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key, x-gemini-base-url',
    'Access-Control-Max-Age': '86400'
  });
  res.end();
}

console.log(`[Workspace] 当前工作区根目录: ${WORKSPACE_ROOT}`);
console.log(`[Workspace] 文档持久化目录: ${getDocsDir()}`);
// Default built-in roles
const PRESET_ROLES = [
  {
    id: 'architect',
    icon: '🏗️',
    name: '云原生全栈架构师',
    tag: '系统架构 / 技术选型',
    summary: '专注于高可用微服务、分布式系统解耦、领域建模与高并发设计。',
    systemPrompt: '你是一个顶级云原生全栈架构师与技术委员会主席。在回答或编写方案时：\n1. 深入权衡分布式一致性、高可用（HA）、容灾与吞吐瓶颈；\n2. 优先输出 DDD 领域模型、架构拓扑与清晰的 Mermaid 结构图；\n3. 强调微服务边界划分与防腐层设计，杜绝循环依赖与单点故障。',
    rules: [
      '优先输出 Mermaid 架构拓扑与时序图',
      '强制进行 CAP / BASE 定理与并发性能权衡分析',
      '确保所有设计方案符合云原生 12-Factor 标准'
    ]
  },
  {
    id: 'code-reviewer',
    icon: '🔍',
    name: '代码评审专家 (Code Reviewer)',
    tag: '质量把控 / 重构优化',
    summary: '严苛审查代码坏味道、并发安全、内存泄漏、边界异常与性能隐患。',
    systemPrompt: '你是一个世界级代码评审专家（Google Code Review 标准）。在审查或编写代码时：\n1. 严格检查潜在的 NPE、Panic、未捕获异常与 Goroutine/线程泄漏；\n2. 审查类型安全性，杜绝滥用 any / Object / 裸反射；\n3. 给出重构建议时，必须清晰对比 Before 与 After 代码 diff，并解释改进理由。',
    rules: [
      '所有代码缺陷必须指出严重等级 (Blocker / Critical / Major / Minor)',
      '输出清晰的修改前后代码对比 (Diff 格式)',
      '强制检查边界条件、并发竞争与资源释放 (try-with-resources / defer)'
    ]
  },
  {
    id: 'sre-troubleshooter',
    icon: '🛠️',
    name: 'SRE 应急排障大师',
    tag: '故障定位 / 根因分析',
    summary: '专注于线上突发故障诊断、CPU/内存飙升、慢 SQL、死锁与容器异常追溯。',
    systemPrompt: '你是一个资深 SRE 架构师与应急排障专家。在分析故障或排错时：\n1. 严格按照「止血 -> 定位 -> 根因分析 -> 长效加固」的 SOP 推进；\n2. 深入剖析 JVM GC/堆Dump、Go pprof、网络连接池耗尽、慢查询与死锁等底层指标；\n3. 给出具体的 Linux 诊断命令、kubectl 排查命令与复盘防范措施。',
    rules: [
      '先出止血临时方案，再追查深层根因',
      '排查步骤必须附带具体的 Linux/kubectl/日志排查指令',
      '杜绝盲目重启，必须保留现场堆栈信息'
    ]
  },
  {
    id: 'product-manager',
    icon: '📋',
    name: '资深产品经理 (PM)',
    tag: '需求分析 / PRD / 泳道图',
    summary: '专注于业务建模、User Story 敏捷拆解、投资回报（ROI）与验收标准（AC）。',
    systemPrompt: '你是一个资深产品总监（PM）。在梳理产品需求或功能设计时：\n1. 遵循 INVEST 原则拆解敏捷 User Story，包含清晰的 Gherkin 格式验收标准 (Given-When-Then)；\n2. 输出清晰的跨角色业务泳道图 (Mermaid Sequence/Flowchart)；\n3. 使用 RICE 或 MoSCoW 模型评估功能优先级，并制定可量化的核心指标体系。',
    rules: [
      '所有需求拆解必须附带 Gherkin 格式验收标准 (AC)',
      '输出业务泳道流程图与状态机转换图',
      '明确定义业务指标与埋点事件定义'
    ]
  },
  {
    id: 'security-auditor',
    icon: '🛡️',
    name: '安全与合规审计员',
    tag: '安全红线 / OWASP / 凭证防护',
    summary: '专注于 OWASP Top 10、数据脱敏、越权防护、SQL 注入与凭证泄露防线。',
    systemPrompt: '你是一个企业级首席安全官（CSO）与安全审计员。在审计或编写代码时：\n1. 严格检查是否包含硬编码密码/API Key/私钥，发现立即告警；\n2. 严防水平/垂直越权、SQL 注入、XSS、CSRF 与不安全反序列化；\n3. 确保所有敏感字段在存储与日志打印时均经过严格脱敏。',
    rules: [
      '严禁任何明文密钥出现在代码与日志中',
      '所有接口强制校验租户与用户归属权（防越权）',
      '所有外部输入必须进行防御性白名单校验与参数化绑定'
    ]
  },
  {
    id: 'frontend-expert',
    icon: '⚡',
    name: '前端体验与性能专家',
    tag: 'React / Vue3 / Web Vitals',
    summary: '专注于 Core Web Vitals、流畅动效、强类型规范、组件复用与暗黑主题设计。',
    systemPrompt: '你是一个资深前端技术专家。在进行 Web 开发时：\n1. 严格推行 TypeScript 强类型规范（零 any 政策），确保组件与 Hooks 单一职责；\n2. 追求极致视觉美学与微动效，熟练应用 Modern CSS、Tailwind 与自适应暗黑模式；\n3. 深度优化首屏加载、LCP、CLS、长列表虚拟滚动与资源按需加载。',
    rules: [
      '严格零 any，Props 与 State 必须具备严密类型注解',
      'UI 设计必须符合现代美学规范（磨砂玻璃/渐变/微动效/优雅排版）',
      '组件必须具备完善的骨架屏与 Loading/Error 容错态'
    ]
  },
  {
    id: 'qa-engineer',
    icon: '🧪',
    name: '自动化测试与 QA 专家',
    tag: '单元测试 / 边界用例 / E2E',
    summary: '专注于极端边界用例设计、Mock 隔离、并发争用测试与自动化回归套件。',
    systemPrompt: '你是一个资深自动化测试架构师。在编写测试用例或审查逻辑时：\n1. 严格遵循 AAA (Arrange-Act-Assert) 模式组织单元测试与集成测试；\n2. 重点挖掘空指针、超大并发、网络超时、精度截断与溢出等极端边界用例；\n3. 确保测试代码具备独立性与幂等性，杜绝共享状态导致偶发失败。',
    rules: [
      '测试必须覆盖正常路径与至少 3 个以上的异常极端边界路径',
      '对外部数据库、第三方 API 强制使用 Mock / Stub 隔离',
      '测试断言必须具有明确的期望值与失败提示信息'
    ]
  },
  {
    id: 'fullstack-hacker',
    icon: '🚀',
    name: '全栈极客开发专家',
    tag: '快速交付 / 生产就绪 / 健壮',
    summary: '快速产出端到端生产级代码，逻辑严密，精简优雅，即插即用。',
    systemPrompt: '你是一个全栈极客开发专家。在编写代码与实现需求时：\n1. 优先提供完整、可直接运行的生产级代码，避免残缺伪代码；\n2. 代码结构精炼清晰，内置防御性容错与结构化日志；\n3. 保证模块高内聚低耦合，符合开箱即用体验。',
    rules: [
      '优先输出完整 drop-in 代码实现',
      '内置健壮的异常捕获与友好错误提示',
      '遵循项目现有的目录规范与编程风格'
    ]
  }
];

function getAgentSkills() {
  const skillsDir = getSkillsDir();
  const skills = [];
  
  if (!fs.existsSync(skillsDir)) return skills;
  
  try {
    const entries = fs.readdirSync(skillsDir);
    for (const entryName of entries) {
      if (entryName.startsWith('.')) continue;
      const fullSkillDir = path.join(skillsDir, entryName);
      const skillMdPath = path.join(fullSkillDir, 'SKILL.md');
      
      if (fs.existsSync(skillMdPath)) {
        try {
          const content = fs.readFileSync(skillMdPath, 'utf-8');
          let name = entryName;
          let description = '';
          const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
          if (fmMatch) {
            const lines = fmMatch[1].split('\n');
            for (const line of lines) {
              if (line.startsWith('name:')) name = line.replace('name:', '').trim();
              if (line.startsWith('description:')) description = line.replace('description:', '').trim();
            }
          }
          
          const titleMatch = content.match(/# ([^\n]+)/);
          const title = titleMatch ? titleMatch[1].trim() : name;
          
          const iconMap = {
            'product-manager': '📋',
            'macro-architecture-cartographer': '🗺️',
            'ops-troubleshooting': '🛠️',
            'backend-go': '🐹',
            'backend-java': '☕',
            'frontend-react': '⚛️',
            'frontend-vue3': '🟢',
            'logging-standard': '📝',
            'devops-shell': '🐚',
            'repo-map-analyzer': '🔍'
          };

          const tagMap = {
            'product-manager': 'PM / 需求与PRD',
            'macro-architecture-cartographer': '架构全景 / 拓扑测绘',
            'ops-troubleshooting': 'SRE / 应急排障',
            'backend-go': 'Go / 高并发微服务',
            'backend-java': 'Java / 企业级高并发',
            'frontend-react': 'React / TypeScript',
            'frontend-vue3': 'Vue3 / Tailwind',
            'logging-standard': '统一日志 / 链路追踪',
            'devops-shell': 'Shell / 自动化运维',
            'repo-map-analyzer': '代码图谱 / 符号骨架'
          };

          let systemPrompt = `你现在已被设定为【${title}】专家。请严格遵循本技能的架构规范与执行工作流：\n- 技能规约路径: .agents/skills/${entryName}/SKILL.md\n- 核心职责: ${description}`;
          const personaMatch = content.match(/## 0\.\s*角色设定[^\n]*\n([\s\S]*?)(?=\n---\n|\n## |\Z)/);
          if (personaMatch) {
            systemPrompt = personaMatch[1].trim();
          }

          skills.push({
            id: entryName,
            isSkill: true,
            source: '.agents/skills',
            skillPath: `.agents/skills/${entryName}/SKILL.md`,
            icon: iconMap[entryName] || '📦',
            name: title,
            tag: tagMap[entryName] || '本地技能角色',
            summary: description || title,
            systemPrompt: systemPrompt,
            rules: [
              `严格遵循 [.agents/skills/${entryName}/SKILL.md](file://${skillMdPath}) 技能规约`,
              `输出符合本技能流水线 (Pipeline) 的高质量交付件`
            ]
          });
        } catch (err) {
          console.warn(`[Agent Skills] 读取技能 ${entryName} 失败:`, err.message);
        }
      }
    }
  } catch (e) {
    console.warn('[Agent Skills] 扫描 .agents/skills 目录失败:', e.message);
  }
  return skills;
}

function getCustomRoles() {
  if (fs.existsSync(CUSTOM_ROLES_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CUSTOM_ROLES_PATH, 'utf-8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveCustomRoles(roles) {
  fs.writeFileSync(CUSTOM_ROLES_PATH, JSON.stringify(roles, null, 2), 'utf-8');
}

function parseActiveRoleFromGeminiMd() {
  if (!fs.existsSync(GEMINI_MD_PATH)) return null;
  try {
    const content = fs.readFileSync(GEMINI_MD_PATH, 'utf-8');
    const match = content.match(/<!-- ACTIVE_ROLE:([a-zA-Z0-9_-]+) -->/);
    if (match) return match[1];
    return null;
  } catch (e) {
    return null;
  }
}

function activateRoleInGeminiMd(role) {
  let content = '';
  if (fs.existsSync(GEMINI_MD_PATH)) {
    content = fs.readFileSync(GEMINI_MD_PATH, 'utf-8');
  } else {
    content = '# AI Standards Business Context & Local Rules (GEMINI.md)\n\n';
  }

  const skillLink = role.isSkill 
    ? `\n- **技能规约入口 (SSOT)**: [${role.skillPath}](file://${path.join(WORKSPACE_ROOT, role.skillPath)})`
    : '';

  const roleSection = `<!-- ACTIVE_ROLE:${role.id} -->
## 0. 当前激活的 AI 角色与人设规约 (Active Agent Persona)
- **当前角色**: ${role.icon || '🤖'} **${role.name}**
- **核心定位**: ${role.summary || ''}${skillLink}
- **专属系统提示词 (System Instructions)**:
> ${role.systemPrompt ? role.systemPrompt.replace(/\n/g, '\n> ') : '暂无专属提示词'}
- **核心执行准则 (Guardrails)**:
${(role.rules || []).map(r => `  - ${r}`).join('\n')}
<!-- END_ACTIVE_ROLE -->`;

  const roleRegex = /<!-- ACTIVE_ROLE:[\s\S]*?<!-- END_ACTIVE_ROLE -->/g;
  if (roleRegex.test(content)) {
    content = content.replace(roleRegex, roleSection);
  } else {
    const headerMatch = content.match(/^(# [^\n]+\n+)/);
    if (headerMatch) {
      content = content.replace(headerMatch[1], `${headerMatch[1]}${roleSection}\n\n---\n\n`);
    } else {
      content = `${roleSection}\n\n---\n\n${content}`;
    }
  }

  fs.writeFileSync(GEMINI_MD_PATH, content, 'utf-8');
  return content;
}

const inspectionService = require('./inspection-service');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  // Health check
  if (pathname === '/api/health') {
    return sendJson(res, 200, { status: 'ok', time: new Date().toISOString() });
  }

  // ========================================================
  // System Health Inspection & Scheduled Diagnosis APIs
  // ========================================================
  if (pathname === '/api/inspection/health' && req.method === 'GET') {
    inspectionService.getQuickHealth().then(data => sendJson(res, 200, data));
    return;
  }

  if (pathname === '/api/inspection/run' && req.method === 'POST') {
    inspectionService.runDiagnosis().then(report => {
      sendJson(res, 200, report);
    });
    return;
  }

  if (pathname === '/api/inspection/history' && req.method === 'GET') {
    return sendJson(res, 200, inspectionService.getHistory());
  }

  if (pathname === '/api/inspection/schedule' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { intervalSeconds, action } = JSON.parse(body || '{}');
        if (action === 'stop') {
          inspectionService.stopSchedule();
          return sendJson(res, 200, { success: true, message: '定时巡检引擎已停止' });
        }
        inspectionService.startSchedule(intervalSeconds || 60);
        return sendJson(res, 200, {
          success: true,
          message: `定时巡检引擎已就绪，周期: 每 ${inspectionService.intervalSeconds} 秒`,
          intervalSeconds: inspectionService.intervalSeconds
        });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }

  // Config check
  if (pathname === '/api/config' && req.method === 'GET') {
    return sendJson(res, 200, {
      hasServerKey: Boolean(process.env.GEMINI_API_KEY),
      defaultModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com',
      sysPrompt: process.env.GEMINI_SYS_PROMPT || '',
      proxy: getProxyUrl()
    });
  }

  // Get all roles & active role
  if (pathname === '/api/roles' && req.method === 'GET') {
    const agentSkills = getAgentSkills();
    const customRoles = getCustomRoles();
    const activeRoleId = parseActiveRoleFromGeminiMd() || (agentSkills[0]?.id || 'architect');
    return sendJson(res, 200, {
      activeRoleId,
      agentSkills,
      presetRoles: PRESET_ROLES,
      customRoles,
      allRoles: [...agentSkills, ...PRESET_ROLES, ...customRoles]
    });
  }

  // Activate role to GEMINI.md
  if (pathname === '/api/roles/activate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const allRoles = [...getAgentSkills(), ...PRESET_ROLES, ...getCustomRoles()];
        let targetRole = allRoles.find(r => r.id === payload.roleId);
        if (!targetRole && payload.name) {
          targetRole = payload;
        }
        if (!targetRole) {
          return sendJson(res, 404, { error: { message: '角色不存在' } });
        }

        const updatedGeminiMd = activateRoleInGeminiMd(targetRole);
        console.log(`[Role Studio] ✅ 已成功激活角色 [${targetRole.name}] 并同步至 GEMINI.md`);
        return sendJson(res, 200, {
          success: true,
          activeRole: targetRole,
          geminiMdPath: GEMINI_MD_PATH,
          message: `角色【${targetRole.name}】已成功应用至 Antigravity IDE 原生 Chat！`
        });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }

  // Create / save custom role
  if (pathname === '/api/roles/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const role = JSON.parse(body || '{}');
        if (!role.name) {
          return sendJson(res, 400, { error: { message: '角色名称不能为空' } });
        }
        if (!role.id) {
          role.id = 'custom-' + Date.now().toString(36);
        }
        const customRoles = getCustomRoles();
        const existingIdx = customRoles.findIndex(r => r.id === role.id);
        if (existingIdx >= 0) {
          customRoles[existingIdx] = role;
        } else {
          customRoles.push(role);
        }
        saveCustomRoles(customRoles);
        return sendJson(res, 200, { success: true, role });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }

  // Delete custom role
  if (pathname === '/api/roles/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { roleId } = JSON.parse(body || '{}');
        let customRoles = getCustomRoles();
        customRoles = customRoles.filter(r => r.id !== roleId);
        saveCustomRoles(customRoles);
        return sendJson(res, 200, { success: true });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }
  // ========================================================
  // Document Persistence Endpoints (docs/ & doc/)
  // ========================================================
  if (pathname === '/api/docs/list' && req.method === 'GET') {
    const docsDir = getDocsDir();
    const result = [];

    function scanDocs(dir, relativeTo) {
      if (!fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(relativeTo, fullPath);
          if (entry.isDirectory()) {
            scanDocs(fullPath, relativeTo);
          } else if (entry.name.endsWith('.md')) {
            const stat = fs.statSync(fullPath);
            result.push({
              name: entry.name,
              path: relPath,
              fullPath: fullPath,
              sizeBytes: stat.size,
              updatedAt: stat.mtime.toISOString()
            });
          }
        }
      } catch (e) {}
    }

    scanDocs(docsDir, WORKSPACE_ROOT);
    return sendJson(res, 200, {
      docsDir: path.relative(WORKSPACE_ROOT, docsDir),
      docs: result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    });
  }

  if (pathname === '/api/docs/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filename, content, subDir = '' } = JSON.parse(body || '{}');
        if (!filename || !content) {
          return sendJson(res, 400, { error: { message: '文件名和内容不能为空' } });
        }
        const safeFilename = path.basename(filename).endsWith('.md') ? path.basename(filename) : `${path.basename(filename)}.md`;
        const docsDir = getDocsDir();
        const targetDir = subDir ? path.join(docsDir, subDir) : docsDir;

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const fullPath = path.join(targetDir, safeFilename);
        fs.writeFileSync(fullPath, content, 'utf-8');
        const relPath = path.relative(WORKSPACE_ROOT, fullPath);
        console.log(`[Document Persistence] 📄 文档已持久化落盘: ${relPath}`);
        return sendJson(res, 200, {
          success: true,
          relPath,
          fullPath,
          message: `文档已成功保存至 ${relPath}`
        });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }
  // ========================================================
  // Agile Kanban Endpoints
  // ========================================================
  const KANBAN_DATA_PATH = getKanbanPath();

  const KANBAN_STAGES = [
    { id: 'backlog', name: '📥 需求池', en: 'Backlog', desc: '价值辨析、User Story 与优先级评估' },
    { id: 'design', name: '📐 方案设计', en: 'Spec Design', desc: '架构影响分析与 implementation_plan.md' },
    { id: 'development', name: '💻 敏捷开发', en: 'In Dev', desc: 'TDD 红绿微循环与代码外科手术修改' },
    { id: 'testing', name: '🧪 质量验证', en: 'QA Testing', desc: '极端边界用例与 walkthrough.md 验收' },
    { id: 'release', name: '🚀 远程发布', en: 'Git Release', desc: 'Conventional Commit 与 Git Push 远程分支' },
    { id: 'done', name: '✅ 闭环完成', en: 'Done', desc: '过程资产自动归档与复盘反哺' }
  ];

  function getKanbanTasks() {
    if (fs.existsSync(KANBAN_DATA_PATH)) {
      try {
        return JSON.parse(fs.readFileSync(KANBAN_DATA_PATH, 'utf-8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  function saveKanbanTasks(tasks) {
    const parentDir = path.dirname(KANBAN_DATA_PATH);
    if (!fs.existsSync(parentDir)) {
      try { fs.mkdirSync(parentDir, { recursive: true }); } catch (e) {}
    }
    fs.writeFileSync(KANBAN_DATA_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
  }

  function autoGenerateDoneDocument(task) {
    try {
      const docsDir = getDocsDir();
      const completedDir = path.join(docsDir, 'completed');
      if (!fs.existsSync(completedDir)) {
        fs.mkdirSync(completedDir, { recursive: true });
      }

      const safeId = (task.id || 'task').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeId}-completion-record.md`;
      const fullPath = path.join(completedDir, filename);
      const relPath = path.relative(WORKSPACE_ROOT, fullPath);

      const dodItems = (task.dod && task.dod.length > 0)
        ? task.dod.map(d => `- [x] **${d}** (已验证并通过)`).join('\n')
        : '- [x] **核心业务逻辑开发与单元测试验证通过**\n- [x] **静态代码检查与安全红线合规**\n- [x] **全流程交付件验证通过**';

      const priorDocSection = task.docLink
        ? `\n- **前置设计/规格说明**: [${task.docLink}](file://${path.join(WORKSPACE_ROOT, task.docLink)})`
        : '';

      const content = `# 🎉 敏捷研发任务闭环落地报告 (Completion Record)

## 1. 任务基本元信息 (Metadata)
- **任务编号**: \`${task.id}\`
- **任务标题**: **${task.title}**
- **当前状态**: ✅ \`done\` (已闭环完成)
- **主要负责人**: ${task.assignee || '全栈工程师'}
- **任务优先级**: \`${task.priority || 'P1'}\`
- **所属标签/模块**: \`${task.tag || '通用'}\`
- **创建时间**: ${task.createdAt || 'N/A'}
- **闭环归档时间**: ${task.updatedAt || new Date().toISOString()}${priorDocSection}

---

## 2. 需求背景与交付总结 (Summary)
> ${task.summary || '该敏捷研发任务已完成完整的需求验证、核心实现、自动化测试与代码评审，各项准出条件均已达成，顺利流转至 Done 闭环状态。'}

---

## 3. 验收标准达成情况 (Definition of Done)
${dodItems}

---

## 4. 资产沉淀与长效追踪 (Traceability)
- **自动归档路径**: \`${relPath}\`
- **执行规约总控**: [GEMINI_GLOBAL.md](file://${path.join(WORKSPACE_ROOT, 'GEMINI_GLOBAL.md')})
- **归档说明**: 本文档由 Antigravity 敏捷看板流转至 \`done\` 闭环阶段时由系统自动静默落地，确保研发过程资产可回溯、可审计。
`;

      fs.writeFileSync(fullPath, content, 'utf-8');
      console.log(`[Agile Kanban] 🏛️ 任务 [${task.title}] 闭环完成文档已自动静默落地: ${relPath}`);
      task.completedDocLink = relPath;
      if (!task.docLink) {
        task.docLink = relPath;
      }
      return relPath;
    } catch (e) {
      console.warn(`[Agile Kanban] 自动生成闭环文档失败:`, e.message);
      return null;
    }
  }

  // Get Kanban Board data
  if (pathname === '/api/kanban' && req.method === 'GET') {
    const tasks = getKanbanTasks();
    return sendJson(res, 200, {
      stages: KANBAN_STAGES,
      tasks: tasks,
      totalCount: tasks.length,
      doneCount: tasks.filter(t => t.stage === 'done').length
    });
  }

  // Move task to new stage
  if (pathname === '/api/kanban/move' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { taskId, targetStage } = JSON.parse(body || '{}');
        const tasks = getKanbanTasks();
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
          return sendJson(res, 404, { error: { message: '任务不存在' } });
        }
        const oldStage = task.stage;
        task.stage = targetStage;
        task.updatedAt = new Date().toISOString();

        // 当流转至闭环完成 (done) 阶段时，静默自动落地完成文档
        if (targetStage === 'done') {
          autoGenerateDoneDocument(task);
        } else {
          task.archived = false;
        }

        saveKanbanTasks(tasks);
        console.log(`[Agile Kanban] 🔄 任务 [${task.title}] 流转: ${oldStage} -> ${targetStage}`);
        const extraMsg = targetStage === 'done' ? '（已自动生成并落地闭环完成文档）' : '';
        return sendJson(res, 200, { success: true, task, message: `任务已流转至【${targetStage}】阶段${extraMsg}` });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }

  // Create / Update task
  if (pathname === '/api/kanban/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const task = JSON.parse(body || '{}');
        if (!task.title) {
          return sendJson(res, 400, { error: { message: '任务标题不能为空' } });
        }
        if (!task.id) {
          task.id = 'task-' + Date.now().toString(36);
        }
        if (!task.stage) {
          task.stage = 'backlog';
        }

        // 当闭环完成 (done) 点击保存后，自动归档并不在活动闭环列表中展示
        if (task.stage === 'done') {
          task.archived = true;
          task.archivedAt = task.archivedAt || new Date().toISOString();
          autoGenerateDoneDocument(task);
        } else {
          task.archived = false;
        }

        const tasks = getKanbanTasks();
        const existingIdx = tasks.findIndex(t => t.id === task.id);
        if (existingIdx >= 0) {
          tasks[existingIdx] = { ...tasks[existingIdx], ...task, updatedAt: new Date().toISOString() };
        } else {
          tasks.unshift({ ...task, createdAt: new Date().toISOString() });
        }
        saveKanbanTasks(tasks);
        return sendJson(res, 200, { success: true, task });
      } catch (err) {
        return sendJson(res, 500, { error: { message: err.message } });
      }
    });
    return;
  }
  // Streaming Gemini Chat API Proxy
  if (pathname === '/api/chat/stream' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const apiKey = payload.apiKey || process.env.GEMINI_API_KEY;
        const model = payload.model || process.env.DEFAULT_MODEL || 'gemini-2.5-flash';
        const rawBaseUrl = payload.baseUrl || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';

        if (!apiKey) {
          return sendJson(res, 400, {
            error: {
              message: '未配置 Gemini API Key，请在界面设置中填入或配置在 .env 中。'
            }
          });
        }

        const targetUrl = `${rawBaseUrl.replace(/\/+$/, '')}/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

        // Forward Gemini contents payload
        const geminiRequestBody = {
          contents: payload.contents || [],
          systemInstruction: payload.systemInstruction || undefined,
          generationConfig: payload.generationConfig || undefined,
          safetySettings: payload.safetySettings || undefined
        };

        const postData = JSON.stringify(geminiRequestBody);
        await proxyStreamingRequest(targetUrl, postData, res);
      } catch (err) {
        if (!res.headersSent) {
          sendJson(res, 500, { error: { message: err.message } });
        } else {
          res.write(`data: ${JSON.stringify({ error: { message: err.message } })}\n\n`);
          res.end();
        }
      }
    });
    return;
  }
  // Static file serving
  if (req.method === 'GET') {
    // 允许通过 /docs/... 路径直接读取工作区生成的 markdown 文档
    if (pathname.startsWith('/docs/') || pathname.startsWith('/doc/')) {
      const docRelPath = pathname.replace(/^\/docs?\//, '');
      const docFullPath = path.join(getDocsDir(), docRelPath);
      if (fs.existsSync(docFullPath) && fs.statSync(docFullPath).isFile()) {
        const content = fs.readFileSync(docFullPath, 'utf-8');
        res.writeHead(200, {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(content);
      }
    }

    const publicDir = path.join(__dirname, 'public');
    let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

const PORT = parseInt(process.env.PORT, 10) || 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log('='.repeat(60));
  console.log(`🚀 Gemini Web Chat 工作台已在本地启动: http://127.0.0.1:${PORT}`);
  console.log(`👉 专属适配 Antigravity Simple Browser，已加载 ${PRESET_ROLES.length} 个内置角色与本地技能`);
  console.log(`📁 当前绑定的工作区根目录: ${WORKSPACE_ROOT}`);
  console.log(`📄 研发文档持久化目录: ${getDocsDir()}`);
  console.log('='.repeat(60));
});