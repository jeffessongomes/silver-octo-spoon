# Spec: Integração Backend — Fases, Tarefas e Gestão Admin

**Ticket ID:** fase-tarefa-backend-integration  
**Data:** 2026-05-08  
**Status:** Rascunho

---

## Objetivo

Integrar o painel com o backend para:

1. Persistir o estado de conclusão de tarefas no servidor (substituindo o controle via localStorage).
2. Auto-concluir uma fase quando todas as suas tarefas forem marcadas.
3. Permitir ao admin adicionar novas tarefas a uma fase existente.
4. Permitir ao admin adicionar novas fases.

**Por que:** Atualmente, o estado das tarefas é mantido somente em localStorage — cada dispositivo/sessão tem estado independente. A integração com o backend centraliza o estado e permite que admin e usuário enxerguem os mesmos dados, independente do dispositivo.

---

## Modelo de Dados

### Tipos existentes (sem alteração)

- `Tarefa { id, texto }`
- `Fase { id, numero, titulo, resumo, status, tipo?, tarefas[], materiais[] }`
- `EstadoPainel { tarefas, observacoes, expandidas, obsAbertas }`

### Novos tipos TypeScript

```typescript
// src/features/panel/types.ts

interface TarefaAPI {
  id: string
  texto: string
  fase_id: string
  cliente_id: string
  concluida: boolean
  ordem: number
}

interface FaseAPI {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus        // calculado pelo servidor
  tipo?: FaseTipo
  tarefas: TarefaAPI[]
  cliente_id: string
  ordem: number
}

interface CriarTarefaInput {
  texto: string
}

interface CriarFaseInput {
  titulo: string
  resumo: string
  numero?: string           // auto-gerado pelo servidor se omitido
}

// Resposta do PATCH de toggle
interface ToggleTarefaResponse {
  tarefa: Pick<TarefaAPI, 'id' | 'concluida'>
  fase_status: FaseStatus   // servidor recalcula automaticamente
}
```

---

## Regras de Negócio

1. O estado de conclusão de tarefas é persistido no servidor, não no localStorage.
2. Quando o servidor recebe um toggle de tarefa, recalcula automaticamente o `status` da fase:
   - `0% concluídas` → `pending` (ou `active` se for a fase em andamento)
   - `1%–99% concluídas` → `active`
   - `100% concluídas` → `done`
3. O frontend atualiza o estado local após resposta bem-sucedida do servidor (sem optimistic update — aguarda confirmação).
4. Somente o usuário em modo `isAdmin = true` pode:
   - Toggle tarefa como concluída/pendente
   - Adicionar tarefa a uma fase existente
   - Adicionar nova fase
5. Usuário em modo `isAdmin = false` vê o estado atual das tarefas (apenas leitura, dados do servidor).
6. Adição de tarefa exige `texto` não vazio, min 3 chars, max 200 chars.
7. Adição de fase exige `titulo` não vazio (min 3) e `resumo` não vazio (min 3).
8. Observações permanecem gerenciadas via localStorage (fora do escopo desta feature).
9. Estado de UI (`expandidas`, `obsAbertas`) permanece em localStorage.
10. Controle de acesso admin/view segue a lógica da spec `admin-route-access-control` (URL-based, `AdminModeContext`).

---

## Critérios de Aceite

**CA-1: Toggle tarefa (admin)**
- Dado que o admin acessa `/{clientId}/admin`
- Quando clica no checkbox de uma tarefa pendente
- Então a tarefa é marcada como concluída no servidor via PATCH
- E o checkbox aparece marcado na UI após a resposta da API
- E se todas as tarefas da fase estiverem concluídas, a fase exibe status `done`

**CA-2: Toggle tarefa (view — somente leitura)**
- Dado que o usuário acessa `/{clientId}`
- Quando a página carrega
- Então o estado de conclusão das tarefas é carregado do servidor
- E os checkboxes são renderizados sem handler de clique (desabilitados)

