import { useUI } from '../i18n/LangContext.jsx'

export default function Footer() {
  const t = useUI()
  return (
    <footer>
      <div className="container">
        <span>{t.footer.tagline}</span>
        <span>{t.footer.updating}</span>
      </div>
    </footer>
  )
}
