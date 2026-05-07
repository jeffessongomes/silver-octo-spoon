// Tipos compartilhados entre frontend e backend
// Baseado na spec: painel-estefania-backend-spec

export type FaseStatus = 'done' | 'active' | 'pending'
export type FaseTipo = 'extra'
export type MaterialTipo = 'PDF' | 'PNG' | 'DOC' | 'XLS' | 'LINK' | 'VIDEO'

export interface Tarefa {
  id: string
  texto: string
  concluida?: boolean
  observacao?: string
}

export interface Material {
  nome: string
  tipo: MaterialTipo
  url: string
  pendente?: boolean
}

export interface Fase {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo | null
  tarefas: Tarefa[]
  materiais: Material[]
}

export interface BibliotecaItem extends Material {}

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

export type FiltroTarefas = 'todas' | 'pendentes' | 'concluidas'
