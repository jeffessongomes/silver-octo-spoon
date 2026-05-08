export type FaseStatus = 'done' | 'active' | 'pending'
export type FaseTipo = 'extra'
export type MaterialTipo = 'PDF' | 'PNG' | 'DOC' | 'XLS' | 'LINK' | 'VIDEO'
export type FiltroTarefas = 'todas' | 'pendentes' | 'concluidas'

export interface Tarefa {
  id: string
  texto: string
}

export interface Material {
  nome: string
  tipo: MaterialTipo
  url: string
}

export interface Fase {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo
  tarefas: Tarefa[]
  materiais: Material[]
}

export type BibliotecaItem = Material

export interface MaterialAPI {
  id: string
  nome: string
  tipo: MaterialTipo
  url: string
  cliente_id: string
  fase_id: string | null
  ordem: number
}

export interface CriarMaterialInput {
  nome: string
  tipo: MaterialTipo
  url: string
}

export interface TarefaAPI {
  id: string
  texto: string
  fase_id: string
  cliente_id: string
  concluida: boolean
  ordem: number
}

export interface FaseAPI {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo
  tarefas: TarefaAPI[]
  materiais: Material[]
  cliente_id: string
  ordem: number
}

export interface CriarTarefaInput {
  texto: string
}

export interface CriarFaseInput {
  titulo: string
  resumo: string
  numero?: string
}

export interface ToggleTarefaResponse {
  tarefa: Pick<TarefaAPI, 'id' | 'concluida'>
  fase_status: FaseStatus
}

export interface DadosPainel {
  cliente: string
  fases: Fase[]
  biblioteca: BibliotecaItem[]
}

export interface EstadoPainel {
  tarefas: Record<string, boolean>
  observacoes: Record<string, string>
  expandidas: string[]
  obsAbertas: string[]
}
