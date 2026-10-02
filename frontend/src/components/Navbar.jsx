function Navbar({ onLaunch }) {
  const handleLaunchClick = () => {
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

  return (
    <header className="topbar">
      <div className="brand-block" aria-label="README.AI home">
        <span className="brand-mark">R</span>
        <span className="brand-text">README.AI</span>
      </div>

      <nav className="main-nav" aria-label="Main navigation">
        <a href="#product">Product</a>
        <a href="#workflow">Workflow</a>
        <a href="#features">Features</a>
      </nav>

      <button
        type="button"
        className="nav-button"
        onClick={() => {
          if (typeof onLaunch === 'function') {
            onLaunch()
            return
          }

          handleLaunchClick()
        }}
      >
        Launch
      </button>
    </header>
  )
}

export default Navbar
