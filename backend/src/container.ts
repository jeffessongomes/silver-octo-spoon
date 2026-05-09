import { ClienteRepository } from './repositories/ClienteRepository'
import { FaseRepository } from './repositories/FaseRepository'
import { TarefaRepository } from './repositories/TarefaRepository'
import { ObservacaoRepository } from './repositories/ObservacaoRepository'
import { MaterialRepository } from './repositories/MaterialRepository'
import { ClienteService } from './services/ClienteService'
import { FaseService } from './services/FaseService'
import { TarefaService } from './services/TarefaService'
import { PainelService } from './services/PainelService'
import { ObservacaoService } from './services/ObservacaoService'
import { ClienteController } from './controllers/ClienteController'
import { FaseController } from './controllers/FaseController'
import { TarefaController } from './controllers/TarefaController'
import { ObservacaoController } from './controllers/ObservacaoController'
import { MaterialService } from './services/MaterialService'
import { MaterialController } from './controllers/MaterialController'
import { PainelController } from './controllers/PainelController'

export function createContainer() {
  const clienteRepo = new ClienteRepository()
  const faseRepo = new FaseRepository()
  const tarefaRepo = new TarefaRepository()
  const obsRepo = new ObservacaoRepository()
  const matRepo = new MaterialRepository()

  const clienteService = new ClienteService(clienteRepo)
  const tarefaService = new TarefaService(tarefaRepo, faseRepo)
  const faseService = new FaseService(faseRepo, clienteRepo)
  const painelService = new PainelService(clienteRepo, faseRepo, matRepo)
  const obsService = new ObservacaoService(obsRepo, tarefaRepo)
  const matService = new MaterialService(matRepo)

  return {
    clienteController: new ClienteController(clienteService),
    faseController: new FaseController(faseService, tarefaService),
    tarefaController: new TarefaController(tarefaService),
    obsController: new ObservacaoController(obsService),
    matController: new MaterialController(matService),
    painelController: new PainelController(painelService),
  }
}

export type Container = ReturnType<typeof createContainer>
