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
