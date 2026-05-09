import { FaseRepository, FaseComTarefas, CreateFaseDTO, FaseRow, UpdateFaseDTO } from '../repositories/FaseRepository'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { NotFoundError } from '../shared/errors'
import { calculateFaseStatus } from '../shared/utils'

export class FaseService {
  constructor(
    private faseRepository: FaseRepository,
    private clienteRepository: ClienteRepository
  ) {}

  async getFases(clienteId: string): Promise<FaseRow[]> {
    return this.faseRepository.getFasesByCliente(clienteId)
  }

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

  async updateFase(clienteId: string, faseId: string, data: UpdateFaseDTO): Promise<FaseComTarefas | null> {
    return this.faseRepository.updateFase(clienteId, faseId, data)
  }

  async deleteFase(clienteId: string, faseId: string): Promise<void> {
    return this.faseRepository.deleteFase(clienteId, faseId)
  }

  private decorateFaseWithStatus(fase: FaseComTarefas): FaseComTarefas {
    const total = fase.tarefas.length
    const concluidas = fase.tarefas.filter((t) => t.concluida === 1).length
    return { ...fase, status: calculateFaseStatus(total, concluidas) }
  }
}
