# Champion's Blog

一个基于 Next.js 16 的个人博客项目，包含文章系统、评论、音乐播放器、登录保护和一套带角色动效的界面。

## 功能概览

- 博客首页、文章详情、关于页、写作页与编辑页
- 文章分类、标签、置顶、草稿、浏览量统计
- 评论接口与最新评论展示
- 侧边栏播放器 + 右下角全局播放器
- 长歌名滚动、暂停时省略号截断、播放列表与进度条拖拽
- 富文本写作能力，支持格式化、图片 URL、本地图片和粘贴图片
- HEIC/HEIF 自动转 JPEG
- 阅读时间、目录提取、相关文章推荐
- RSS、`sitemap.xml` 与基础 SEO 支持
- 响应式布局与系统深色模式适配

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- highlight.js

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

代码检查：

```bash
npm run lint
```

生产构建：

```bash
npm run build
```

默认访问地址：

[http://localhost:3000](http://localhost:3000)

## 目录结构

```text
src/
├── app/
│   ├── home/          # 首页与文章列表
│   ├── posts/[id]/    # 文章详情
│   ├── write/         # 写作与编辑
│   ├── about/         # 关于页
│   ├── api/           # 评论、文章、RSS 等接口
│   └── login/         # 登录页
├── components/        # 通用 UI 组件
├── context/           # 全局播放器状态
└── lib/               # 文章数据与工具函数
```

## 数据与资源

- 文章数据：`data/posts/posts.json`
- 评论数据：`data/comments.json`
- 音乐列表：`src/context/MusicContext.tsx` 中的 `musicPlaylist`
- 音乐文件目录：`public/music/`

## 部署

推荐直接部署到 Vercel，确保构建命令为：

```bash
npm run build
```

## 最近整理

- 清理了多余状态、无用参数和部分重复逻辑
- 补齐了文章接口类型定义，减少 `any`
- 修正了登录页动画实现与播放器文本展示逻辑
- 当前 `npm run lint` 与 `npm run build` 均可通过
