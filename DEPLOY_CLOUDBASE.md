# 腾讯云 CloudBase 部署指南

本项目已适配腾讯云 CloudBase 静态托管，适合没有 CVM / 轻量服务器、但已经购买云开发环境的情况。

当前环境：

```text
EnvId: tt1-d2gfab46g22e748ed
Service: aixunirenwu
URL: https://aixunirenwu-tt1-d2gfab46g22e748ed.webapps.tcloudbase.com/
```

## 部署命令

```bash
npm install
npm run build

npx --package @cloudbase/cli@3.5.10 tcb app deploy aixunirenwu \
  --env-id tt1-d2gfab46g22e748ed \
  --framework next \
  --install-command "npm ci" \
  --build-command "npm run build" \
  --output-dir "out" \
  --deploy-path "/" \
  --force
```

Windows PowerShell:

```powershell
$env:TENCENTCLOUD_SECRETID="你的 SecretId"
$env:TENCENTCLOUD_SECRETKEY="你的 SecretKey"
npx.cmd --package @cloudbase/cli@3.5.10 tcb app deploy aixunirenwu --env-id tt1-d2gfab46g22e748ed --framework next --install-command "npm ci" --build-command "npm run build" --output-dir "out" --deploy-path "/" --force
```

## 当前限制

CloudBase 当前部署的是静态托管版本。页面可用，支持：

- 身份选择
- 关系状态
- 本地记忆
- 内置人设规则回复

尚未接入真正的大模型服务端调用。若要真实 AI 回复，需要增加 CloudBase 云函数，将前端请求转发到 OpenAI API，并在云函数环境变量中保存 API Key。

## 测试域名提示

CloudBase 默认测试域名首次访问会显示“页面访问提示”。点击“确定访问”即可进入应用。若要去掉，需要在 CloudBase 绑定自定义域名。
