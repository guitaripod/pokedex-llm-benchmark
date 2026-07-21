import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0c14] text-white p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <div className="text-xl mb-2">Something went wrong</div>
            <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 bg-white/10 rounded">Reload</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
