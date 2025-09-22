# M3U8 播放器

这是一个使用 Vue 3 + Vite 构建的在线 M3U8 播放器。它利用 hls.js 和 DPlayer 提供了强大的视频播放功能，并集成了 Supabase 作为后端服务。

## 🌐 在线体验

[https://m3u8-player.krystal.fit/](https://m3u8-player.krystal.fit/)

## ✨ 功能特性

- 支持 M3U8 格式的流媒体播放。
- 简洁明了的播放器界面。
- 基于 Vue 3 和 Vite，提供极速的开发体验。
- 可轻松部署到 Vercel。

## 🛠️ 技术栈

- **前端框架:** [Vue 3](https://vuejs.org/)
- **构建工具:** [Vite](https://vitejs.dev/)
- **路由:** [Vue Router](https://router.vuejs.org/)
- **UI 库:** [Element Plus](https://element-plus.org/)
- **播放器核心:** [hls.js](https://github.com/video-dev/hls.js/) + [DPlayer](http://dplayer.js.org/)
- **后端服务 (Serverless):** [Supabase](https://supabase.com/)
- **本地数据库:** [Dexie.js](https://dexie.org/)

## 🚀 项目设置

1.  **克隆仓库**
    ```bash
    git clone https://github.com/KrystalQAQ/m3u8-player
    cd m3u8-player
    ```

2.  **安装依赖** (推荐使用 pnpm)
    ```bash
    pnpm install
    ```

3.  **启动开发服务器**
    ```bash
    pnpm dev
    ```

4.  **编译生产版本**
    ```bash
    pnpm build
    ```

## 部署到 Vercel

你可以轻松地将此项目一键部署到 Vercel。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KrystalQAQ/m3u8-player)

### 手动部署步骤

1.  **Fork 本项目** 到你的 GitHub 账户。
2.  登录 [Vercel](https://vercel.com/) 并选择 "Add New... -> Project"。
3.  选择你刚刚 Fork 的仓库并点击 "Import"。
4.  Vercel 会自动识别项目为 Vite 应用，并配置好构建设置。确认以下配置：
    - **Build Command:** `vite build`
    - **Output Directory:** `dist`
    - **Install Command:** `pnpm install`
5.  如果使用了 Supabase，请在 Vercel 项目的 "Settings" -> "Environment Variables" 中配置好 Supabase 相关的环境变量（例如 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`）。
6.  点击 "Deploy"，等待部署完成。

项目中的 [`vercel.json`](vercel.json) 文件已经为单页面应用（SPA）配置好了重写规则，无需额外配置。
