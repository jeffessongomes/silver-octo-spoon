import type { FaseRepository, FaseComTarefas, TarefaRow } from '../repositories/FaseRepository'
import type { TarefaRepository, CreateTarefaDTO, UpdateTarefaDTO } from '../repositories/TarefaRepository'
import { NotFoundError } from '../shared/errors'
import { calculateFaseStatus } from '../shared/utils'
import type { FiltroTarefas } from '../shared/types'

export class TarefaService {
  constructor(
    private tarefaRepository: TarefaRepository,
    private faseRepository: FaseRepository
  ) {}

  async getTarefa(clienteId: string, tarefaId: string): Promise<TarefaRow | null> {
    return this.tarefaRepository.getTarefa(clienteId, tarefaId)
  }

  async getTarefasByFase(clienteId: string, faseId: string, filtro: FiltroTarefas = 'todas'): Promise<TarefaRow[]> {
    return this.tarefaRepository.getTarefasByFase(clienteId, faseId, filtro)
  }

  async createTarefa(
    clienteId: string,
    faseId: string,
    data: Pick<CreateTarefaDTO, 'texto'>
  ): Promise<{ tarefa: TarefaRow; fase: FaseComTarefas }> {
    const tarefa = await this.tarefaRepository.createTarefa({ ...data, faseId, clienteId })
    await this.faseRepository.recalculateFaseStatus(clienteId, faseId)
    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, faseId)
    return { tarefa, fase: this.decorateWithStatus(fase!) }
  }

  async updateTarefa(
    clienteId: string,
    tarefaId: string,
    data: UpdateTarefaDTO
  ): Promise<{ tarefa: TarefaRow; fase: FaseComTarefas }> {
    const existing = await this.tarefaRepository.getTarefa(clienteId, tarefaId)
    if (!existing) throw new NotFoundError(`Tarefa '${tarefaId}' não encontrada`)

    const tarefa = await this.tarefaRepository.updateTarefa(clienteId, tarefaId, data)

    if (data.concluida !== undefined) {
      await this.faseRepository.recalculateFaseStatus(clienteId, existing.fase_id)
    }

    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, existing.fase_id)
    return { tarefa, fase: this.decorateWithStatus(fase!) }
  }

  async deleteTarefa(clienteId: string, tarefaId: string): Promise<void> {
    const existing = await this.tarefaRepository.getTarefa(clienteId, tarefaId)
    if (!existing) throw new NotFoundError(`Tarefa '${tarefaId}' não encontrada`)

    await this.tarefaRepository.deleteTarefa(clienteId, tarefaId)
    await this.faseRepository.recalculateFaseStatus(clienteId, existing.fase_id)
  }

  private decorateWithStatus(fase: FaseComTarefas): FaseComTarefas {
    const total = fase.tarefas.length
    const concluidas = fase.tarefas.filter((t) => t.concluida === 1).length
    return { ...fase, status: calculateFaseStatus(total, concluidas) }
  }
}
