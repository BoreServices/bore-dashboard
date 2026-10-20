import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type State = { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
        <div className="surface-card max-w-lg p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-danger">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-5 text-xl font-semibold text-ink">Something broke on this page</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            The rest of the site still works. Reload this page to try again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Try again
          </button>
        </div>
      </div>
    )
  }
}
