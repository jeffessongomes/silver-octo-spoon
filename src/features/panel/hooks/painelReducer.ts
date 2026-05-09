import type { EstadoPainel } from '../types'

export type PainelAction =
  | { type: 'TOGGLE_FASE'; faseId: string }
  | { type: 'TOGGLE_OBS'; tarefaId: string }
  | { type: 'HYDRATE'; estado: EstadoPainel }

export const estadoInicialVazio: EstadoPainel = {
  expandidas: [],
  obsAbertas: [],
}

const toggleInArray = (arr: string[], item: string): string[] => {
  const idx = arr.indexOf(item)
  if (idx >= 0) return [...arr.slice(0, idx), ...arr.slice(idx + 1)]
  return [...arr, item]
}

export const painelReducer = (state: EstadoPainel, action: PainelAction): EstadoPainel => {
  switch (action.type) {
    case 'TOGGLE_FASE':
      return { ...state, expandidas: toggleInArray(state.expandidas, action.faseId) }
    case 'TOGGLE_OBS':
      return { ...state, obsAbertas: toggleInArray(state.obsAbertas, action.tarefaId) }
    case 'HYDRATE':
      return action.estado
    default:
      return state
  }
}
