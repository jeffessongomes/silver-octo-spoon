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
  concluida: boolean
  observacao: string | null
  fase_id?: string
  cliente_id?: string
  ordem?: number
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
  cliente_id?: string
  ordem?: number
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
  expandidas: string[]
  obsAbertas: string[]
}

export interface ImportarTarefaInput {
  texto: string
  observacao?: string
}

export interface ImportarFaseInput {
  numero?: string
  titulo: string
  resumo?: string
  tipo?: FaseTipo
  tarefas?: ImportarTarefaInput[]
  materiais?: { nome: string; tipo: MaterialTipo; url: string }[]
}

export interface ImportarPainelInput {
  fases: ImportarFaseInput[]
}

export interface ImportarPainelResponse {
  importado: number
  fases: { id: string; titulo: string }[]
}

export interface ImportarPainelPreview {
  totalFases: number
  totalTarefas: number
  totalObservacoes: number
  totalMateriais: number
  fases: { titulo: string; tarefas: number; observacoes: number; materiais: number }[]
}
