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
}

export const MaterialCard = ({ material }: MaterialCardProps) => {
  const slug = slugify(material.nome)
  const pendente = isPendente(material.url)

  if (pendente) {
    return (
      <div
        className="material-card pendente"
        title="Material ainda não disponível"
        data-testid={`card-pending-material-${slug}`}
      >
        <div className="material-icon">{material.tipo}</div>
        <div className="material-info">
          <div className="material-nome">{material.nome}</div>
          <div className="material-tipo">Aguardando link</div>
        </div>
        <span className="material-pendente-badge">Em breve</span>
      </div>
    )
  }

  return (
    <a
      href={material.url}
      target="_blank"
      rel="noopener noreferrer"
      className="material-card"
      data-testid={`link-open-material-${slug}`}
    >
      <div className="material-icon">{material.tipo}</div>
      <div className="material-info">
        <div className="material-nome">{material.nome}</div>
        <div className="material-tipo">Abrir material</div>
      </div>
    </a>
  )
}
