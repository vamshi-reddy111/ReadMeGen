function getRepositoryName(repoUrl, projectSummary) {
  if (projectSummary?.name) {
    return projectSummary.name
  }

  const parts = repoUrl.replace(/\/$/, '').split('/')
  return parts[parts.length - 1]?.replace(/\.git$/, '') || 'Repository'
}

function RepositoryAnalysis({ repoUrl, projectSummary, loadingStage, progressStages }) {
  const activeStageIndex = progressStages.indexOf(loadingStage)
  const repositoryName = getRepositoryName(repoUrl, projectSummary)
  const description = projectSummary?.description || 'Fetching repository details...'

  return (
    <section className="analysis-screen" aria-live="polite" aria-labelledby="analysis-title">
      <div className="analysis-panel">
        <div className="analysis-heading">
          <span className="eyebrow">Repository Analysis</span>
          <h1 id="analysis-title">Preparing your README.</h1>
          <p>We are gathering verified project details before generating the document.</p>
        </div>

        <div className="analysis-repository">
          <span className="analysis-repository-label">GitHub repository</span>
          <h2>{repositoryName}</h2>
          <p>{description}</p>
        </div>

        <ol className="analysis-progress" aria-label="Repository analysis progress">
          {progressStages.map((stage, index) => {
            const isComplete = activeStageIndex > index
            const isActive = activeStageIndex === index

            return (
              <li
                key={stage}
                className={`analysis-step${isComplete ? ' complete' : ''}${isActive ? ' active' : ''}`}
              >
                <span className="analysis-marker" aria-hidden="true">
                  {isComplete ? '✓' : ''}
                </span>
                <span>{stage}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default RepositoryAnalysis
