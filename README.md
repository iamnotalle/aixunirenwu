# 甄嬛传·熹贵妃 AI 聊天应用

这是一个“用户开箱即聊”的网页聊天应用。部署后，别人打开你的网页链接，就可以直接和“回宫后的熹贵妃甄嬛”对话。

项目包含：

- 可访问的聊天网页
- 服务端 API 代理，保护模型密钥
- 熹贵妃人设 Prompt
- Coze / Dify 可复用文档
- 测试用例与示例对话

> 非官方粉丝向项目，仅用于 AI 角色设定、Prompt 调优与对话体验验证。

## 一键体验逻辑

部署完成后，用户只需要访问：

```text
https://你的域名
```

然后直接输入内容开始聊天。用户不需要 GitHub，不需要 API Key，也不需要复制 Prompt。

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://localhost:3000
```

如果没有配置 `OPENAI_API_KEY`，应用会进入本地演示模式，方便先看界面和基础语气。

## 配置真实 AI 回复

复制环境变量模板：

```bash
cp .env.example .env.local
```

填写：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

重新启动：

```bash
npm run dev
```

## 部署到 Vercel

1. 把本项目推到 GitHub
2. 打开 Vercel，选择 “New Project”
3. 导入这个 GitHub 仓库
4. 在 Environment Variables 里添加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

5. 点击 Deploy
6. 拿到 Vercel 生成的网址，发给别人即可直接对话

更完整的发布流程见 `DEPLOY.md`。

## 目录结构

```text
zhenhuan-coze-agent/
├─ app/
│  ├─ api/chat/route.js
│  ├─ globals.css
│  ├─ layout.js
│  └─ page.js
├─ lib/
│  ├─ fallback.js
│  └─ persona.js
├─ prompts/
│  └─ persona-prompt.txt
├─ knowledge/
│  └─ coze-zhenhuan-prd.md
├─ config/
│  └─ coze-setup.md
├─ tests/
│  └─ zhenhuan-test-cases.md
├─ examples/
│  └─ sample-dialogues.md
├─ package.json
└─ .env.example
```

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
- 对皇上、皇后、安陵容、下人的话术有明显差异
- 被挑衅时不失态，用温柔语气完成反击
