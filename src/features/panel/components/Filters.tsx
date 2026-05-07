import type { FiltroTarefas } from '../types'

interface FiltersProps {
  ativo: FiltroTarefas
  onChange: (filtro: FiltroTarefas) => void
}

interface FiltroOption {
  value: FiltroTarefas
  label: string
}

const FILTROS: FiltroOption[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'concluidas', label: 'Concluídas' },
]

export const Filters = ({ ativo, onChange }: FiltersProps) => {
  return (
    <div className="filtros">
      <span className="filtro-label">Mostrar</span>
      {FILTROS.map((filtro) => (
        <button
          key={filtro.value}
          type="button"
          className={`filtro-btn ${ativo === filtro.value ? 'active' : ''}`}
          data-testid={`btn-filter-${filtro.value}`}
          onClick={() => onChange(filtro.value)}
        >
          {filtro.label}
        </button>
      ))}
    </div>
  )
}
