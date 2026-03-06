# BoulderShare — 运行说明（快速上手）

下面说明如何在本机启动后端与前端（适用于你在本机安装好 Node.js / npm、Xcode CLI 等依赖后手动运行）。

## 先决条件
- macOS / Linux / Windows：已安装 Node.js 与 npm
- 如果要在 macOS 构建 sqlite3，需安装 Xcode Command Line Tools：`xcode-select --install`
- 推荐安装 Expo CLI（可选）：`npm install -g expo-cli` 或使用 npx

## 后端（server）
位置：BoulderShare/server

1. 安装依赖
   - cd BoulderShare/server
   - npm install

2. 启动开发服务器
   - npm run dev
   - 默认监听端口：3002
   - uploads 静态目录：`/uploads`（存储上传的视频）
   - 数据库文件：`db.json`（已切换为 JSON 存储以避免本地编译问题）

3. 测试 API（示例）
   - 列表：GET http://localhost:3002/videos
   - 上传示例（curl）：
     curl -X POST "http://localhost:3002/upload" \
       -F "video=@/path/to/video.mp4" \
       -F "city=Beijing" \
       -F "gym=Rock Hour" \
       -F "grade=V3"

注意：sqlite3 本地安装可能需要编译工具链（xcode-select、python、make）。若 npm install 在 sqlite3 模块处失败，请先确保 Xcode CLI / build tools 可用，或安装带预构建二进制的 node 版本。

## 前端（mobile）
位置：BoulderShare/mobile (Expo Managed + TypeScript + Expo Router)

1. 安装依赖
   - cd BoulderShare/mobile
   - npm install --legacy-peer-deps
   - 推荐安装 expo 相关原生插件（有时需要）：
     npx expo install expo-image-picker expo-av

2. 启动
   - 如果遇到 `EMFILE: too many open files` 错误（macOS 常见），请运行：
     `ulimit -n 10000`
   - 然后启动：
     `npx expo start`
   - 使用 Expo Go 在真机上打开，或使用 iOS/Android 模拟器

3. 关于后端地址（重要）
   - 默认在代码中使用：
     - iOS / Expo web: http://localhost:3002
     - Android Emulator (默认 Android Studio emulator): http://10.0.2.2:3002
   - 如果使用真机测试，请将后端地址替换为你的机器局域网 IP（例如：http://192.168.1.100:3002），可在 mobile/app/* 文件中修改 getBackendBase() 实现或设置环境变量。

4. 功能要点
   - 上传页：从相册选择视频，输入 city/gym，并通过弹窗严格选择 grade（V0-V9），不可输入自定义等级。
   - 列表页：展示视频并可按 city/gym/grade 过滤，支持播放（expo-av）。

## 调试与常见问题
- sqlite3 编译失败：请确认已安装 Xcode CLI（macOS）、Python、make、C/C++ 工具链，或换用 Node 版本并尝试重装。
- Expo 无法访问后端：确认后端已启动，检查防火墙或使用局域网 IP。
- 若想跳过本地 sqlite 编译，可临时使用 JSON 文件或 sqlite 的纯 JS 替代库（需额外改造后端）。

## 文件摘要（你已生成）
- BoulderShare/server/src/index.ts — 后端主程序（Express + multer + sqlite3）
- BoulderShare/server/package.json, tsconfig.json — 后端配置
- BoulderShare/mobile/app/* — Expo 前端页面（Feed + Upload）
- BoulderShare/.gitignore

## 下一步建议
- 你可先在本机手动完成：安装 Node、修复构建工具后在 server 运行 `npm install`，再在 mobile 运行 `npm install` 与 `npx expo start`。
- 我可以随后：生成更多前端组件、增加类型定义、将后端改为无需本地编译的 sqlite 替代实现，或编写 Postman 集合与简单部署脚本。