# 腾讯云 CloudBase 部署指南

本项目当前采用“静态前端 + CloudBase 云函数”的部署方式。用户访问网页即可对话，DeepSeek API Key 只放在云函数环境变量里，前端和 GitHub 都不会暴露密钥。

当前线上环境：

```text
EnvId: tt1-d2gfab46g22e748ed
Web Service: aixunirenwu
Web URL: https://aixunirenwu-tt1-d2gfab46g22e748ed.webapps.tcloudbase.com/
Function URL: https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat
```

## 1. 前端部署

```bash
npm install
npm run build
```

Windows PowerShell:

```powershell
$env:TENCENTCLOUD_SECRETID="你的 SecretId"
$env:TENCENTCLOUD_SECRETKEY="你的 SecretKey"
npx.cmd --package @cloudbase/cli@3.5.10 tcb app deploy aixunirenwu --env-id tt1-d2gfab46g22e748ed --framework next --install-command "npm ci" --build-command "npm run build" --output-dir "out" --deploy-path "/" --force
```

`app/page.js` 默认会请求线上云函数：

```text
https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat
```

如果你部署到自己的 CloudBase 环境，需要把 `NEXT_PUBLIC_CHAT_API_URL` 换成自己的函数地址。

## 2. 云函数部署

云函数代码在：

```text
functions/chat/index.js
```

运行时环境变量：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
```

不要把真实 API Key 写进 `cloudbaserc.json` 或任何会提交到 GitHub 的文件。推荐临时创建一个本地密钥配置文件，例如 `.cloudbase.secret.json`，部署后删除或保留在本机；该文件已被 `.gitignore` 忽略。

示例结构：

```json
{
  "envId": "tt1-d2gfab46g22e748ed",
  "functionRoot": "functions",
  "functions": [
    {
      "name": "chat",
      "timeout": 20,
      "runtime": "Nodejs20.19",
      "handler": "index.main",
      "memorySize": 256,
      "envVariables": {
        "DEEPSEEK_API_KEY": "只放在本地临时文件",
        "DEEPSEEK_MODEL": "deepseek-chat"
      }
    }
  ]
}
```

部署命令：

```powershell
npx.cmd --package @cloudbase/cli@3.5.10 tcb --config-file .cloudbase.secret.json fn deploy chat --env-id tt1-d2gfab46g22e748ed --dir functions/chat --path /api/chat --runtime Nodejs20.19 --force
```

注意：这个函数是普通事件函数，通过 `--path /api/chat` 暴露 HTTP 路径，不需要 `scf_bootstrap`。

## 3. 验证

健康检查：

```powershell
Invoke-WebRequest -Uri "https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat" -Method GET
```

对话测试：

```powershell
$body = @{
  identityId = "queen_camp"
  relationship = "敲打"
  memory = @{
    userTitle = "景仁宫来人"
    lastTopic = "皇后娘娘问话"
    attitude = "暗中防备，温声回击"
  }
  messages = @(
    @{ role = "user"; content = "皇后娘娘说，娘娘如今太锋芒毕露，怕是忘了谁才是六宫之主。" }
  )
} | ConvertTo-Json -Depth 5

Invoke-WebRequest -Uri "https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat" -Method POST -ContentType "application/json" -Body $body
```

返回里应包含：

```json
{
  "reply": "……",
  "mode": "deepseek"
}
```

## 4. 测试域名提示

CloudBase 默认测试域名首次访问会显示“页面访问提示”。点击“确定访问”即可进入应用。若要去掉，需要在 CloudBase 绑定自定义域名。

## 5. 运营注意事项

- 正式分享前建议绑定自定义域名。
- 云函数接口是公开地址，正式运营前要加限流、调用量告警和成本保护。
- 用户记忆目前存在浏览器本地，不跨设备；服务端长期记忆需要另接数据库或向量库。
- Qdrant 需要同时提供 Cluster URL 和 API Key 才能接入语义记忆。
