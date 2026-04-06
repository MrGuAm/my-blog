# Champion's Blog

一个简约有趣的博客网站，带有可爱的卡通角色和音乐播放器 🎵

## 功能特点

- 🎨 **卡通角色**：登录页和文章卡片都有动态卡通角色
- 🎵 **音乐播放器**：侧边栏播放器，支持播放列表、进度条拖拽
- 🌙 **主题切换**：支持浅色/深色模式自动切换
- 📱 **响应式设计**：适配各种屏幕尺寸

## 开始使用

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 打开页面

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
src/
├── app/
│   ├── home/        # 主页（博客文章列表 + 音乐播放器）
│   ├── page.tsx     # 登录页
│   └── layout.tsx   # 全局布局
├── components/       # UI 组件
└── proxy.ts         # 路由保护（验证登录）
```

## 技术栈

- **Next.js 16** - React 框架
- **Tailwind CSS** - 样式设计
- **TypeScript** - 类型安全

## 音乐文件

将音乐文件放入 `public/music/` 目录，文件名将自动匹配播放列表。

## 部署

推荐部署到 Vercel：

```bash
npm run build
```

然后将项目导入 Vercel 即可。

---

*Made with ❤️ by Champion*
