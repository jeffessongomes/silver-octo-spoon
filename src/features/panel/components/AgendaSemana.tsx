interface AgendaSemanaProps {
  itens: readonly string[]
}

const formatNumero = (n: number): string => n.toString().padStart(2, '0')

export const AgendaSemana = ({ itens }: AgendaSemanaProps) => {
  return (
    <div className="sidebar-section agenda" data-testid="sidebar-agenda">
      <div className="sidebar-subtitle">Esta semana</div>
      <div className="sidebar-title" style={{ marginBottom: '16px' }}>
        Foco imediato
      </div>
      {itens.map((item, idx) => (
        <div className="agenda-item" key={item}>
          <span className="agenda-numero">{formatNumero(idx + 1)}</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}
