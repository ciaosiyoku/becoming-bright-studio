import { Component, type ReactNode, Suspense } from 'react'

// A part of the app that is loaded when it opens (a game, the radio, the grown-ups' screen …: React.lazy). While it
// loads: nothing (a moment at most; once loaded it is saved on the device, shared/offline.ts). If it can't be
// loaded (offline before it was ever saved): a message with a Back button, instead of a blank app.

interface Props {
  children: ReactNode
  /** Shown when the part can't be loaded. */
  failed: ReactNode
}

export function Loading({ children, failed }: Props) {
  return (
    <LoadFailed failed={failed}>
      <Suspense fallback={null}>{children}</Suspense>
    </LoadFailed>
  )
}

class LoadFailed extends Component<Props, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() {
    return { error: true }
  }
  render() {
    return this.state.error ? this.props.failed : this.props.children
  }
}
