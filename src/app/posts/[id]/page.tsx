"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

const posts = [
  {
    id: 1,
    title: "欢迎来到 Champion 的博客",
    excerpt: "这是我的第一篇博客文章，记录了我开始写博客的心情和想法...",
    date: "2026-04-01",
    category: "随笔",
    tags: ["随笔", "新博客", "记录"],
    content: `
欢迎来到 Champion 的博客！

这是我第一次写博客，感觉很兴奋。一直以来都想找一个地方记录自己的想法、学习笔记和生活点滴，现在终于有了这个空间。

博客的名字叫 Champion's Blog，Champion 是我的网名。希望这个博客能成为我分享知识和记录成长的一个小角落。

接下来我会分享一些技术文章、生活感悟，还有我喜欢的音乐。如果你正好路过这里，希望能对你有所帮助！

有任何问题或建议，欢迎留言交流～
    `
  },
  {
    id: 2,
    title: "React Hooks 入门指南",
    excerpt: "React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性...",
    date: "2026-04-03",
    category: "技术",
    tags: ["React", "Hooks", "前端"],
    content: `
# React Hooks 入门指南

React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性。

## useState

useState 是最基本的 Hook，用于在函数组件中添加状态：

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

## useEffect

useEffect 用于处理副作用，比如数据获取、订阅等：

\`\`\`jsx
useEffect(() => {
  document.title = \`You clicked \${count} times\`;
}, [count]);
\`\`\`

## useContext

useContext 用于在组件树中传递数据，避免层层传递 props。

希望这篇入门指南对你有帮助！
    `
  },
  {
    id: 3,
    title: "如何保持专注",
    excerpt: "在这个信息爆炸的时代，保持专注变得越来越困难。这篇文章分享了一些我的经验...",
    date: "2026-04-05",
    category: "生活",
    tags: ["效率", "专注", "方法论"],
    content: `
# 如何保持专注

在这个信息爆炸的时代，保持专注变得越来越困难。下面分享一些我的经验：

## 1. 关闭无关通知

手机和电脑的通知会不断打断我们的注意力。把不需要的通知关掉，只保留真正重要的。

## 2. 使用番茄工作法

设定 25 分钟的专注时间，专注于一件事，然后休息 5 分钟。这样循环往复，效率会提高很多。

## 3. 创造良好的工作环境

一个整洁、安静的环境有助于保持专注。清理桌面，戴上耳机，让自己进入工作状态。

## 4. 一次只做一件事

多任务处理其实会降低效率。专注于眼前的任务，完成后再处理下一个。

希望这些建议对你有帮助！
    `
  }
]

export default function PostPage() {
  const params = useParams()
  const id = Number(params.id)
  const post = posts.find(p => p.id === id)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">文章不存在</h1>
          <Link href="/home" className="text-primary hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C3FF5] to-[#6C3FF5]/60 flex items-center justify-center">
                <span className="text-white text-sm font-bold">C</span>
              </div>
              <span className="font-black text-lg">Champion&apos;s Blog</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/home" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link href="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          ← 返回首页
        </Link>

        {/* Article */}
        <article className="bg-card rounded-xl border border-border/60 p-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {post.category}
              </span>
              <span className="text-sm text-muted-foreground">{post.date}</span>
              <div className="flex gap-1.5 ml-auto">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight">{post.title}</h1>
          </header>

          <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-wrap">
            {post.content}
          </div>
        </article>

        {/* Decorative Line */}
        <div className="flex items-center gap-4 mt-12">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
          <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
          <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>
    </div>
  )
}
