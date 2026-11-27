import { issueByKey } from '../../validation/catalog'
import { isLoaded } from '../../store/store'
import { query } from '../../store/query'
import { session } from '../session'
import { Readiness } from './Readiness'
import { IssueList } from './IssueList'
import { IssueDetail } from './IssueDetail'
import { BulkPreview } from './BulkPreview'
import { BulkApplied } from './BulkApplied'

/**
 * Left-hand panel. Import readiness on top, then one of:
 *  - IssueList:   every problem type with its count (no problem selected)
 *  - IssueDetail: the selected problem explained; for problems with suggestions, what we found and the bulk button
 *  - BulkPreview: the reviewed list of bulk changes (amber cells in the grid are the ones that will change)
 *  - BulkApplied: the result of a bulk fix: what changed, undo, what is left
 *
 * Which one shows is decided by query.issueKey (is a problem selected?) and session.panelMode.
 * Both are changed only through ui/actions.ts.
 */
export function IssuePanel() {
  if (!isLoaded()) return <aside className="panel" />
  return (
    <aside className="panel">
      <Readiness />
      <PanelBody />
    </aside>
  )
}

function PanelBody() {
  if (!query.issueKey) return <IssueList />
  const issue = issueByKey(query.issueKey)
  switch (session.panelMode) {
    case 'detail': return <IssueDetail issue={issue} />
    case 'preview': return <BulkPreview issue={issue} />
    case 'applied': return <BulkApplied issue={issue} />
  }
}
