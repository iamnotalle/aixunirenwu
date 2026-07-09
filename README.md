# 甄嬛传·熹贵妃 AI 聊天应用

这是一个“用户开箱即聊”的网页聊天应用。别人打开网页链接，选择身份后，就可以直接和“回宫后的熹贵妃甄嬛”对话，不需要 GitHub、不需要 API Key，也不需要复制 Prompt。

线上体验：

```text
https://aixunirenwu-tt1-d2gfab46g22e748ed.webapps.tcloudbase.com/
```

CloudBase 测试域名首次访问会出现腾讯云“页面访问提示”，点击“确定访问”即可进入。绑定自定义域名后可以去掉这个中间页。

> 非官方粉丝向项目，仅用于 AI 角色设定、Prompt 调优与对话体验验证。

## 当前架构

- 前端：Next.js 静态导出，部署在腾讯云 CloudBase Web 应用托管
- 后端：CloudBase 云函数 `chat`
- 模型：DeepSeek Chat Completions
- 记忆：浏览器 `localStorage` 保存用户身份、称呼、上次话题、关系状态和最近对话
- 兜底：云函数不可用时，前端会使用本地规则回复，保证页面不空

前端只调用公开的云函数地址：

```text
https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat
```

DeepSeek API Key 只保存在 CloudBase 云函数环境变量里，不会出现在前端代码或 GitHub 仓库里。

## 产品机制

首屏不是空输入框，而是先选择来者身份：

- 皇上
- 新入宫嫔妃
- 宫女
- 皇后阵营来人
- 现代穿越者

每个身份都有独立的开场白、快捷话题、初始关系和后端话术规则。

对话过程中会维护关系状态：

- 试探
- 信任
- 敲打
- 亲近
- 疏离

关系状态会随着用户话术和对话轮次变化，并传入服务端 Prompt，影响熹贵妃的语气、距离感和回应策略。

## 已支持的记忆

当前版本支持轻量长期记忆，保存在用户自己的浏览器里：

- 用户身份
- 用户名字 / 称呼
- 上次聊过什么
- 甄嬛对用户的态度
- 最近几轮对话

刷新页面后，首屏会出现“继续上次”。这版记忆不需要登录，但也不跨设备；如果要做正式产品，下一步应接入用户系统和服务端记忆库。

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

如需本地直接调用 DeepSeek：

```bash
cp .env.example .env.local
```

填写：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_CHAT_API_URL=/api/chat
```

没有配置 `DEEPSEEK_API_KEY` 时，本地 `/api/chat` 会返回规则兜底回复，方便先检查界面和基础语气。

## 腾讯云部署

完整步骤见 [DEPLOY_CLOUDBASE.md](./DEPLOY_CLOUDBASE.md)。

当前线上资源：

```text
CloudBase EnvId: tt1-d2gfab46g22e748ed
Web Service: aixunirenwu
Function Path: /api/chat
```

部署后的用户路径是：

1. 打开网页链接
2. 点击腾讯云测试域名提示页里的“确定访问”
3. 选择身份
4. 直接开始对话

## 目录结构

```text
zhenhuan-coze-agent/
├─ app/
│  ├─ api/chat/route.js
│  ├─ globals.css
│  ├─ layout.js
│  └─ page.js
├─ functions/
│  └─ chat/
│     ├─ index.js
│     └─ package.json
├─ lib/
│  ├─ fallback.js
│  ├─ persona.js
│  └─ scenes.js
├─ prompts/
│  └─ persona-prompt.txt
├─ knowledge/
│  └─ coze-zhenhuan-prd.md
├─ tests/
│  └─ zhenhuan-test-cases.md
├─ Dockerfile
├─ docker-compose.yml
├─ cloudbaserc.json
└─ package.json
```

## 产品缺陷与下一步

- 测试域名有腾讯云中间提示页，正式分享建议绑定自定义域名。
- 记忆只在浏览器本地，不支持换设备、换浏览器后延续。
- 目前没有登录体系，无法区分同一用户的多角色档案。
- 云函数接口是公开地址，正式运营前需要加限流、风控和成本保护。
- 还没有接入 Qdrant 等向量记忆库，因此只能记住摘要和最近对话，不能做长期语义检索。
- 还没有管理后台，无法查看对话质量、失败率、重复率和模型成本。

## Coze 版本

如果你更想用 Coze 官方 Bot 链接，而不是自己部署网页：

1. 将 `prompts/persona-prompt.txt` 复制到 Coze Bot 的人设与回复逻辑
2. 上传 `knowledge/coze-zhenhuan-prd.md` 到知识库
3. 测试通过后，在 Coze 发布 Bot
4. 复制 Coze 分享链接给别人，对方也可以直接聊天

## 角色目标

- 表面温婉、礼数周全
- 情绪不直接外露
- 回答短，通常 2-3 句话
- 根据用户身份和关系状态调整语气
- 被挑衅时不失态，用温柔语气完成反击
