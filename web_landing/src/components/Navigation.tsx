import logoMark from '../assets/logo-mark.svg'
import './Navigation.css'

const links = [
  { label: 'Why myPlunt', href: '#why' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
]

function Navigation() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#top" aria-label="myPlunt home">
        <img src={logoMark} alt="" width={42.2041} height={44} />
        <span className="nav__wordmark">myPlunt</span>
      </a>

      <nav className="nav__links" aria-label="Main">
        {links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a className="nav__cta" href="#download">
        Get the app
      </a>
    </header>
  )
}

export default Navigation
