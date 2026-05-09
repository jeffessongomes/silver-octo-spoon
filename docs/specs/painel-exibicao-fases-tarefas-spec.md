# Spec Técnica — painel-exibicao-fases-tarefas

## Objetivo

Corrigir o fluxo de dados entre a API e a renderização do Painel, garantindo que as
tarefas de cada fase sejam exibidas corretamente na tela.

---

## Diagnóstico (causa raiz)

Foram identificadas três causas raiz independentes que, combinadas, impedem a exibição das tarefas:

### Causa 1 — Endpoint errado em `useFasesAPI`

`useFasesAPI` chama `GET /api/clientes/:clienteId/fases`, que executa apenas:

```sql
SELECT * FROM fases WHERE cliente_id = ? AND ativo = 1
```

Esse endpoint **não inclui tarefas nem materiais**. A resposta retorna objetos `Fase` sem o campo `tarefas`.

O endpoint correto é `GET /api/clientes/:clienteId/painel`, implementado em `PainelService.getPainelCompleto`, que:
- Busca as fases
- Para cada fase, busca tarefas e materiais via `getFaseWithTarefas`
- Converte `concluida` de integer (SQLite) para boolean
- Retorna `{ cliente, fases, biblioteca }`

### Causa 2 — `concluida` como integer no banco (SQLite)

O banco armazena `concluida` como `0` ou `1`. O endpoint `/fases` retorna o valor bruto
sem conversão. O endpoint `/painel` converte corretamente via `t.concluida === 1`.

### Causa 3 — Expansão inicial hardcoded com ID estático

`usePainelState` usa `FASE_INICIAL_EXPANDIDA = 'fase-1'` para expandir a primeira fase
na inicialização. Esse ID era válido para os dados estáticos em `data.ts`, mas os IDs
reais da API são diferentes (UUIDs ou IDs gerados pelo banco). Resultado: nenhuma fase
fica expandida e o conteúdo (incluindo tarefas) permanece oculto por CSS (`max-height: 0`).

---

## Modelo de dados

### Resposta do endpoint `/painel`

```typescript
// Shape real retornado por GET /api/clientes/:clienteId/painel
interface DadosPainelAPI {
  cliente: string
  fases: FasePainelAPI[]
  biblioteca: MaterialAPI[]
}

interface FasePainelAPI {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo
  tarefas: TarefaPainelAPI[]
  materiais: MaterialAPI[]
  // NOTA: sem cliente_id e sem ordem no nível da fase
}

interface TarefaPainelAPI {
  id: string
  texto: string
  concluida: boolean  // já convertido pelo PainelService
  // NOTA: sem fase_id, cliente_id, ordem
}
```

### Impacto nos tipos do frontend

`FaseAPI` e `TarefaAPI` (em `types.ts`) precisam tornar opcionais os campos que o
endpoint `/painel` não retorna:

```typescript
export interface TarefaAPI {
  id: string
  texto: string
  concluida: boolean
  fase_id?: string    // opcional — não retornado pelo /painel
  cliente_id?: string // opcional — não retornado pelo /painel
  ordem?: number      // opcional — não retornado pelo /painel
}

export interface FaseAPI {
  id: string
  numero: string
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo
  tarefas: TarefaAPI[]
  materiais: Material[]
  cliente_id?: string  // opcional — não retornado pelo /painel
  ordem?: number       // opcional — não retornado pelo /painel
}
```

---

## Regras de negócio

1. O painel carrega os dados via `GET /api/clientes/:clienteId/painel` em uma única requisição.
2. A resposta inclui fases com suas tarefas e materiais.
3. `concluida` chega como `boolean` do endpoint `/painel` — não é necessária conversão no frontend.
4. A primeira fase deve estar expandida ao carregar a página.
5. O estado de expansão persiste em localStorage, mas o ID inicial deve vir do primeiro item retornado pela API (não de um ID hardcoded).
6. Re-fetches (após toggle de tarefa ou criação) não mostram skeleton — o conteúdo atual permanece visível.

