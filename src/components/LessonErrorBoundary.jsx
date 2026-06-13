import { Component } from 'react'

// 课程正文错误边界。
//
// 现象：从其它课切换到内容最密的课（如 L30）时，控制台抛
// "Failed to execute 'removeChild' on 'Node': The node to be removed is not a
// child of this node"，页面白屏。
//
// 根因：浏览器的网页翻译（Chrome/Edge 内置翻译、沉浸式翻译等扩展）会把中文
// 文本节点替换成自己的包裹节点。React 在路由切换、协调卸载旧课树时调用
// removeChild，却发现节点已被换走，于是在提交阶段抛错。这发生在 React 控制
// 之外，keyed Suspense 之类的纯 React 改动无法根治。
//
// 这里把崩溃限制在课程正文子树内：捕获后渲染可读的兜底界面（含整页重载入口，
// 重载后 L30 直链打开本就正常），并在切换到下一课（resetKey 变化）时自动复位。
export default class LessonErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[LessonErrorBoundary] 课程正文渲染中断，多由浏览器翻译改写 DOM 触发：', error?.message)
  }

  componentDidUpdate(prevProps) {
    // 切到另一课时清掉错误态，让新课正常挂载
    if (this.state.failed && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
