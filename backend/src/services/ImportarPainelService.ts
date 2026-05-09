import { ClienteRepository } from '../repositories/ClienteRepository'
import { FaseRepository, CreateFaseDTO } from '../repositories/FaseRepository'
import { NotFoundError } from '../shared/errors'
import type { FaseTipo, MaterialTipo } from '../shared/types'

export interface ImportarTarefaInput {
  texto: string
  observacao?: string
}

export interface ImportarMaterialInput {
  nome: string
  tipo: MaterialTipo
  url: string
}

export interface ImportarFaseInput {
  numero?: string
  titulo: string
  resumo?: string
  tipo?: FaseTipo
  tarefas?: ImportarTarefaInput[]
  materiais?: ImportarMaterialInput[]
}

export interface ImportarPainelPayload {
  fases: ImportarFaseInput[]
}

export interface ImportarPainelResponse {
  importado: number
  fases: { id: string; titulo: string }[]
}

export class ImportacaoValidationError extends Error {
  constructor(
    message: string,
    public detalhes: string[]
  ) {
    super(message)
    this.name = 'ImportacaoValidationError'
  }
}

const MATERIAL_TIPOS_VALIDOS: MaterialTipo[] = ['PDF', 'PNG', 'DOC', 'XLS', 'LINK', 'VIDEO']

function validarPayload(payload: ImportarPainelPayload): string[] {
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

export class ImportarPainelService {
  constructor(
    private clienteRepository: ClienteRepository,
    private faseRepository: FaseRepository
  ) {}

  async importarPainel(
    clienteId: string,
    payload: ImportarPainelPayload
  ): Promise<ImportarPainelResponse> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)

    const erros = validarPayload(payload)
    if (erros.length > 0) {
      throw new ImportacaoValidationError('Payload inválido', erros)
    }

    const fasesExistentes = await this.faseRepository.getFasesByCliente(clienteId)
    const baseOrdem = fasesExistentes.length

    const fasesImportadas: { id: string; titulo: string }[] = []

    for (let i = 0; i < payload.fases.length; i++) {
      const input = payload.fases[i]
      const numero = input.numero ?? String(baseOrdem + i + 1)

      const dto: CreateFaseDTO = {
        numero,
        titulo: input.titulo.trim(),
        resumo: input.resumo?.trim() ?? '',
        tipo: input.tipo ?? null,
        tarefas: (input.tarefas ?? []).map((t) => ({
          texto: t.texto.trim(),
          observacao: t.observacao && t.observacao.trim() ? t.observacao.trim() : undefined,
        })),
        materiais: (input.materiais ?? []).map((m) => ({
          nome: m.nome,
          tipo: m.tipo,
          url: m.url,
        })),
      }

      const fase = await this.faseRepository.createFaseWithTarefas(clienteId, dto)
      fasesImportadas.push({ id: fase.id, titulo: fase.titulo })
    }

    return { importado: fasesImportadas.length, fases: fasesImportadas }
  }
}
