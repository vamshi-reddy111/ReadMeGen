import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import RepositoryAnalysis from './components/RepositoryAnalysis'
import ReadmeWorkspace from './components/ReadmeWorkspace'

const generationStages = [
  'Repository detected',
  'Dependencies analyzed',
  'Technologies detected',
  'Generating README',
]

const githubRepoUrlRegex = /^https:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+?)(\.git)?\/?$/
const apiBaseUrl = import.meta.env.VITE_API_URL || '/api'

function getFriendlyAnalyzeError(status, payload) {
  if (status === 400) {
    return 'Please enter a valid GitHub repository URL in the format https://github.com/owner/repository.'
  }

  if (status === 404) {
    return 'This repository could not be found on GitHub. Please check the URL and try again.'
  }

  if (status === 401) {
    return 'The repository cannot be accessed right now. Please try again later.'
  }

  if (status === 403) {
    return 'GitHub rate limit reached. Please try again in a few minutes.'
  }

  return payload?.message || payload?.error || 'The repository could not be analyzed right now. Please try again.'
}

function getFriendlyGenerateError(status, payload) {
  if (status === 400) {
    return 'Project data is missing or invalid. Please analyze the repository again.'
  }

  if (status === 401) {
    return 'README generation is currently unavailable due to API authentication.'
  }

  if (status === 429) {
    return 'README generation is temporarily rate limited. Please try again shortly.'
  }

  if (status === 500) {
    return payload?.error === 'Empty response from Gemini'
      ? 'README generation returned empty content. Please try again.'
      : 'README generation failed. Please try again.'
  }

  return payload?.message || payload?.error || 'README generation failed. Please try again.'
}

function isNetworkError(error) {
  return Boolean(error?.name === 'TypeError' && /fetch|network/i.test(error?.message || ''))
}

const trustItems = [
  { label: 'GitHub API' },
  { label: 'AI Analysis' },
  { label: 'Markdown' },
]

const workflowSteps = [
  {
    number: '01',
    title: 'Paste GitHub repository',
    description: 'Drop in any public repository URL to start a structured project scan.',
  },
  {
    number: '02',
    title: 'AI analyzes the project',
    description: 'The workflow inspects the codebase, stack, features, and setup details.',
  },
  {
    number: '03',
    title: 'Generate and download README',
    description: 'Receive polished Markdown and export a ready-to-use README for your project.',
  },
]

