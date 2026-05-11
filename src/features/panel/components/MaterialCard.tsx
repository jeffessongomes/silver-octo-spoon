import { useAdminMode } from '../context/AdminModeContext'
import type { Material } from '../types'

const slugify = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const isPendente = (url: string): boolean => url === '' || url === '#'

interface MaterialCardProps {
  material: Material
  onDelete?: (id: string) => void
  materialId?: string
}

const DeleteButton = ({ materialId, onDelete }: { materialId: string; onDelete: (id: string) => void }) => (
  <button
    type="button"
    data-testid={`btn-delete-material-${materialId}`}
    onClick={() => onDelete(materialId)}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--ink-mute)',
      fontSize: 14,
      padding: '0 4px',
      flexShrink: 0,
      lineHeight: 1,
    }}
  >
    ×
  </button>
)

export const MaterialCard = ({ material, onDelete, materialId }: MaterialCardProps) => {
  const { isAdmin } = useAdminMode()
  const slug = slugify(material.nome)
  const pendente = isPendente(material.url)
  const showDelete = isAdmin && !!onDelete && !!materialId

  if (pendente) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div
          className="material-card pendente"
          title="Material ainda não disponível"
          data-testid={`card-pending-material-${slug}`}
          style={{ flex: 1 }}
        >
          <div className="material-icon">{material.tipo}</div>
          <div className="material-info">
            <div className="material-nome">{material.nome}</div>
            <div className="material-tipo">Aguardando link</div>
          </div>
          <span className="material-pendente-badge">Em breve</span>
        </div>
        {showDelete && <DeleteButton materialId={materialId!} onDelete={onDelete!} />}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <a
        href={material.url}
        target="_blank"
        rel="noopener noreferrer"
        className="material-card"
        data-testid={`link-open-material-${slug}`}
        style={{ flex: 1 }}
      >
        <div className="material-icon">{material.tipo}</div>
        <div className="material-info">
          <div className="material-nome">{material.nome}</div>
          <div className="material-tipo">Abrir material</div>
        </div>
      </a>
      {showDelete && <DeleteButton materialId={materialId!} onDelete={onDelete!} />}
    </div>
  )
}
