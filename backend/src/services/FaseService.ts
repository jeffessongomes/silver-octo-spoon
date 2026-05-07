import { FaseRepository, FaseComTarefas, CreateFaseDTO } from '../repositories/FaseRepository'
import { TarefaRepository, UpdateTarefaDTO, CreateTarefaDTO } from '../repositories/TarefaRepository'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { NotFoundError } from '../shared/errors'
import type { FaseStatus } from '../shared/types'

export class FaseService {
  constructor(
    private faseRepository: FaseRepository,
    private tarefaRepository: TarefaRepository,
    private clienteRepository: ClienteRepository
  ) {}

  async getFaseComTarefas(clienteId: string, faseId: string): Promise<FaseComTarefas> {
    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, faseId)
    if (!fase) throw new NotFoundError(`Fase '${faseId}' não encontrada`)
    return this.decorateFaseWithStatus(fase)
  }

  async createFase(clienteId: string, data: CreateFaseDTO): Promise<FaseComTarefas> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)

    const faseData: CreateFaseDTO = {
      ...data,
      tarefas: data.tarefas ?? [],
      materiais: data.materiais ?? [],
    }
    const fase = await this.faseRepository.createFaseWithTarefas(clienteId, faseData)
    return this.decorateFaseWithStatus(fase)
  }

  async createTarefa(
    clienteId: string,
    faseId: string,
    data: CreateTarefaDTO
  ): Promise<{ tarefa: FaseComTarefas['tarefas'][0]; fase: FaseComTarefas }> {
    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, faseId)
    if (!fase) throw new NotFoundError(`Fase '${faseId}' não encontrada`)

    const tarefa = await this.tarefaRepository.createTarefa({
      ...data,
      faseId,
      clienteId,
    })

    await this.faseRepository.recalculateFaseStatus(clienteId, faseId)
    const faseAtualizada = await this.getFaseComTarefas(clienteId, faseId)

    return { tarefa, fase: faseAtualizada }
  }

  async toggleTarefaEAtualizarFase(
    clienteId: string,
    tarefaId: string,
    faseId: string,
    concluida: boolean
  ): Promise<{ tarefa: FaseComTarefas['tarefas'][0]; fase: FaseComTarefas }> {
    const tarefa = await this.tarefaRepository.updateTarefa(clienteId, tarefaId, { concluida })

    await this.faseRepository.recalculateFaseStatus(clienteId, faseId)
    const fase = await this.getFaseComTarefas(clienteId, faseId)

    return { tarefa, fase }
  }

  async updateTarefa(
    clienteId: string,
    tarefaId: string,
    faseId: string,
    data: UpdateTarefaDTO
  ): Promise<{ tarefa: FaseComTarefas['tarefas'][0]; fase: FaseComTarefas }> {
    const tarefa = await this.tarefaRepository.updateTarefa(clienteId, tarefaId, data)

    if (data.concluida !== undefined) {
      await this.faseRepository.recalculateFaseStatus(clienteId, faseId)
    }

    const fase = await this.getFaseComTarefas(clienteId, faseId)
    return { tarefa, fase }
  }

  async deleteTarefa(clienteId: string, tarefaId: string, faseId: string): Promise<FaseComTarefas> {
    await this.tarefaRepository.deleteTarefa(clienteId, tarefaId)
    await this.faseRepository.recalculateFaseStatus(clienteId, faseId)
    return this.getFaseComTarefas(clienteId, faseId)
  }

  private decorateFaseWithStatus(fase: FaseComTarefas): FaseComTarefas {
    const total = fase.tarefas.length
    const concluidas = fase.tarefas.filter((t) => t.concluida === 1).length

    let status: FaseStatus = 'pending'
    if (total > 0 && concluidas === total) {
      status = 'done'
    } else if (concluidas > 0) {
      status = 'active'
    }

    return { ...fase, status }
  }
}