---

## Critérios de Aceite

**Dado** que o usuário acessa o painel  
**Quando** a página carrega  
**Então** as fases são exibidas com suas tarefas visíveis na primeira fase expandida

**Dado** que a API retorna 3 fases com 5 tarefas cada  
**Quando** o componente renderiza  
**Então** a primeira fase está expandida e suas 5 tarefas aparecem na tela

**Dado** que o usuário fecha e reabre o painel  
**Quando** a página recarrega  
**Então** as fases que estavam expandidas continuam expandidas (estado persiste)

**Dado** que não há histórico de expansão no localStorage  
**Quando** as fases carregam da API  
**Então** a primeira fase é automaticamente expandida (usando o ID real da API)

**Dado** que o administrador cria uma nova tarefa  
**Quando** a criação retorna 201  
**Então** a tarefa aparece na lista sem skeleton na tela

---

## Edge cases

1. **API retorna array vazio de fases**: Painel exibe estado vazio sem crash.
2. **Fase sem tarefas**: `tarefas: []` — lista vazia renderiza sem crash.
3. **Fase sem materiais**: `materiais: []` — seção de materiais não aparece.
4. **localStorage com IDs antigos (`'fase-1'`)**: A lógica de expansão detecta que nenhum ID armazenado corresponde às fases reais e expande a primeira da API.
5. **Re-fetch durante expansão manual**: O estado de expansão do usuário é preservado — o re-fetch não colapsa fases.
6. **Erro no `/painel`**: Exibe mensagem de erro com botão de retry, sem crash.

---

## UI

### Estados visuais

| Estado | Comportamento |
|---|---|
| Carregando (primeira vez) | Skeleton (`data-testid="skeleton-fases"`) |
| Carregando (re-fetch) | Conteúdo atual permanece visível — sem skeleton |
| Erro | Banner de erro + botão "Tentar novamente" |
| Vazio | Mensagem "Nenhuma fase cadastrada" |
| Sucesso | Fases renderizadas, primeira expandida |

### Estrutura de expansão

- Fase expandida: `<article class="fase expanded">` → `.fase-conteudo { max-height: 4000px }`
- Fase colapsada: `<article class="fase">` → `.fase-conteudo { max-height: 0 }`
- A classe `expanded` é controlada por `expandida={estado.expandidas.includes(fase.id)}`

---

## Arquitetura

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/features/panel/types.ts` | Tornar `fase_id`, `cliente_id`, `ordem` opcionais em `TarefaAPI`; `cliente_id`, `ordem` opcionais em `FaseAPI` |
| `src/features/panel/hooks/useFasesAPI.ts` | Mudar endpoint para `/painel`; extrair `fases` de `data.fases`; remover normalização manual de `tarefas`/`materiais` (já vêm do `/painel`) |
| `src/features/panel/hooks/useFasesAPI.test.ts` | Atualizar mocks para shape do `/painel` |
| `src/features/panel/Painel.tsx` | Remover `useEffect` de expansão automática; inicializar `expandidas` com o ID da primeira fase via `usePainelState` ou via dispatch único |
| `src/features/panel/hooks/usePainelState.ts` | Receber `primeiraFaseId: string` como parâmetro; usar esse ID (em vez de `FASE_INICIAL_EXPANDIDA`) quando `expandidas` estiver vazio ou sem match com IDs reais |
| `src/features/panel/hooks/usePainelState.test.ts` | Cobrir novo comportamento de inicialização com ID dinâmico |

### Arquivos a NÃO modificar

- `backend/` — a solução é 100% frontend
- `Fase.tsx`, `Trilha.tsx`, `TarefaItem.tsx` — o shape dos dados está correto após a mudança de tipo
- `useTarefasAPI.ts` — os endpoints de toggle e criação não são afetados

### Fluxo de dados corrigido

```
GET /api/clientes/:clienteId/painel
  → { cliente, fases: [{ id, tarefas: [{id, texto, concluida: boolean}], ... }], biblioteca }
  → useFasesAPI extrai data.fases e data.biblioteca
  → fases armazenadas no estado
  → usePainelStats(fases) computa stats
  → Trilha renderiza cada Fase
  → Fase.tsx renderiza fase.tarefas.map(tarefa => <TarefaItem .../>)
  → TarefaItem renderiza visível (oculta=false quando filtro='todas')
