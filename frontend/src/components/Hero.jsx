import TrustPill from './TrustPill'

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="github-icon">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.3 1.8 1.3 1 .1 2.6-.7 3.3-1.4.1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.3-3.2-.2-.3-.6-1.6.1-3.3 0 0 1.1-.4 3.5 1.3a11.8 11.8 0 0 1 6.4 0c2.4-1.7 3.5-1.3 3.5-1.3.7 1.7.3 3 .1 3.3.8.8 1.3 2 1.3 3.2 0 4.6-2.8 5.6-5.6 5.9.4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function Hero({
  trustItems,
  repoUrl,
  onRepoUrlChange,
  onAnalyze,
  isLoading,
  loadingStage,
  error,
  projectSummary,
  successMessage,
  progressStages,
}) {
  const buttonLabel = isLoading ? `${loadingStage}...` : 'Generate README'
  const activeStageIndex = Array.isArray(progressStages)
    ? progressStages.indexOf(loadingStage)
    : -1
  const shouldShowProgress = isLoading || loadingStage === 'README ready'

  return (
    <section className="hero-section" id="product" aria-labelledby="hero-title">
      <div className="hero-copy">
        <div className="eyebrow">AI README Generator</div>

        <h1 id="hero-title">Turn any GitHub repository into a professional README.</h1>

        <p className="hero-description">
          Paste a repository URL and let the workflow analyze the project context,
          extract meaningful details, and prepare a polished Markdown document ready to use.
        </p>

        <form className="repo-form" onSubmit={onAnalyze}>
          <label className="repo-field" htmlFor="repo-url">
            <span className="sr-only">GitHub repository URL</span>
            <GitHubIcon />
            <input
              id="repo-url"
              type="url"
              name="repoUrl"
              placeholder="https://github.com/owner/repository"
              aria-label="GitHub repository URL"
              autoComplete="url"
              value={repoUrl}
              onChange={(event) => onRepoUrlChange(event.target.value)}
              disabled={isLoading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'repo-url-error' : undefined}
            />
          </label>

          <button type="submit" className="primary-button" disabled={isLoading}>
            {buttonLabel}
          </button>
        </form>

        {shouldShowProgress && (
          <div className="stage-status" aria-live="polite">
            <div className="status-row">
              <span className="status-dot" aria-hidden="true" />
              <span>{loadingStage}</span>
            </div>

            <ol className="stage-list" aria-label="Generation progress">
              {(progressStages || []).map((stage, index) => {
                const isComplete = activeStageIndex > index || (!isLoading && stage === 'README ready')
                const isActive = isLoading && activeStageIndex === index

                return (
                  <li
                    key={stage}
                    className={`stage-item${isComplete ? ' complete' : ''}${isActive ? ' active' : ''}`}
                  >
                    <span className="stage-marker" aria-hidden="true" />
                    <span>{stage}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {error && (
          <p id="repo-url-error" className="form-error" role="alert">
            {error}
          </p>
        )}

        {projectSummary && !isLoading && (
          <div className="project-summary" aria-live="polite">
            <span className="summary-label">Project summary ready</span>
          </div>
        )}

        {successMessage && (
          <p className="success-message" role="status">
            {successMessage}
          </p>
        )}

        <div className="trust-row" aria-label="Technology trust indicators">
          {trustItems.map((item) => (
            <TrustPill key={item.label} label={item.label} />
          ))}
        </div>
      </div>

    </section>
  )
}

export default Hero
