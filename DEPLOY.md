# 部署指南：让别人打开链接就能聊

## 先分清楚两件事

GitHub 负责保存代码，不负责安全地保存模型密钥，也不适合直接运行这个带后端 API 的聊天应用。

Vercel 负责把 GitHub 里的代码部署成一个公开网址，并在服务端保存 `OPENAI_API_KEY`。别人访问 Vercel 网址时，可以直接聊天，不需要自己配置任何东西。

## 第一步：推到 GitHub

在 GitHub 新建一个空仓库，例如：

```text
zhenhuan-coze-agent
```

然后在本项目目录执行：

```bash
git remote add origin https://github.com/<你的GitHub用户名>/zhenhuan-coze-agent.git
git push -u origin main
```

如果你已经添加过 remote，则执行：

```bash
git remote set-url origin https://github.com/<你的GitHub用户名>/zhenhuan-coze-agent.git
git push -u origin main
```

## 第二步：导入 Vercel

1. 打开 Vercel
2. 点击 New Project
3. 选择刚才的 GitHub 仓库
4. Framework Preset 选择 Next.js
5. Build Command 保持默认 `next build`
6. Output Directory 保持默认

## 第三步：配置环境变量

在 Vercel 项目的 Environment Variables 里添加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

然后点击 Deploy。

## 第四步：分享链接

部署成功后，Vercel 会生成一个网址，例如：

```text
https://zhenhuan-coze-agent.vercel.app
```

别人打开这个网址，就可以直接和熹贵妃聊天。

## 没有 API Key 会怎样

项目内置了本地演示模式。没有 `OPENAI_API_KEY` 时，页面仍能打开，也能用少量规则回复，方便检查界面。

正式给别人使用时，建议一定配置 `OPENAI_API_KEY`，这样才是真正的 AI 对话。

## 本地检查命令

```bash
npm install
npm run build
npm run dev
```

访问：

```text
http://localhost:3000
```
