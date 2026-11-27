import { store } from './store/store'
import { useStoreVersion } from './store/useStore'
import { useLoadFromUrl } from './ui/hooks/useLoadFromUrl'
import { useUndoShortcut } from './ui/hooks/useUndoShortcut'
import { FilePicker } from './ui/loading/FilePicker'
import { LoadStatusBar } from './ui/loading/LoadStatusBar'
import { Toolbar } from './ui/toolbar/Toolbar'
import { Grid } from './ui/grid/Grid'
import { IssuePanel } from './ui/panel/IssuePanel'
import { Toast } from './ui/common/Toast'

/** The whole screen: the file picker until a file is chosen, then status bar, problems panel, toolbar and grid. */
export default function App() {
  useStoreVersion()
  useLoadFromUrl()
  useUndoShortcut()

  if (store.loading.status === 'idle') return <div className="app"><FilePicker /></div>

  return (
    <div className="app">
      <LoadStatusBar />
      <div className="workspace">
        <IssuePanel />
        <div className="main">
          <Toolbar />
          <Grid />
        </div>
      </div>
      <Toast />
    </div>
  )
}
