export interface Post {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
  content: string
}

export const posts: Post[] = [
  {
    id: "welcome",
    title: "欢迎来到 Champion 的博客",
    excerpt: "这是我的第一篇博客文章，记录了我开始写博客的心情和想法...",
    date: "2026-04-01",
    category: "随笔",
    tags: ["随笔", "新博客", "记录"],
    content: `欢迎来到 Champion 的博客！

这是我第一次写博客，感觉很兴奋。一直以来都想找一个地方记录自己的想法、学习笔记和生活点滴，现在终于有了这个空间。

博客的名字叫 Champion's Blog，Champion 是我的网名。希望这个博客能成为我分享知识和记录成长的一个小角落。

接下来我会分享一些技术文章、生活感悟，还有我喜欢的音乐。如果你正好路过这里，希望能对你有所帮助！

有任何问题或建议，欢迎留言交流～`
  },
  {
    id: "react-hooks",
    title: "React Hooks 入门指南",
    excerpt: "React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性...",
    date: "2026-04-03",
    category: "技术",
    tags: ["React", "Hooks", "前端"],
    content: `<h2>useState</h2>
<p>useState 是最基本的 Hook，用于在函数组件中添加状态：</p>
<pre><code>const [count, setCount] = useState(0);</code></pre>

<h2>useEffect</h2>
<p>useEffect 用于处理副作用，比如数据获取、订阅等：</p>
<pre><code>useEffect(() => {
  document.title = \`You clicked \${count} times\`;
}, [count]);</code></pre>

<h2>useContext</h2>
<p>useContext 用于在组件树中传递数据，避免层层传递 props。</p>

<p>希望这篇入门指南对你有帮助！</p>`
  },
  {
    id: "focus",
    title: "如何保持专注",
    excerpt: "在这个信息爆炸的时代，保持专注变得越来越困难。这篇文章分享了一些我的经验...",
    date: "2026-04-05",
    category: "生活",
    tags: ["效率", "专注", "方法论"],
    content: `在这个信息爆炸的时代，保持专注变得越来越困难。下面分享一些我的经验：

<strong>1. 关闭无关通知</strong>
手机和电脑的通知会不断打断我们的注意力。把不需要的通知关掉，只保留真正重要的。

<strong>2. 使用番茄工作法</strong>
设定 25 分钟的专注时间，专注于一件事，然后休息 5 分钟。这样循环往复，效率会提高很多。

<strong>3. 创造良好的工作环境</strong>
一个整洁、安静的环境有助于保持专注。清理桌面，戴上耳机，让自己进入工作状态。

<strong>4. 一次只做一件事</strong>
多任务处理其实会降低效率。专注于眼前的任务，完成后再处理下一个。

希望这些建议对你有帮助！`
  }
]

export function getAllPosts(): Post[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPost(id: string): Post | undefined {
  return posts.find(p => p.id === id)
}

export function getAllTags(): string[] {
  return Array.from(new Set(posts.flatMap(p => p.tags))).sort()
}

export function getPostContent(id: string): string {
  const post = getPost(id)
  return post?.content || ''
}
