import { ObservacaoRepository, ObservacaoRow } from '../repositories/ObservacaoRepository'
import { NotFoundError } from '../shared/errors'
import { TarefaRepository } from '../repositories/TarefaRepository'

export class ObservacaoService {
  constructor(
    private observacaoRepository: ObservacaoRepository,
    private tarefaRepository: TarefaRepository
  ) {}

  async getObservacao(clienteId: string, tarefaId: string): Promise<ObservacaoRow | null> {
    const tarefa = await this.tarefaRepository.getTarefa(clienteId, tarefaId)
    if (!tarefa) throw new NotFoundError(`Tarefa '${tarefaId}' não encontrada`)
    return this.observacaoRepository.getObservacao(clienteId, tarefaId)
  }

  async upsertObservacao(
    clienteId: string,
    tarefaId: string,
    conteudo: string
  ): Promise<ObservacaoRow> {
    const tarefa = await this.tarefaRepository.getTarefa(clienteId, tarefaId)
    if (!tarefa) throw new NotFoundError(`Tarefa '${tarefaId}' não encontrada`)
    return this.observacaoRepository.upsertObservacao(clienteId, tarefaId, conteudo)
  }

  async deleteObservacao(clienteId: string, tarefaId: string): Promise<void> {
    const tarefa = await this.tarefaRepository.getTarefa(clienteId, tarefaId)
    if (!tarefa) throw new NotFoundError(`Tarefa '${tarefaId}' não encontrada`)
    return this.observacaoRepository.deleteObservacao(clienteId, tarefaId)
  }
}
