import { FaseRepository, FaseComTarefas, CreateFaseDTO } from '../repositories/FaseRepository'
import { TarefaRepository, UpdateTarefaDTO, CreateTarefaDTO } from '../repositories/TarefaRepository'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { NotFoundError } from '../shared/errors'

export class FaseService {
  constructor(
    private faseRepository: FaseRepository,
    private tarefaRepository: TarefaRepository,
    private clienteRepository: ClienteRepository
  ) {}

  async getFaseComTarefas(clienteId: string, faseId: string): Promise<FaseComTarefas> {
    const fase = await this.faseRepository.getFaseWithTarefas(clienteId, faseId)
    if (!fase) throw new NotFoundError(`Fase '${faseId}' não encontrada`)
    return fase
  }

  async createFase(clienteId: string, data: CreateFaseDTO): Promise<FaseComTarefas> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)

    const faseData: CreateFaseDTO = {
      ...data,
      tarefas: data.tarefas ?? [],
      materiais: data.materiais ?? [],
    }
    return this.faseRepository.createFaseWithTarefas(clienteId, faseData)
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

    const faseAtualizada = await this.getFaseComTarefas(clienteId, faseId)
    return { tarefa: { ...tarefa, observacao: null }, fase: faseAtualizada }
  }

  async toggleTarefaEAtualizarFase(
    clienteId: string,
    tarefaId: string,
    faseId: string,
    concluida: boolean
  ): Promise<{ tarefa: FaseComTarefas['tarefas'][0]; fase: FaseComTarefas }> {
    const tarefa = await this.tarefaRepository.updateTarefa(clienteId, tarefaId, { concluida })
    const fase = await this.getFaseComTarefas(clienteId, faseId)
    return { tarefa: { ...tarefa, observacao: null }, fase }
  }

  async updateTarefa(
    clienteId: string,
    tarefaId: string,
    faseId: string,
    data: UpdateTarefaDTO
  ): Promise<{ tarefa: FaseComTarefas['tarefas'][0]; fase: FaseComTarefas }> {
    const tarefa = await this.tarefaRepository.updateTarefa(clienteId, tarefaId, data)
    const fase = await this.getFaseComTarefas(clienteId, faseId)
    return { tarefa: { ...tarefa, observacao: null }, fase }
  }

  async deleteTarefa(clienteId: string, tarefaId: string, faseId: string): Promise<FaseComTarefas> {
    await this.tarefaRepository.deleteTarefa(clienteId, tarefaId)
    return this.getFaseComTarefas(clienteId, faseId)
  }
}
