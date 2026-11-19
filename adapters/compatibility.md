# 客户端接入与验证

当前适配产物通过项目入口引用版本目录中的总控和技能。技能文件已按归属接入 .agents/skills，原生发现、组织托管配置及权限执行点需要在公司实际客户端验证。

| 客户端 | 入口产物 | 原生加载验证 | 技能发现 | 公司强制控制 |
| --- | --- | --- | --- | --- |
| Codex | AGENTS.md | 待记录实际版本、系统及新会话证据 | 任务路由已生成，原生发现待验证 | 待公司执行点配置与实测 |
| Antigravity | AGENTS.md 与 GEMINI.md | 待记录实际版本、系统及新会话证据 | 任务路由已生成，原生发现待验证 | 待公司执行点配置与实测 |

## 离线版本接入

在公司可信的发布来源获取发布目录及独立确认的清单 SHA256。以下命令中的路径与摘要按实际值填写。

```sh
node automation-tools/build-standards.js 1.0.0 /tmp/company-standards-1.0.0
node automation-tools/manage-standards.js install --project /path/to/project --bundle /tmp/company-standards-1.0.0 --sha256 <manifest-sha256> --version 1.0.0 --client codex,antigravity
```

默认预览，添加 --apply 执行安装。原 init-project.sh 携带同样参数和 --bundle 时委派给版本化安装器，旧调用继续兼容。

```sh
node automation-tools/manage-standards.js doctor --project /path/to/project
node automation-tools/manage-standards.js rollback --project /path/to/project
node automation-tools/manage-standards.js recover --project /path/to/project
```

回滚恢复最近一次变更前的入口和锁文件。历史事务保留在 .agents/state，未提供任意历史事务切换。已有软链接入口需先审查原目标，将内容保存为项目普通文件后运行预览。安装器对未知链接返回冲突。

项目应提交入口和 .agents/standards.lock.json，并忽略 .agents/state/ 及 .agents/standards/。CI 安装相同摘要的版本目录后再执行任务。recover 校验本机进程已退出后清理残留锁；其他主机或锁归属不明时返回冲突，由负责人核实。安装和升级时暂停 Agent，完成后新建会话。

## 首批控制记录

| 控制 ID | 范围 | 负责人角色 | 执行点 | 状态 |
| --- | --- | --- | --- | --- |
| SEC-001 | 凭据读取 | 安全与身份负责人 | 公司凭据系统、工具身份及客户端沙箱 | 待环境配置 |
| SEC-002 | 生产写入 | 生产系统负责人 | 服务端账号权限与审批系统 | 待环境配置 |
| SEC-003 | 跨项目访问 | 数据与项目负责人 | 按项目授权的 MCP 服务端及文件权限 | 待环境配置 |

每项控制须记录实际负责人、客户端版本、允许和拒绝用例、时间、证据位置、例外到期和撤销结果。项目入口中的文字指引按行为约定使用。

反馈草稿使用 `bash automation-tools/record-feedback.sh --draft <项目> <分类> <摘要>`，在项目 .agents/state/feedback 下检查并脱敏，得到用户授权后按现有上报入口提交。
