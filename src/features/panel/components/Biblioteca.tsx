import { useState } from 'react'
import { useAdminMode } from '../context/AdminModeContext'
import { useBiblioteca } from '../hooks/useBiblioteca'
import type { MaterialTipo } from '../types'

const TIPOS: MaterialTipo[] = ['PDF', 'PNG', 'DOC', 'XLS', 'LINK', 'VIDEO']

const slugify = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const isPendente = (url: string): boolean => url === '' || url === '#'

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export const Biblioteca = () => {
  const { isAdmin } = useAdminMode()
  const { materiais, loading, error, submitting, submitError, fetchBiblioteca, criarMaterial, deletarMaterial } =
    useBiblioteca()

  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<MaterialTipo | ''>('')
  const [url, setUrl] = useState('')

  const isFormValid = nome.trim().length >= 2 && tipo !== '' && isValidUrl(url)

  const handleSubmit = async () => {
    if (!isFormValid) return

    await criarMaterial({ nome: nome.trim(), tipo, url })
    setNome('')
    setTipo('')
    setUrl('')
  }

  return (
    <div className="sidebar-section">
      <div className="sidebar-title">Biblioteca</div>
      <div className="sidebar-subtitle">Materiais de consulta</div>

      {isAdmin && (
        <form className="biblioteca-form" onSubmit={(e) => { e.preventDefault(); void handleSubmit() }}>
          <input
            type="text"
            placeholder="Nome do material"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            data-testid="input-nome-material"
          />
          <div className="biblioteca-form-row">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as MaterialTipo | '')}
              data-testid="sel-tipo-material"
            >
              <option value="">-- tipo --</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-url-material"
            />
          </div>
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            data-testid="btn-submit-material"
          >
            {submitting ? 'Salvando...' : 'Adicionar'}
          </button>
          {submitError && (
            <p className="biblioteca-form-error" role="alert" data-testid="error-form-biblioteca">
              {submitError}
            </p>
          )}
        </form>
      )}

      <hr className="biblioteca-divider" />

      {loading && (
        <div data-testid="skeleton-biblioteca">
          {[0, 1, 2].map((i) => (
            <div key={i} className="biblioteca-skeleton" style={{ marginBottom: 4 }} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="biblioteca-error">
          <p className="biblioteca-error-msg">{error}</p>
          <button
            className="biblioteca-retry-btn"
            onClick={fetchBiblioteca}
            data-testid="btn-retry-biblioteca"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && materiais.length === 0 && (
        <p className="biblioteca-empty" data-testid="empty-biblioteca">
          Nenhum material adicionado ainda.
        </p>
      )}

      {!loading && !error && materiais.length > 0 && (
        <ul className="biblioteca-list" data-testid="list-biblioteca">
          {materiais.map((item) => {
            const slug = slugify(item.nome)
            const pendente = isPendente(item.url)

            return (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {pendente ? (
                  <div
                    className="biblioteca-item"
                    style={{ cursor: 'not-allowed', opacity: 0.6, flex: 1 }}
                    title="Aguardando link"
                    data-testid={`item-pending-biblioteca-${slug}`}
                  >
                    <span className="biblioteca-icon">{item.tipo}</span>
                    <span className="biblioteca-nome">{item.nome}</span>
                  </div>
                ) : (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="biblioteca-item"
                    style={{ flex: 1 }}
                    data-testid={`link-open-biblioteca-${slug}`}
                  >
                    <span className="biblioteca-icon">{item.tipo}</span>
                    <span className="biblioteca-nome">{item.nome}</span>
                  </a>
                )}
                {isAdmin && (
                  <button
                    onClick={() => { void deletarMaterial(item.id) }}
                    title="Remover material"
                    data-testid={`btn-delete-material-${item.id}`}
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
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
