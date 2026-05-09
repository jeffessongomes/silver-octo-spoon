import { ClienteRepository } from '../repositories/ClienteRepository'
import { FaseRepository, FaseComTarefas } from '../repositories/FaseRepository'
import { MaterialRepository, MaterialRow } from '../repositories/MaterialRepository'
import { NotFoundError } from '../shared/errors'
import type { DadosPainel, Fase, Tarefa, Material, FaseStatus } from '../shared/types'

export class PainelService {
  constructor(
    private clienteRepository: ClienteRepository,
    private faseRepository: FaseRepository,
    private materialRepository: MaterialRepository
  ) {}

  async getPainelCompleto(clienteId: string): Promise<DadosPainel> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)

    const fasesRows = await this.faseRepository.getFasesByCliente(clienteId)

    const fases: Fase[] = await Promise.all(
      fasesRows.map(async (faseRow) => {
        const faseComTarefas = await this.faseRepository.getFaseWithTarefas(clienteId, faseRow.id)
        return this.mapFaseToDTO(faseComTarefas!)
      })
    )

    const bibliotecaRows = await this.materialRepository.getMaterialsByCliente(clienteId)
    const biblioteca = bibliotecaRows.map((m) => this.mapMaterialToDTO(m))

    return {
      cliente: clienteId,
      fases,
      biblioteca,
    }
  }

  private mapFaseToDTO(fase: FaseComTarefas): Fase {
    const total = fase.tarefas.length
    const concluidas = fase.tarefas.filter((t) => t.concluida === 1).length

    let status: FaseStatus = 'pending'
    if (total > 0 && concluidas === total) {
      status = 'done'
    } else if (concluidas > 0) {
      status = 'active'
    }

    const tarefas: Tarefa[] = fase.tarefas.map((t) => ({
      id: t.id,
      texto: t.texto,
      concluida: t.concluida === 1,
      observacao: t.observacao ?? undefined,
    }))

    const materiais: Material[] = fase.materiais.map((m) => this.mapMaterialToDTO(m))

    return {
      id: fase.id,
      numero: fase.numero,
      titulo: fase.titulo,
      resumo: fase.resumo ?? '',
      status,
      tipo: fase.tipo ?? undefined,
      tarefas,
      materiais,
    }
  }

  private mapMaterialToDTO(m: MaterialRow): Material {
    return {
      nome: m.nome,
      tipo: m.tipo,
      url: m.url ?? '',
      pendente: !m.url || m.url === '#',
    }
  }
}
