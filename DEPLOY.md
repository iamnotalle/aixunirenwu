# 部署指南：让别人打开链接就能聊

## 推荐方案

当前项目已部署在腾讯云 CloudBase：

```text
https://aixunirenwu-tt1-d2gfab46g22e748ed.webapps.tcloudbase.com/
```

这条链路已经满足“别人打开链接即可对话”：

- GitHub 只保存代码和文档
- CloudBase 托管网页
- CloudBase 云函数封装 DeepSeek API
- DeepSeek API Key 只保存在云函数环境变量

完整部署步骤见 [DEPLOY_CLOUDBASE.md](./DEPLOY_CLOUDBASE.md)。

## 推到 GitHub

在本项目目录执行：

```bash
git remote set-url origin https://github.com/iamnotalle/aixunirenwu.git
git push -u origin main
```

## 本地开发

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

如果想让本地也直接调用 DeepSeek，复制环境变量模板：

```bash
cp .env.example .env.local
```

填写：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_CHAT_API_URL=/api/chat
```

没有配置 `DEEPSEEK_API_KEY` 时，本地 API 会使用规则兜底回复，方便先检查页面。

## 可选：部署到 Vercel

如果要改用 Vercel：

1. 导入 GitHub 仓库
2. 在 Environment Variables 里添加 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_MODEL`
3. 将 `NEXT_PUBLIC_CHAT_API_URL` 设置为 `/api/chat`
4. 如果需要使用 Vercel 的服务端 API 路由，应移除 `next.config.js` 里的 `output: "export"`

当前仓库默认更偏向 CloudBase 静态前端部署，所以 Vercel 不是主路径。
