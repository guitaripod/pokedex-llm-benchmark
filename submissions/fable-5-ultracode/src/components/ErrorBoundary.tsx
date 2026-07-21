import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container page-pad">
          <div className="empty" style={{ paddingTop: 80 }}>
            <div className="eyebrow">Error</div>
            <div className="e-title">Something broke while rendering this page</div>
            <div className="dim">{this.state.error.message}</div>
            <button type="button" className="btn btn-primary" onClick={() => location.reload()} style={{ marginTop: 12 }}>
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