```

### `usePainelState` — inicialização com ID dinâmico

```typescript
// Antes
const hidratar = (cliente: string): EstadoPainel => {
  const persisted = readJson(...)
  return aplicarFaseInicialExpandida(persisted) // usa 'fase-1' hardcoded
}

// Depois
const hidratar = (cliente: string, primeiraFaseId: string): EstadoPainel => {
  const persisted = readJson(...)
  return aplicarFaseInicialExpandida(persisted, primeiraFaseId)
}

const aplicarFaseInicialExpandida = (
  estado: EstadoPainel,
  primeiraFaseId: string
): EstadoPainel => {
  if (estado.expandidas.length === 0) {
    return { ...estado, expandidas: [primeiraFaseId] }
  }
  return estado
}
```

Mas `usePainelState` é inicializado antes de `useFasesAPI` terminar de carregar. Portanto, a inicialização com o ID real da API deve ser separada em dois passos:

1. `usePainelState` inicia normalmente (sem hardcode)
2. Quando `fases` carregam, se nenhuma fase do estado bate com os IDs reais, `Painel.tsx` dispara um único `dispatch(TOGGLE_FASE, fases[0].id)`

**Alternativa mais simples:** inicializar `expandidas = []` (sem hardcode), e garantir que quando a lista de fases for recebida pela primeira vez, o Painel expanda a primeira. Isso já era o objetivo do `useEffect` atual, mas o bug estava na dependência `estado.expandidas` que causava loop ou re-execução desnecessária.

### `useEffect` de expansão — versão corrigida

```typescript
// Em Painel.tsx — roda apenas quando fases carregam pela primeira vez
const fasesIdsRef = useRef<string[]>([])

useEffect(() => {
  if (fases.length === 0) return
  // Só roda quando fases mudam de vazio para preenchido (primeiro load)
  const fasesIds = fases.map(f => f.id)
  if (fasesIdsRef.current.length === 0) {
    fasesIdsRef.current = fasesIds
    const algumExpandido = fases.some(f => estado.expandidas.includes(f.id))
    if (!algumExpandido) {
      dispatch({ type: 'TOGGLE_FASE', faseId: fases[0].id })
    }
  }
}, [fases]) // APENAS fases — não inclui estado.expandidas para evitar loop
```

---

## Dependências de infraestrutura

Nenhuma dependência de infraestrutura identificada.

---

## Estratégia de testes

### `useFasesAPI.test.ts`

| Cenário | Tipo |
|---|---|
| Chama `/painel` (não `/fases`) | Unit |
| Extrai `fases` de `data.fases` | Unit |
| Extrai `biblioteca` de `data.biblioteca` (se exposto) | Unit |
| Estado loading correto no carregamento | Unit |
| Normaliza `tarefas: undefined` → `[]` como fallback defensivo | Unit |

### `Painel.test.tsx`

| Cenário | Tipo |
|---|---|
| Tarefas da primeira fase aparecem na tela após load | Integration |
| Primeira fase está expandida após load | Integration |
| Não exibe skeleton durante re-fetch (fases já carregadas) | Integration |
| Re-fetch após criarTarefa mantém fases visíveis | Integration |

### `usePainelState.test.ts`

| Cenário | Tipo |
|---|---|
| Com localStorage vazio, expande a primeira fase da API | Unit |
| Com IDs antigos no localStorage, expande a primeira fase da API | Unit |
| Com ID válido no localStorage, mantém o estado | Unit |

---

## Fora de escopo

- Mudanças no backend
- Paginação ou carregamento lazy das tarefas
- Reordenação de fases ou tarefas
- Edição de tarefas existentes
- Qualquer outra feature além da exibição correta dos dados já existentes
