import { useUI } from '../i18n/LangContext.jsx'

export default function Footer() {
  const t = useUI()
  return (
    <footer>
      <div className="container">
        <span>{t.footer.tagline}</span>
        <span className="footer-right">
          <a
            className="x-link"
            href="https://x.com/buynao1"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.footer.follow}
            title={t.footer.follow}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>@buynao1</span>
          </a>
          <span>{t.footer.updating}</span>
        </span>
      </div>
    </footer>
  )
}
