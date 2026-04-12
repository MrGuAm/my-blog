# Champion's Blog

一个基于 Next.js 16 的个人博客项目，包含文章系统、评论账号体系、音乐播放器、服务端登录保护和一套带角色动效的界面。

## 功能概览

- 博客首页、文章详情、关于页、写作页与编辑页
- 文章分类、标签、置顶、草稿、浏览量统计
- 评论接口、最新评论展示与评论账号注册 / 登录
- 登录评论账号后自动带昵称发表评论，并可删除自己的评论
- 管理员登录后仍可删除任意评论
- 侧边栏播放器 + 右下角全局播放器
- 自动扫描 `public/music` 目录生成播放列表
- 读取音频元数据，自动显示标题、歌手、专辑、封面与歌词
- 支持 LRC 时间轴歌词高亮与自动滚动
- 收藏歌曲、最近播放、播放列表与进度条拖拽
- 长歌名滚动、暂停时省略号截断
- 列表循环 / 单曲循环 / 随机播放
- 富文本写作能力，支持格式化、图片 URL、本地图片和粘贴图片
- 写作页与编辑页支持封面图、文章绑定 BGM、即时预览与自动草稿保存
- HEIC/HEIF 自动转 JPEG
- 阅读时间、目录提取、相关文章推荐
- 首页搜索、标签筛选、分页与更稳定的动态文章列表
- RSS、`sitemap.xml` 与基础 SEO 支持
- 响应式布局与系统深色模式适配

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- highlight.js
- Neon / Postgres + SQLite 双存储支持
- music-metadata

## 本地开发

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

### 登录环境变量

服务端登录会校验下面两个环境变量：

```bash
AUTH_PASSWORD=your-password
AUTH_SECRET=replace-this-with-a-long-random-string
```

如果你准备把线上部署接到 Neon，再额外配置：

```bash
DATABASE_URL=postgresql://...
```

推荐在项目根目录创建 `.env.local`：

```bash
AUTH_PASSWORD=your-password
AUTH_SECRET=replace-this-with-a-long-random-string
```

兼容说明：

- 如果没有设置 `AUTH_PASSWORD`，项目会回退读取 `NEXT_PUBLIC_PASSWORD`
- 如果没有设置 `AUTH_SECRET`，开发环境会使用一个本地默认值
- 如果没有设置 `DATABASE_URL`，项目会继续使用本地 SQLite 文件

修改环境变量后，重新启动开发服务器即可生效。

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
│   ├── api/           # 评论、文章、音乐、RSS 等接口
│   └── login/         # 登录页
├── components/        # 通用 UI 组件
├── context/           # 全局播放器状态
└── lib/               # 文章数据与工具函数
```

## 数据与资源

- 本地 SQLite 数据库：`data/blog.db`
- 初始文章数据：`data/posts/posts.json`
- 初始评论数据：`data/comments.json`
- 音乐文件目录：`public/music/`
- 音乐列表接口：`src/app/api/music/route.ts`

### 数据说明

- 项目会优先使用 `data/blog.db` 保存文章、评论和浏览量
- 评论账号也会保存在同一套数据库里
- 首次启动且数据库为空时，会自动从 `data/posts/posts.json` 与 `data/comments.json` 导入初始数据
- 如果设置了 `DATABASE_URL`，项目会改为使用外部 Postgres，并优先把初始数据导入远程数据库
- 开发环境下不会自动增加浏览量，避免本地调试把数据写脏
- 只有生产环境访问文章详情页时才会累加浏览量
- 数据库文件已加入 `.gitignore`，不会默认提交到仓库

### 音乐文件规则

- 把歌曲文件放进 `public/music/` 后，刷新页面即可自动出现在播放列表
- 支持的格式：`.mp3`、`.wav`、`.m4a`、`.aac`、`.flac`、`.ogg`
- 推荐文件名格式：`歌手 - 歌名.mp3`
- 如果文件名里没有 `歌手 - 歌名` 结构，页面会用“未知歌手”兜底
- 如果音频文件里已经写入标题、歌手、专辑、封面或歌词元数据，播放器会优先使用元数据
- 如果歌词带有 `[00:12.345]` 这种时间轴标签，播放器会自动做逐行高亮和滚动

### 写作体验

- 写文章和编辑文章都会自动把当前内容保存到浏览器本地
- 页面顶部会显示最近一次自动保存时间
- 发布成功后会自动清掉对应的本地草稿
- 支持给文章设置封面图 URL
- 支持为文章绑定一首站内 BGM，文章详情页可以一键播放
- 编辑器提供“编辑 / 预览”切换，发文前可以先看最终效果

## 部署

推荐直接部署到 Vercel，确保构建命令为：

```bash
npm run build
```

### Vercel 说明

- 本地开发默认使用 SQLite，线上推荐使用 Neon
- Vercel 的函数运行环境不适合把业务数据持久写入项目目录，所以不要在线上继续依赖 `data/blog.db`
- 当前代码已经支持自动切换：
  - 没有 `DATABASE_URL`：使用本地 SQLite
  - 有 `DATABASE_URL`：使用远程 Postgres（推荐 Neon）
- 在 Vercel 中至少配置这三个环境变量：
  - `AUTH_PASSWORD`
  - `AUTH_SECRET`
  - `DATABASE_URL`
- 推荐接法：
  1. 在 Vercel 项目的 Marketplace 安装 Neon
  2. 创建数据库后，把 Neon 提供的连接串写入 `DATABASE_URL`
  3. 重新部署项目
  4. 首次访问时项目会自动建表，并从本地 JSON 导入初始文章和评论

## 最近整理

- 清理了多余状态、无用参数和部分重复逻辑
- 补齐了文章接口类型定义，减少 `any`
- 修正了登录页动画实现与播放器文本展示逻辑
- 音乐播放器已改为自动扫描本地音乐目录生成歌单
- 开发环境下已关闭文章浏览量写入
- 当前 `npm run lint` 与 `npm run build` 均可通过