**CA-3: Estado compartilhado entre sessões**
- Dado que o admin marca uma tarefa em `/{clientId}/admin` (sessão A)
- Quando outro usuário abre `/{clientId}` (sessão B)
- Então a tarefa aparece como concluída (lida do servidor, não localStorage)

**CA-4: Adicionar tarefa (admin)**
- Dado que o admin acessa `/{clientId}/admin`
- Quando preenche o formulário de nova tarefa em uma fase e clica em "Adicionar"
- Então a tarefa é criada no servidor e aparece no final da lista da fase
- E o formulário é limpo após sucesso

**CA-5: Adicionar fase (admin)**
- Dado que o admin acessa `/{clientId}/admin`
- Quando preenche o formulário de nova fase e clica em "Adicionar fase"
- Então a fase é criada no servidor e aparece no final da lista
- E a nova fase começa com status `pending` e sem tarefas

**CA-6: Estado de loading**
- Dado que a página está carregando dados do servidor
- Quando a requisição GET está em andamento
- Então um indicador de carregamento é exibido (skeleton ou spinner)
- E os checkboxes ficam inacessíveis durante o loading

**CA-7: Estado de erro no carregamento**
- Dado que o servidor retorna erro no GET de fases
- Então uma mensagem de erro e botão "Tentar novamente" são exibidos
- Quando o usuário clica em "Tentar novamente"
- Então a requisição é refeita

---

## Edge Cases

1. **Toggle com request em andamento** — se o admin clica em um checkbox enquanto a request anterior para aquele `tarefaId` ainda está em andamento, o segundo clique é ignorado (checkbox desabilitado durante `toggling`).
2. **Request falha no toggle** — o estado local NÃO é atualizado; um toast de erro é exibido; o checkbox permanece no estado anterior.
3. **Adicionar tarefa com texto vazio** — botão de submit desabilitado; mensagem de erro inline exibida.
4. **Adicionar fase com campos vazios** — botão de submit desabilitado; mensagem de erro inline por campo inválido.
5. **Fase sem tarefas** — a nova fase começa com lista vazia; o formulário de adição de tarefa aparece imediatamente (apenas admin).
6. **Usuário view durante criação de fase/tarefa pelo admin** — o usuário view precisa recarregar a página para ver as novas entidades (sem polling; fora de escopo).
7. **`clientId` inválido (404 do servidor)** — painel exibe mensagem "Cliente não encontrado" em vez de dados.
8. **Timeout de rede** — tratado como erro; toast de erro + botão retry no banner de fases.

---

## UI

### Estado de loading de fases

- Skeleton animado no lugar das cards de fase enquanto `loading = true`.
- `data-testid="skeleton-fases"` no container do skeleton.

### Estado de erro de fases

- Banner de erro com mensagem e botão "Tentar novamente" (`data-testid="btn-retry-fases"`).
- Mesmo padrão visual da Biblioteca.

### Checkbox durante toggle

- Durante o PATCH (`toggling.has(tarefaId)`): checkbox renderizado com `aria-disabled="true"` e cursor não-permitido.
- Após resposta com sucesso: checkbox atualizado via re-fetch das fases.
- Após resposta com erro: checkbox permanece no estado anterior + toast "Erro ao atualizar tarefa".

### Formulário "Adicionar tarefa" (admin only, por fase)

- Aparece no final de cada fase, abaixo da lista de tarefas, apenas quando `isAdmin = true`.
- Input de texto + botão "Adicionar".
- `data-testid="input-add-tarefa-{faseId}"`
- `data-testid="btn-add-tarefa-{faseId}"`
- Enquanto submitting: botão desabilitado.
- Após sucesso: input limpo, tarefa aparece no final da lista.
- Erro: mensagem inline abaixo do input (`data-testid="error-add-tarefa-{faseId}"`).

### Formulário "Adicionar fase" (admin only, global)

- Aparece no final da lista de fases (após a última), apenas quando `isAdmin = true`.
- Campos: Título (input text), Resumo (textarea).
- `data-testid="input-add-fase-titulo"`
- `data-testid="input-add-fase-resumo"`
- `data-testid="btn-add-fase"`
- Enquanto submitting: botão desabilitado.
- Após sucesso: formulário limpo, nova fase aparece no final.
- Erro: mensagem inline (`data-testid="error-add-fase"`).

