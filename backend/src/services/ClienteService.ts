import { ClienteRepository, CreateClienteDTO, UpdateClienteDTO, ClienteRow } from '../repositories/ClienteRepository'
import { NotFoundError, ValidationError } from '../shared/errors'
import { validateId } from '../shared/utils'

export class ClienteService {
  constructor(private clienteRepository: ClienteRepository) {}

  async createCliente(data: CreateClienteDTO): Promise<ClienteRow> {
    validateId(data.id)
    if (!data.nome || !data.nome.trim()) {
      throw new ValidationError('Nome do cliente é obrigatório')
    }

    const existing = await this.clienteRepository.getCliente(data.id)
    if (existing) {
      throw new ValidationError(`Cliente com id '${data.id}' já existe`, { id: 'already_exists' })
    }

    return this.clienteRepository.createCliente({
      id: data.id,
      nome: data.nome.trim(),
      descricao: data.descricao?.trim(),
    })
  }

  async getCliente(clienteId: string): Promise<ClienteRow> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)
    return cliente
  }

  async updateCliente(clienteId: string, data: UpdateClienteDTO): Promise<ClienteRow> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)
    const updated = await this.clienteRepository.updateCliente(clienteId, data)
    return updated!
  }

  async deleteCliente(clienteId: string): Promise<void> {
    const cliente = await this.clienteRepository.getCliente(clienteId)
    if (!cliente) throw new NotFoundError(`Cliente '${clienteId}' não encontrado`)
    return this.clienteRepository.deleteCliente(clienteId)
  }

  async getAll(): Promise<ClienteRow[]> {
    return this.clienteRepository.getAll()
  }
}
