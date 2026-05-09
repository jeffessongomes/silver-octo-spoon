import { useState, useMemo } from 'react'
import { useImportarPainelAPI } from '../hooks/useImportarPainelAPI'
import type { ImportarPainelInput, ImportarPainelPreview } from '../types'

interface ImportarPainelFormProps {
  clienteId: string
  onSuccess: () => void
}

const MATERIAL_TIPOS_VALIDOS = ['PDF', 'PNG', 'DOC', 'XLS', 'LINK', 'VIDEO']

function validarPayload(payload: ImportarPainelInput): string[] {
  const erros: string[] = []

  if (!payload.fases || !Array.isArray(payload.fases)) {
    erros.push('Campo `fases` é obrigatório e deve ser um array')
    return erros
  }

  if (payload.fases.length === 0) {
    erros.push('A importação deve ter ao menos 1 fase')
    return erros
  }

  for (let i = 0; i < payload.fases.length; i++) {
    const fase = payload.fases[i]
    const prefixo = `Fase ${i + 1}`

    if (!fase.titulo || typeof fase.titulo !== 'string' || fase.titulo.trim().length < 3) {
      erros.push(`${prefixo}: título é obrigatório e deve ter ao menos 3 caracteres`)
    }

    if (fase.tipo !== undefined && fase.tipo !== 'extra') {
      erros.push(`${prefixo}: tipo deve ser 'extra' ou omitido`)
    }

    if (fase.tarefas) {
      for (let j = 0; j < fase.tarefas.length; j++) {
        const tarefa = fase.tarefas[j]
        if (!tarefa.texto || typeof tarefa.texto !== 'string' || tarefa.texto.trim().length === 0) {
          erros.push(`${prefixo}, Tarefa ${j + 1}: texto é obrigatório`)
        }
      }
    }

    if (fase.materiais) {
      for (let j = 0; j < fase.materiais.length; j++) {
        const mat = fase.materiais[j]
        if (mat.tipo && !MATERIAL_TIPOS_VALIDOS.includes(mat.tipo)) {
          erros.push(`${prefixo}, Material ${j + 1}: tipo '${mat.tipo}' inválido`)
        }
      }
    }
  }

  return erros
}

function calcularPreview(payload: ImportarPainelInput): ImportarPainelPreview {
  const fases = payload.fases.map((f) => ({
    titulo: f.titulo,
    tarefas: f.tarefas?.length ?? 0,
    observacoes: f.tarefas?.filter((t) => t.observacao && t.observacao.trim()).length ?? 0,
    materiais: f.materiais?.length ?? 0,
  }))

  return {
    totalFases: fases.length,
    totalTarefas: fases.reduce((acc, f) => acc + f.tarefas, 0),
    totalObservacoes: fases.reduce((acc, f) => acc + f.observacoes, 0),
    totalMateriais: fases.reduce((acc, f) => acc + f.materiais, 0),
    fases,
  }
}

type ParseResult =
  | { ok: true; payload: ImportarPainelInput; erros: string[] }
  | { ok: false; payload: null; erros: string[] }

function parseJson(raw: string): ParseResult {
  try {
    const parsed = JSON.parse(raw) as ImportarPainelInput
    const erros = validarPayload(parsed)
    if (erros.length === 0) {
      return { ok: true, payload: parsed, erros }
    }
    return { ok: false, payload: null, erros }
  } catch {
    return { ok: false, payload: null, erros: ['JSON inválido: verifique a sintaxe'] }
  }
}

export function ImportarPainelForm({ clienteId, onSuccess }: ImportarPainelFormProps) {
  const [jsonInput, setJsonInput] = useState('')
  const { importar, submitting, error } = useImportarPainelAPI(clienteId)

  const parseResult = useMemo(() => {
    if (!jsonInput.trim()) return null
    return parseJson(jsonInput)
  }, [jsonInput])

  const preview = useMemo(() => {
    if (!parseResult?.ok || !parseResult.payload) return null
    return calcularPreview(parseResult.payload)
  }, [parseResult])

  const erros = parseResult?.erros ?? []
  const pronto = parseResult?.ok === true && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pronto || !parseResult?.payload) return
    await importar(parseResult.payload, () => {
      setJsonInput('')
      onSuccess()
    })
  }

  return (
    <section className="admin-section" aria-label="Importar painel via JSON" data-testid="section-import-painel">
      <h3 className="admin-section-title">Importar painel via JSON</h3>
      <form className="admin-form" onSubmit={(e) => { void handleSubmit(e) }}>
        <div className="admin-form-field">
          <label htmlFor="input-import-json" className="admin-label">
            JSON do painel
          </label>
          <textarea
            id="input-import-json"
            data-testid="input-import-json"
            className="admin-input admin-textarea admin-textarea--json"
            placeholder={'Cole o JSON aqui. Exemplo:\n{"fases": [{"titulo": "Briefing", "tarefas": [{"texto": "Tarefa 1"}]}]}'}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={8}
          />
        </div>

        {erros.length > 0 && (
          <div className="admin-import-errors" data-testid="msg-import-json-error" role="alert">
            {erros.map((err, i) => (
              <p key={i} className="admin-import-error-item">{err}</p>
            ))}
          </div>
        )}

        {preview && (
          <div className="admin-import-preview" data-testid="preview-import-painel">
            <p className="admin-import-preview-summary">
              <strong>{preview.totalFases}</strong> fase{preview.totalFases !== 1 ? 's' : ''}{' '}
              &bull; <strong>{preview.totalTarefas}</strong> tarefa{preview.totalTarefas !== 1 ? 's' : ''}{' '}
              &bull; <strong>{preview.totalObservacoes}</strong> observa{preview.totalObservacoes !== 1 ? 'ções' : 'ção'}{' '}
              &bull; <strong>{preview.totalMateriais}</strong> material{preview.totalMateriais !== 1 ? 'is' : ''}
            </p>
            <ul className="admin-import-preview-list">
              {preview.fases.map((f, i) => (
                <li key={i} className="admin-import-preview-item">
                  {f.titulo}
                  {' ('}
                  {f.tarefas} tarefa{f.tarefas !== 1 ? 's' : ''}
                  {f.observacoes > 0 ? `, ${f.observacoes} obs` : ''}
                  {f.materiais > 0 ? `, ${f.materiais} material${f.materiais !== 1 ? 'is' : ''}` : ''}
                  {')'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="admin-import-api-error" role="alert">{error}</p>
        )}

        <div className="admin-form-actions">
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            data-testid="btn-confirm-import"
            disabled={!pronto}
          >
            {submitting ? 'Importando...' : 'Confirmar Importação'}
          </button>
        </div>
      </form>
    </section>
  )
}