### Status visual de fase (done)

- Quando `status === 'done'`, a fase exibe o indicador visual de conclusão (definido pelo CSS existente).
- Atualização ocorre após resposta do servidor ao toggle da última tarefa da fase.

---

## Arquitetura

### Arquivos a criar

| Arquivo | Propósito |
|---|---|
| `src/features/panel/hooks/useFasesAPI.ts` | Carregar fases do servidor, criar nova fase |
| `src/features/panel/hooks/useFasesAPI.test.ts` | Testes unitários do hook |
| `src/features/panel/hooks/useTarefasAPI.ts` | Toggle de conclusão, criar nova tarefa |
| `src/features/panel/hooks/useTarefasAPI.test.ts` | Testes unitários do hook |

### Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `src/features/panel/types.ts` | Adicionar `TarefaAPI`, `FaseAPI`, `CriarTarefaInput`, `CriarFaseInput`, `ToggleTarefaResponse` |
| `src/features/panel/Painel.tsx` | Substituir `dadosPainel` de `data.ts` por `useFasesAPI`; integrar `useTarefasAPI` para handlers |
| `src/features/panel/components/Fase.tsx` | Adicionar formulário de nova tarefa (admin only); receber handler `criarTarefa` como prop |
| `src/features/panel/components/TarefaItem.tsx` | Receber handler async `onToggleConcluida`; exibir estado de `toggling` no checkbox |
| `src/features/panel/Painel.test.tsx` | Atualizar mocks para `useFasesAPI` e `useTarefasAPI`; cobrir estados loading/error |
| `src/features/panel/components/Fase.test.tsx` | Adicionar testes do formulário de nova tarefa |

### Novos endpoints (contrato esperado do backend)

| Método | Path | Body | Resposta |
|---|---|---|---|
| `GET` | `/api/clientes/{clienteId}/fases` | — | `FaseAPI[]` |
| `PATCH` | `/api/clientes/{clienteId}/tarefas/{tarefaId}/concluida` | `{ concluida: boolean }` | `ToggleTarefaResponse` |
| `POST` | `/api/clientes/{clienteId}/fases/{faseId}/tarefas` | `CriarTarefaInput` | `TarefaAPI` |
| `POST` | `/api/clientes/{clienteId}/fases` | `CriarFaseInput` | `FaseAPI` |

Todos os endpoints recebem o header `X-Client-ID: {clienteId}` (padrão da `useBiblioteca`).

### Interface dos novos hooks

```typescript
// useFasesAPI.ts
interface UseFasesAPIResult {
  fases: FaseAPI[]
  loading: boolean
  error: string | null
  submitting: boolean
  submitError: string | null
  fetchFases: () => void
  criarFase: (input: CriarFaseInput) => Promise<void>
}

// useTarefasAPI.ts
interface UseTarefasAPIResult {
  toggling: Set<string>            // IDs de tarefas com PATCH em andamento
  toggleError: string | null
  addingTarefaFaseId: string | null // faseId com POST de tarefa em andamento
  addTarefaError: string | null
  toggleConcluida: (tarefaId: string, concluida: boolean, onSuccess: () => void) => Promise<void>
  criarTarefa: (faseId: string, input: CriarTarefaInput, onSuccess: () => void) => Promise<void>
}
```

### Integração em `Painel.tsx`

```tsx
const { fases, loading, error, fetchFases, criarFase, submitting, submitError } = useFasesAPI(clientId)
const { toggleConcluida, toggling, criarTarefa } = useTarefasAPI(clientId)

// após toggle ou criação bem-sucedidos:
// chamar fetchFases() para re-fetch e atualizar estado
```

### Padrão dos hooks (seguir useBiblioteca)

- `useEffect` com `fetchTrigger` para re-fetch controlado via `fetchFases()`.
- `useCallback` em todos os handlers que alteram estado.
- `cancelled = true` no cleanup do `useEffect` para evitar memory leak.
- Estado de `submitting` separado do `loading` de lista.

