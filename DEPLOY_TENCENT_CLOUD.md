# 腾讯云 CVM 部署指南

这个项目是 Next.js 应用，包含服务端 API，推荐部署到腾讯云 CVM 或轻量应用服务器。部署成功后，别人打开公网地址即可直接聊天。

## 需要准备

- 腾讯云 CVM / 轻量应用服务器一台
- Ubuntu 22.04 / 24.04 推荐
- 服务器安全组开放 `80` 端口
- 一个 `OPENAI_API_KEY`
- 可选：域名和 HTTPS 证书

## 服务器首次初始化

SSH 登录服务器后执行：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

## 拉取代码

```bash
git clone https://github.com/iamnotalle/aixunirenwu.git
cd aixunirenwu
```

如果已经拉过：

```bash
cd aixunirenwu
git pull
```

## 配置环境变量

```bash
cp .env.production.example .env.production
nano .env.production
```

填入：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

## 启动服务

```bash
sudo docker compose --env-file .env.production up -d --build
```

查看状态：

```bash
sudo docker compose ps
sudo docker compose logs -f --tail=100
```

部署成功后访问：

```text
http://服务器公网IP
```

## 更新版本

```bash
cd aixunirenwu
git pull
sudo docker compose --env-file .env.production up -d --build
```

## 常见问题

### 访问不了

检查腾讯云安全组是否开放 `80` 端口；检查服务器防火墙：

```bash
sudo ufw status
```

### 80 端口被占用

查看占用：

```bash
sudo lsof -i :80
```

如果已经有 Nginx，可以把 `docker-compose.yml` 里的端口改成：

```yaml
ports:
  - "3000:3000"
```

然后用 Nginx 反向代理到 `http://127.0.0.1:3000`。
