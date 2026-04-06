---
title: "React Hooks 入门指南"
excerpt: "React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性..."
date: "2026-04-03"
category: "技术"
tags: ["React", "Hooks", "前端"]
---

# React Hooks 入门指南

React Hooks 是 React 16.8 引入的新特性，它让我们可以在函数组件中使用状态和其他 React 特性。

## useState

useState 是最基本的 Hook，用于在函数组件中添加状态：

```jsx
const [count, setCount] = useState(0);
```

## useEffect

useEffect 用于处理副作用，比如数据获取、订阅等：

```jsx
useEffect(() => {
  document.title = `You clicked ${count} times`;
}, [count]);
```

## useContext

useContext 用于在组件树中传递数据，避免层层传递 props。

希望这篇入门指南对你有帮助！