---

## Dependências de Infraestrutura

| Tipo | Item | Observação |
|---|---|---|
| Variável de ambiente | `VITE_API_URL` | Já existente em `src/lib/api.ts` |

Nenhuma nova biblioteca a instalar. `axios` e `react-router-dom` já estão presentes.

---

## Estratégia de Testes

Seguindo `.claude/rules/react-testing.md`.

### Unit — `useFasesAPI`

- Estado inicial: `fases = []`, `loading = true`, `error = null`
- Fetch bem-sucedido: `fases` populada, `loading = false`
- Fetch com erro: `error` populada, `loading = false`
- `criarFase` sucesso: `submitting` vai a `true` durante, volta a `false` após; `onSuccess` chamado
- `criarFase` erro: `submitError` populado
- `fetchFases` re-dispara o GET

### Unit — `useTarefasAPI`

- `toggleConcluida` inicia: `toggling.has(tarefaId) === true`
- `toggleConcluida` sucesso: `toggling` limpo, `onSuccess` chamado
- `toggleConcluida` erro: `toggling` limpo, `toggleError` populado
- Dois toggles simultâneos em tarefas distintas: ambos `tarefaId`s em `toggling` ao mesmo tempo
- `criarTarefa` sucesso: `addingTarefaFaseId === faseId` durante; `onSuccess` chamado após
- `criarTarefa` erro: `addTarefaError` populado

### Integration — `Fase` (formulário de nova tarefa)

**when isAdmin is false:**
- Formulário de adicionar tarefa ausente do DOM

**when isAdmin is true:**
- Formulário de adicionar tarefa visível (`data-testid="input-add-tarefa-{faseId}"`)
- Submit com texto vazio: botão `btn-add-tarefa-{faseId}` desabilitado
- Submit válido: `criarTarefa` chamado com `faseId` e `{ texto }`; input limpo após `onSuccess`
- Durante submitting (`addingTarefaFaseId === faseId`): botão desabilitado

### Integration — `Painel` (formulário de nova fase)

**when isAdmin is false:**
- Formulário de adicionar fase ausente do DOM

**when isAdmin is true:**
- Formulário de adicionar fase visível (`data-testid="input-add-fase-titulo"`)
- Submit com campos vazios: botão `btn-add-fase` desabilitado
- Submit válido: `criarFase` chamado com `{ titulo, resumo }`; formulário limpo após sucesso
- Durante submitting: botão desabilitado

### Integration — `TarefaItem` (toggle async)

- Checkbox clicado: `toggleConcluida` chamado com `tarefaId`, `!concluida`
- Durante toggling (`toggling.has(tarefaId)`): checkbox renderizado com `aria-disabled="true"`
- Após sucesso: fase re-fetched (verificar chamada ao `fetchFases`)

### Integration — `Painel` (estados da página)

Cobrir os 4 estados obrigatórios:

| Estado | Validação |
|---|---|
| Loading | `skeleton-fases` no DOM; checkboxes inacessíveis |
| Error | `btn-retry-fases` no DOM; mensagem de erro visível |
| Empty | Painel sem fases renderiza formulário de adição (admin) ou mensagem (view) |
| Success | Lista de fases renderizada com dados da API |

Transição obrigatória: `loading → error → retry → success`.

---

## Fora de Escopo

- Autenticação ou autorização — controle de acesso segue a spec `admin-route-access-control` (URL-based, sem senha)
- Edição de texto de tarefa ou título de fase existentes
- Exclusão de tarefa ou fase
- Reordenação de fases ou tarefas (drag & drop)
- Observações persistidas no backend (continuam em localStorage)
- Estado de expansão de fases persistido no backend (continua em localStorage)
- Polling ou WebSocket para atualização em tempo real entre sessões
- Paginação de fases ou tarefas
- Validação de `clientId` no frontend (404 do servidor tratado como erro genérico)
- Banner ou indicador visual de "modo admin" (fora de escopo conforme spec anterior)
