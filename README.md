# Champion's Blog

一个简约有趣的博客网站，带有可爱的卡通角色和音乐播放器 🎵

## 功能特点

- 🎨 **卡通角色**：登录页和文章卡片都有动态卡通角色
- 🎵 **音乐播放器**：
  - 侧边栏播放器 + 右下角悬浮播放器（hover 展开）
  - 播放列表、进度条拖拽/点击跳转
  - 歌曲名过长时自动滚动（播放时触发）
  - 列表选择当前曲目自动关闭
- 🌙 **主题切换**：支持浅色/深色模式自动切换
- 📝 **评论系统**：支持 Markdown 渲染
- ✍️ **富文本编辑器**：支持加粗/斜体/标题/代码/链接/引用/列表
- 🖼️ **图片上传**：支持本地上传、粘贴、URL，支持 HEIC 转 JPEG
- 📄 **文章功能**：分类/标签、置顶、草稿文章
- ⬆️ **返回顶部**：主页和文章详情页均有
- 📖 **阅读体验**：阅读时间显示、文章目录（TOC）、相关文章推荐
- 🔍 **SEO**：RSS 订阅（/api/feed）、sitemap.xml、meta tags
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
│   ├── home/           # 主页（博客文章列表 + 侧边栏播放器）
│   ├── posts/[id]/    # 文章详情页
│   ├── write/         # 写文章（富文本编辑器）
│   ├── about/         # 关于页面
│   ├── page.tsx       # 登录页
│   └── layout.tsx     # 全局布局
├── components/         # UI 组件
├── context/
│   └── MusicContext.tsx  # 全局音乐播放器状态
└── proxy.ts           # 路由保护（验证登录）
```

## 技术栈

- **Next.js 16** - React 框架
- **Tailwind CSS** - 样式设计
- **TypeScript** - 类型安全
- **shadcn/ui** - UI 组件库

## 音乐文件

将音乐文件放入 `public/music/` 目录，文件名将自动匹配播放列表。

修改音乐列表：`src/context/MusicContext.tsx` 中的 `musicPlaylist` 数组。

## 部署

推荐部署到 Vercel：

```bash
npm run build
```

然后将项目导入 Vercel 即可。

---

*Made with ❤️ by Champion*