const featureCards = [
  {
    title: 'GitHub Repository Analysis',
    description: 'Inspect the repository structure, stack, and core project details before drafting documentation.',
    icon: '⌘',
  },
  {
    title: 'AI-Powered README Generation',
    description: 'Turn source context into clear sections, install steps, and project summaries tailored to the repo.',
    icon: '✦',
  },
  {
    title: 'Live Markdown Preview',
    description: 'Review the generated README as it takes shape and refine the output before you ship it.',
    icon: '▣',
  },
  {
    title: 'One-Click README Download',
    description: 'Export the final Markdown instantly and keep the result ready for GitHub, docs, or release notes.',
    icon: '↓',
  },
]

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [projectSummary, setProjectSummary] = useState(null)
  const [readme, setReadme] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(generationStages[0])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copyState, setCopyState] = useState('idle')
  const [downloadState, setDownloadState] = useState('idle')

  const focusRepoInput = () => {
    const repoInput = document.getElementById('repo-url')

    if (!repoInput) {
      return
    }

    repoInput.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    window.setTimeout(() => {
      repoInput.focus({ preventScroll: true })
    }, 250)
  }

  const handleAnalyze = async (event) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    const trimmedRepoUrl = repoUrl.trim()

    if (!trimmedRepoUrl) {
      setError('Please enter a GitHub repository URL.')
      return
    }

    if (!githubRepoUrlRegex.test(trimmedRepoUrl)) {
      setError('Please enter a valid GitHub repository URL in the format https://github.com/owner/repository.')
      return
    }

    setError('')
    setSuccessMessage('')
    setCopyState('idle')
    setDownloadState('idle')
    setProjectSummary(null)
    setReadme('')
    setLoadingStage(generationStages[0])
    setIsLoading(true)

    try {
      const analysisResponse = await fetch(`${apiBaseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: trimmedRepoUrl }),
      })

      const analysisData = await analysisResponse.json().catch(() => ({}))

      if (!analysisResponse.ok) {
        throw new Error(getFriendlyAnalyzeError(analysisResponse.status, analysisData))
      }

      setProjectSummary(analysisData)
      setLoadingStage(generationStages[1])
      await new Promise((resolve) => window.setTimeout(resolve, 180))
      setLoadingStage(generationStages[2])
      await new Promise((resolve) => window.setTimeout(resolve, 180))
      setLoadingStage(generationStages[3])

      const generationResponse = await fetch(`${apiBaseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectSummary: analysisData }),
      })

      const generationData = await generationResponse.json().catch(() => ({}))

      if (!generationResponse.ok) {
        throw new Error(getFriendlyGenerateError(generationResponse.status, generationData))
      }

      const generatedReadme = typeof generationData.readme === 'string'
        ? generationData.readme.trim()
        : ''

      if (!generatedReadme) {
        throw new Error('README generation returned empty content. Please try again.')
      }

      setReadme(generatedReadme)
      setSuccessMessage('README generated')
    } catch (err) {
      if (isNetworkError(err)) {
        setError('Cannot reach the server right now. Please check your connection and try again.')
      } else {
        setError(err?.message || 'Something went wrong while processing the repository. Please try again.')
      }

      setProjectSummary(null)
      setReadme('')
      setSuccessMessage('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateNew = () => {
    setRepoUrl('')
    setProjectSummary(null)
    setReadme('')
    setError('')
    setSuccessMessage('')
    setLoadingStage(generationStages[0])
    setIsLoading(false)
    setCopyState('idle')
    setDownloadState('idle')

    window.setTimeout(() => {
      focusRepoInput()
    }, 120)
  }

  const handleLaunch = () => {
    if (readme) {
      handleGenerateNew()
      return
    }

    focusRepoInput()
  }

  const handleCopyReadme = async () => {
    if (!readme) {
      setError('There is no README to copy yet.')
      return
    }

    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard is not available in this browser.')
      }

      await navigator.clipboard.writeText(readme)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
      setError('')
    } catch (err) {
      setError('Could not copy the README right now. Please try again.')
    }
  }

  const handleDownload = async () => {
    if (!readme) {
      setError('There is no README to download yet.')
      return
    }

    try {
      const response = await fetch(`${apiBaseUrl}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ readme }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.message || 'The README could not be downloaded.')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const downloadLink = document.createElement('a')

      downloadLink.href = downloadUrl
      downloadLink.download = 'README.md'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()

      window.URL.revokeObjectURL(downloadUrl)
      setDownloadState('downloaded')
      window.setTimeout(() => setDownloadState('idle'), 1800)
      setError('')
    } catch (err) {
      if (isNetworkError(err)) {
        setError('Cannot reach the server right now. Please check your connection and try again.')
      } else {
        setError('Something went wrong while downloading the README. Please try again.')
      }
    }
  }

  return (
    <div className="app-shell">
      <div className="background-glow glow-one" aria-hidden="true" />
      <div className="background-glow glow-two" aria-hidden="true" />

      <Navbar onLaunch={handleLaunch} />
      <main className="page-content">
        <section id="product" className="generator-section" aria-label="README generator">
          {readme ? (
            <ReadmeWorkspace
              projectSummary={projectSummary}
              readme={readme}
              onGenerateNew={handleGenerateNew}
              onCopyReadme={handleCopyReadme}
              onDownload={handleDownload}
              copyState={copyState}
              downloadState={downloadState}
              successMessage={successMessage}
            />
          ) : isLoading ? (
            <RepositoryAnalysis
              repoUrl={repoUrl}
              projectSummary={projectSummary}
              loadingStage={loadingStage}
              progressStages={generationStages}
            />
          ) : (
            <Hero
              trustItems={trustItems}
              repoUrl={repoUrl}
              onRepoUrlChange={(value) => {
                setRepoUrl(value)
                if (error) {
                  setError('')
                }
              }}
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              loadingStage={loadingStage}
              error={error}
              projectSummary={projectSummary}
              successMessage={successMessage}
              progressStages={generationStages}
            />
          )}
        </section>

        <section id="workflow" className="info-section workflow-section" aria-labelledby="workflow-title">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2 id="workflow-title">Three steps from repo to polished README.</h2>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step) => (
              <article key={step.number} className="workflow-card">
                <span className="workflow-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="info-section features-section" aria-labelledby="features-title">
          <div className="section-heading">
            <span className="eyebrow">Features</span>
            <h2 id="features-title">Built for fast repository documentation.</h2>
          </div>

          <div className="feature-grid">
            {featureCards.map((feature) => (
              <article key={feature.title} className="feature-item">
                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                <div className="feature-copy">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-section" aria-labelledby="cta-title">
          <div className="cta-panel">
            <span className="eyebrow">Launch</span>
            <h2 id="cta-title">Ready to document your project?</h2>
            <p>
              Paste a GitHub repository and generate a polished README that captures the project, stack,
              and purpose in a developer-ready format.
            </p>
            <button type="button" className="primary-button cta-button" onClick={handleLaunch}>
              Generate README
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
