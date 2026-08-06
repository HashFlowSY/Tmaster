# v1 单机局域网明文部署,无 TLS

后端跑在开发者本机,手机与电脑连同一 WiFi,APK 通过 `EXPO_PUBLIC_API_URL` 指向局域网 `http://<IP>:<port>`。v1 不部署到公网、无域名、无 TLS。`better-sqlite3` 是原生同步模块,后端必须常驻服务器进程(不能上 serverless/edge)。

## Consequences

- **密码与 token 在局域网内明文传输**(无 TLS),同网可被嗅探。当前阶段(本机演示)已明确接受;上公网前必须加 HTTPS。
- Android 默认禁明文 http,需在 `app.json` 开 `usesCleartextTraffic`(或用 network-security-config 限定该域名)。
- `EXPO_PUBLIC_API_URL` 由 EAS 编译进 APK,**路由器重新分配 IP 后 APK 即失联,需重新构建**。缓解:开发机设静态局域网 IP 或用 `.local` mDNS 主机名。
- 后端「禁止存储明文密码」不受影响:仍用 bcryptjs 加盐哈希。
