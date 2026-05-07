interface PainelHeaderProps {
  brand: string
  brandSubtitle: string
  date: string
  client: string
}

export const PainelHeader = ({ brand, brandSubtitle, date, client }: PainelHeaderProps) => {
  return (
    <header className="header">
      <div className="header-brand">
        <div className="brand-mark">{brand.charAt(0)}</div>
        <div className="brand-text">
          <div className="brand-name">{brand}</div>
          <div className="brand-subtitle">{brandSubtitle}</div>
        </div>
      </div>
      <div className="header-meta">
        <div className="header-date">{date}</div>
        <div className="header-client">{client}</div>
      </div>
    </header>
  )
}
