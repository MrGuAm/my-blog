"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

// Character component with eyes that follow mouse
function Character({ bgColor, width, height, borderRadius, eyeSize, mouth, mouseX, mouseY }: { bgColor: string; width: number; height: number; borderRadius: string; eyeSize: number; mouth?: boolean; mouseX: number; mouseY: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = mouseX - centerX
    const deltaY = mouseY - centerY
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), eyeSize * 0.4)
    const angle = Math.atan2(deltaY, deltaX)
    setPupilOffset({
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    })
  }, [mouseX, mouseY, eyeSize])

  return (
    <div
      ref={ref}
      className="relative"
      style={{ width, height }}
    >
      {/* Body */}
      <div
        className="absolute w-full rounded-t-lg overflow-hidden"
        style={{
          backgroundColor: bgColor,
          height: height * 0.85,
          bottom: 0,
          borderRadius: borderRadius,
        }}
      />
      {/* Eyes container */}
      <div
        className="absolute flex gap-2"
        style={{
          left: '50%',
          top: '15%',
          transform: 'translateX(-50%)'
        }}
      >
        <div className="rounded-full bg-white flex items-center justify-center" style={{ width: eyeSize, height: eyeSize }}>
          <div 
            className="rounded-full bg-[#2D2D2D]"
            style={{ 
              width: eyeSize * 0.5, 
              height: eyeSize * 0.5, 
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: 'transform 0.1s ease-out'
            }} 
          />
        </div>
        <div className="rounded-full bg-white flex items-center justify-center" style={{ width: eyeSize, height: eyeSize }}>
          <div 
            className="rounded-full bg-[#2D2D2D]"
            style={{ 
              width: eyeSize * 0.5, 
              height: eyeSize * 0.5, 
              transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        </div>
      </div>
      {/* Mouth */}
      {mouth && (
        <div
          className="absolute h-0.5 bg-[#2D2D2D] rounded-full"
          style={{
            width: width * 0.4,
            left: '50%',
            top: '45%',
            transform: 'translateX(-50%)'
          }}
        />
      )}
    </div>
  )
}

export default function AboutClient() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
              <Link href="/home" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link href="/write" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                写文章
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black tracking-tight mb-4">
            关于我
          </h1>
          <p className="text-muted-foreground text-lg">
            欢迎来到 Champion 的博客 👋
          </p>
        </div>

        {/* Character Decoration */}
        <div className="flex justify-center items-end gap-8 mb-16">
          <Character bgColor="#6C3FF5" width={64} height={96} borderRadius="10px 10px 0 0" eyeSize={12} mouseX={mousePos.x} mouseY={mousePos.y} />
          <Character bgColor="#2D2D2D" width={48} height={72} borderRadius="8px 8px 0 0" eyeSize={10} mouseX={mousePos.x} mouseY={mousePos.y} />
          <Character bgColor="#FF9B6B" width={72} height={40} borderRadius="36px 36px 0 0" eyeSize={10} mouseX={mousePos.x} mouseY={mousePos.y} />
          <Character bgColor="#E8D754" width={56} height={64} borderRadius="28px 28px 0 0" eyeSize={10} mouth mouseX={mousePos.x} mouseY={mousePos.y} />
        </div>

        {/* About Content */}
        <div className="space-y-8">
          <section className="p-6 rounded-xl border border-border/60 bg-card">
            <h2 className="text-xl font-bold mb-3">🏠 这是什么博客?</h2>
            <p className="text-muted-foreground">
              这是一个分享生活和技术的个人博客。记录我平时的想法、学习笔记和生活点滴。
              希望这些内容能对你有所帮助!
            </p>
          </section>

          <section className="p-6 rounded-xl border border-border/60 bg-card">
            <h2 className="text-xl font-bold mb-3">👨‍💻 我是谁?</h2>
            <p className="text-muted-foreground">
              我叫 Champion,一个热爱技术、喜欢音乐的开发者。平时喜欢折腾各种有趣的项目,
              也喜欢听歌、写代码、分享经验。
            </p>
          </section>

          <section className="p-6 rounded-xl border border-border/60 bg-card">
            <h2 className="text-xl font-bold mb-3">🎯 我的目标</h2>
            <p className="text-muted-foreground">
              持续学习,持续输出。用博客记录成长,让知识留下痕迹。
            </p>
          </section>

          <section className="p-6 rounded-xl border border-border/60 bg-card">
            <h2 className="text-xl font-bold mb-3">📬 联系我</h2>
            <p className="text-muted-foreground">
              如果你有任何问题或建议,欢迎通过博客留言或发送邮件交流!
            </p>
          </section>
        </div>

        {/* Decorative Line */}
        <div className="flex items-center gap-4 mt-16">
          <div className="w-12 h-1 rounded-full bg-gradient-to-r from-[#6C3FF5] to-[#FF9B6B]" />
          <div className="w-3 h-3 rounded-full bg-[#E8D754]" />
          <div className="w-2 h-2 rounded-full bg-[#2D2D2D]" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2026 Champion&apos;s Blog
        </div>
      </footer>
    </div>
  )
}
