import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function formatListValue(value, emptyLabel = 'Not available') {
  if (!Array.isArray(value) || value.length === 0) {
    return emptyLabel
  }

  return value.join(', ')
}

function ReadmeWorkspace({
  projectSummary,
  readme,
  onGenerateNew,
  onCopyReadme,
  onDownload,
  copyState,
  downloadState,
  successMessage,
}) {
  const repoName = projectSummary?.name || 'Repository'
  const description = projectSummary?.description || 'No description provided.'
  const languages = formatListValue(projectSummary?.languages)
  const technologies = formatListValue(projectSummary?.technologies, 'Not detected')
  const dependencies = Array.isArray(projectSummary?.dependencies)
    ? projectSummary.dependencies.length
    : 0
  const license = projectSummary?.license || 'Not specified'
  const repositoryUrl = projectSummary?.repository || 'Not available'
  const defaultBranch = projectSummary?.defaultBranch || 'Not available'
  const copyLabel = copyState === 'copied' ? 'Copied ✓' : 'Copy Markdown'
  const downloadLabel = downloadState === 'downloaded' ? 'Downloaded ✓' : 'Download README.md'

  return (
    <section className="workspace-shell" aria-live="polite">
      <div className="workspace-header">
        <div>
          <div className="eyebrow">README workspace</div>
          <h2>{repoName}</h2>
        </div>

        <button type="button" className="primary-button workspace-button" onClick={onGenerateNew}>
          Generate New
        </button>
      </div>

      <div className="workspace-grid">
        <aside className="workspace-sidebar">
          <div className="sidebar-card">
            <h3>Repository</h3>
            <dl className="meta-list">
              <div className="meta-row">
                <dt>Name</dt>
                <dd>{repoName}</dd>
              </div>
              <div className="meta-row">
                <dt>Description</dt>
                <dd>{description}</dd>
              </div>
              <div className="meta-row">
                <dt>Languages</dt>
                <dd>{languages}</dd>
              </div>
              <div className="meta-row">
                <dt>Technologies</dt>
                <dd>{technologies}</dd>
              </div>
              <div className="meta-row">
                <dt>Dependencies</dt>
                <dd>{dependencies} packages</dd>
              </div>
              <div className="meta-row">
                <dt>License</dt>
                <dd>{license}</dd>
              </div>
              <div className="meta-row">
                <dt>Default Branch</dt>
                <dd>{defaultBranch}</dd>
              </div>
              <div className="meta-row">
                <dt>Repository URL</dt>
                <dd className="repo-link-wrap">
                  {projectSummary?.repository ? (
                    <a href={projectSummary.repository} target="_blank" rel="noreferrer">
                      {projectSummary.repository}
                    </a>
                  ) : (
                    repositoryUrl
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="workspace-preview">
          <div className="preview-toolbar">
            <div className="preview-status">
              <span className="summary-label">README preview</span>
              {successMessage ? <span className="preview-ready">GENERATED</span> : null}
            </div>
            <div className="readme-actions">
              <button
                type="button"
                className={`secondary-button${copyState === 'copied' ? ' action-success' : ''}`}
                onClick={onCopyReadme}
              >
                {copyLabel}
              </button>
              <button
                type="button"
                className={`secondary-button${downloadState === 'downloaded' ? ' action-success' : ''}`}
                onClick={onDownload}
              >
                {downloadLabel}
              </button>
            </div>
          </div>

          <article className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
          </article>
        </div>
      </div>
    </section>
  )
}

export default ReadmeWorkspace
