# 腾讯云部署说明

当前推荐部署方式是腾讯云 CloudBase，而不是 CVM / 轻量服务器：

- CloudBase Web 应用托管负责前端页面
- CloudBase 云函数负责 `/api/chat`
- DeepSeek API Key 保存在云函数环境变量里

完整步骤见 [DEPLOY_CLOUDBASE.md](./DEPLOY_CLOUDBASE.md)。

## 如果一定要用 CVM

仓库里的 `Dockerfile` 当前只会构建静态前端，并通过 Nginx 提供页面。它默认仍然调用已经部署好的 CloudBase 云函数：

```text
https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat
```

也就是说，CVM 只负责网页入口，不负责模型 API。启动方式：

```bash
git clone https://github.com/iamnotalle/aixunirenwu.git
cd aixunirenwu
sudo docker compose up -d --build
```

访问：

```text
http://服务器公网IP
```

如果你要让 CVM 同时承载后端 API，需要把当前静态 Nginx 镜像改成 Node.js Next 服务，或者另起一个 Node API 服务来代理 DeepSeek。正式运营更建议继续使用 CloudBase 云函数，维护成本更低。

## 常见问题

### 页面能打开，但回复很重复

通常说明前端没有请求到 DeepSeek 云函数，进入了本地规则兜底。检查浏览器 Network 里是否有请求：

```text
https://tt1-d2gfab46g22e748ed.service.tcloudbase.com/api/chat
```

返回结果里应该包含：

```json
{
  "mode": "deepseek"
}
```

### CloudBase 测试域名有提示页

这是腾讯云默认测试域名的访问提示，不是应用错误。正式分享给用户前，建议在 CloudBase 绑定自定义域名。
