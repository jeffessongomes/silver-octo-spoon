import { useEffect, useReducer, useRef } from 'react'
import { readJson, writeJson } from '../../../lib/storage'
import { buildPainelStorageKey } from '../../../constants/storage-keys'
import { FASE_INICIAL_EXPANDIDA, TAREFAS_PRE_CONCLUIDAS } from '../data'
import type { EstadoPainel } from '../types'
import { estadoInicialVazio, painelReducer, type PainelAction } from './painelReducer'

const aplicarPreConcluidas = (estado: EstadoPainel): EstadoPainel => {
  const tarefas = { ...estado.tarefas }
  let mudou = false
  for (const id of TAREFAS_PRE_CONCLUIDAS) {
    if (tarefas[id] === undefined) {
      tarefas[id] = true
      mudou = true
    }
  }
  return mudou ? { ...estado, tarefas } : estado
}

const aplicarFaseInicialExpandida = (estado: EstadoPainel): EstadoPainel => {
  if (estado.expandidas.length === 0) {
    return { ...estado, expandidas: [FASE_INICIAL_EXPANDIDA] }
  }
  return estado
}

const hidratar = (cliente: string): EstadoPainel => {
  const key = buildPainelStorageKey(cliente)
  const persisted = readJson<EstadoPainel>(key, estadoInicialVazio)
  return aplicarFaseInicialExpandida(aplicarPreConcluidas(persisted))
}

export interface UsePainelStateResult {
  estado: EstadoPainel
  dispatch: React.Dispatch<PainelAction>
}

export const usePainelState = (cliente: string): UsePainelStateResult => {
  const [estado, dispatch] = useReducer(painelReducer, cliente, hidratar)
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      writeJson(buildPainelStorageKey(cliente), estado)
      return
    }
    writeJson(buildPainelStorageKey(cliente), estado)
  }, [cliente, estado])

  return { estado, dispatch }
}
