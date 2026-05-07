# Spec -- Painel Estefania (Azilab)

**Slug:** `painel-estefania`
**Origem:** conversao do HTML estatico `painel-estefania-v2.html` para React + TypeScript.

---

## Objetivo

Converter o painel HTML estatico em uma aplicacao React idiomatica, preservando 100% das funcionalidades e do visual atual. O painel e uma ferramenta interna de acompanhamento de roadmap de cliente (consultoria), com persistencia local (localStorage) e zero dependencia de backend nesta versao.

**Por que:** estabelecer a base do projeto React com uma feature real, seguindo arquitetura por features, hooks customizados, tipagem strict e cobertura de testes -- replicando a fidelidade do design original.

---

## Modelo de Dados

```typescript
// src/features/panel/types.ts

export type FaseStatus = 'done' | 'active' | 'pending'
export type FaseTipo = 'extra'
export type MaterialTipo = 'PDF' | 'PNG' | 'DOC' | 'XLS' | 'LINK' | 'VIDEO'

export interface Tarefa {
  id: string
  texto: string
}

export interface Material {
  nome: string
  tipo: MaterialTipo
  url: string  // string vazia ou '#' = pendente
}

export interface Fase {
  id: string
  numero: string                    // 'Fase 01 · Mes 1'
  titulo: string
  resumo: string
  status: FaseStatus
  tipo?: FaseTipo                   // marca visual diferenciada
  tarefas: Tarefa[]
  materiais: Material[]
}

export interface BibliotecaItem extends Material {}

export interface DadosPainel {
  cliente: string                   // ex: 'estefania'
  fases: Fase[]
  biblioteca: BibliotecaItem[]
}

export interface EstadoPainel {
  tarefas: Record<string, boolean>          // { 't1-1': true, ... }
  observacoes: Record<string, string>       // { 't1-1': 'texto livre' }
  expandidas: string[]                      // [faseId]
  obsAbertas: string[]                      // [tarefaId]
}

export type FiltroTarefas = 'todas' | 'pendentes' | 'concluidas'
```

---

## Regras de Negocio

### Status visual da fase (derivado, nao da `status` original)

```
concluidas === total && total > 0  -> 'done'
concluidas > 0                     -> 'active'
caso contrario                     -> 'pending'
```

Ou seja: o `fase.status` da data e apenas o estado inicial; o status visual e calculado a cada render a partir das tarefas concluidas.

### Material pendente

`material.url === '' || material.url === '#'` -> exibir como "Em breve" (visual de pendente, nao clicavel).

### Tarefas pre-concluidas (estado inicial)

IDs marcados como concluidos na primeira execucao (se nao existirem em `localStorage`):
`['t0-1','t0-2','t0-3','t0-4','t0-5','t1-1','t1-2','t1-3']`

### Fase inicial expandida

Se `expandidas.length === 0` na hidratacao, expandir `fase-1` por padrao.

### Persistencia

- `localStorage` key: `painel_${cliente}` (ex: `painel_estefania`)
- Estado salvo: `EstadoPainel` completo
- Salvamento de toggles (tarefa, fase, observacao aberta) e imediato
- Salvamento de texto da observacao e debounced em 400ms com feedback visual:
  - "Salvando..." durante o debounce
  - "Salvo" apos persistencia
  - Status some apos 1.5s

### Filtro de tarefas

`todas` | `pendentes` | `concluidas` -- afeta apenas exibicao (CSS `display: none`), nao remove do DOM/estado.

### Toast global

Aparece ao concluir tarefa (mensagem "Tarefa concluida"), 1.8s de duracao.

---

## Criterios de Aceite

**CA1** -- Renderizacao fiel
> **Dado** que o usuario abre o painel
> **Quando** a pagina carrega
> **Entao** o layout (grid 1fr 320px), tipografia (Fraunces + Inter), paleta e espacamentos correspondem 1:1 ao HTML original

**CA2** -- Toggle de tarefa
> **Dado** uma tarefa nao concluida
> **Quando** o usuario clica no checkbox
> **Entao** a tarefa fica marcada com risco no texto, contador da fase incrementa, contador geral incrementa, toast "Tarefa concluida" aparece, estado persiste em localStorage

**CA3** -- Toggle de fase (expansao)
> **Dado** uma fase colapsada
> **Quando** o usuario clica no header da fase
> **Entao** a fase expande mostrando tarefas + materiais, icone de toggle rotaciona 180deg, estado persiste

**CA4** -- Observacao em tarefa
> **Dado** uma tarefa
> **Quando** o usuario abre o campo de observacao e digita
> **Entao** apos 400ms o texto e salvo em localStorage, status mostra "Salvando..." -> "Salvo" -> some apos 1.5s, e o botao toggle muda de "+ Adicionar observacao" para "x Observacao"

**CA5** -- Filtro de tarefas
> **Dado** o painel com tarefas concluidas e pendentes
> **Quando** o usuario clica no botao "Pendentes"
> **Entao** apenas tarefas nao concluidas ficam visiveis em todas as fases expandidas

**CA6** -- Material pendente
> **Dado** um material com `url` vazia ou `'#'`
> **Quando** ele e renderizado
> **Entao** aparece com estilo "pendente" (opacidade reduzida, badge "Em breve"), nao e clicavel

**CA7** -- Status visual da fase (derivado)
> **Dado** uma fase com 5 tarefas
> **Quando** o usuario marca todas as 5
> **Entao** o badge da fase muda para "Concluida" (cor verde) automaticamente; tambem reflete no marcador da trilha

**CA8** -- Persistencia entre sessoes
> **Dado** o usuario marcou tarefas e abriu fases
> **Quando** ele recarrega a pagina
> **Entao** o estado e restaurado completamente do localStorage

**CA9** -- Estado inicial
> **Dado** primeiro acesso (localStorage vazio)
> **Quando** a pagina carrega
> **Entao** as tarefas pre-concluidas (t0-1 a t0-5, t1-1 a t1-3) ja aparecem marcadas, fase-1 ja expandida, contador geral correto

**CA10** -- Responsivo
> **Dado** viewport <= 920px
> **Quando** o painel renderiza
> **Entao** layout vira coluna unica (sidebar abaixo do conteudo) e mantem legibilidade

---

## Edge Cases

1. **localStorage indisponivel** (modo privado em alguns browsers): o app deve funcionar em memoria; nao crashar.
2. **Tarefa concluida com observacao** -- riscar texto mas manter botao de observacao funcional.
3. **Fase sem materiais** (`materiais.length === 0`) -- nao renderizar a secao "Materiais desta fase".
4. **Fase com `tipo: 'extra'`** -- aplicar estilo diferenciado (marrom) no marcador da trilha + badge "Extra" no header.
5. **JSON invalido em localStorage** -- fallback para estado inicial limpo, sem crash.
6. **Click no checkbox** nao deve disparar toggle da fase (event.stopPropagation).
7. **Multiplos saves simultaneos** de observacao em tarefas diferentes -- debounce por `tarefaId`, nao global.
8. **Tarefa com id duplicado** -- a regra do HTML original e ids unicos; nao validamos em runtime nesta versao.

---

## UI

### Layout

- Grid 2 colunas (`1fr 320px`) com 48px de gap, max-width 1280px, centralizado
- Header full-width com border-bottom
- Main: hero + filtros + trilha
- Sidebar: agenda (card escuro) + biblioteca

### Componentes principais

| Componente | Responsabilidade |
|---|---|
| `<Painel />` | Composicao raiz da feature; provider do estado |
| `<PainelHeader />` | Brand + meta (data, cliente) |
| `<Hero />` | Eyebrow + titulo + descricao + barra de progresso geral |
| `<ProgressBar />` | Barra de progresso reutilizavel |
| `<Filters />` | Botoes Todas/Pendentes/Concluidas |
| `<Trilha />` | Lista vertical de fases com linha conectora |
| `<Fase />` | Card de fase com header (numero, status, badge), conteudo expansivel (tarefas + materiais) |
| `<TarefaItem />` | Checkbox + texto + botao de observacao + textarea |
| `<MaterialCard />` | Link ou estado pendente |
| `<Sidebar />` | Container da sidebar |
| `<AgendaSemana />` | Card escuro com itens da semana |
| `<Biblioteca />` | Lista de itens da biblioteca |
| `<Toast />` | Feedback global (portal/fixed) |

### Estados visuais

- Fase: `done` (verde) | `active` (laranja com glow) | `pending` (cinza) | `extra` (marrom)
- Tarefa: nao concluida | concluida (riscada)
- Material: ativo | pendente
- Observacao status: idle | saving | saved | hidden

---

## Arquitetura

### Estrutura de arquivos (a criar)

```
src/
  App.tsx                                 # render <Painel />
  index.css                               # tokens (variaveis CSS)
  features/
    panel/
      Painel.tsx                          # raiz da feature (compose subcomponentes)
      Painel.css                          # estilos da feature (port direto do <style>)
      data.ts                             # dadosPainel (constante)
      types.ts                            # types compartilhados
      hooks/
        usePainelState.ts                 # useReducer + persistencia + tarefas pre-concluidas
        useDebouncedSave.ts               # debounce + status visual (saving/saved)
        useFiltro.ts                      # estado do filtro ativo
        usePainelStats.ts                 # totais e progresso geral derivados
      components/
        PainelHeader.tsx
        Hero.tsx
        ProgressBar.tsx
        Filters.tsx
        Trilha.tsx
        Fase.tsx
        TarefaItem.tsx
        MaterialCard.tsx
        Sidebar.tsx
        AgendaSemana.tsx
        Biblioteca.tsx
  components/
    Toast.tsx                             # generico (Provider + hook)
    Toast.css
  hooks/
    useToast.ts                           # consumidor do contexto do Toast
  lib/
    storage.ts                            # wrapper localStorage (try/catch + fallback memoria)
  constants/
    storage-keys.ts
```

### Decisoes-chave

1. **Estado**: `useReducer` em `usePainelState` (acoes: `toggleTarefa`, `toggleFase`, `toggleObs`, `setObservacao`). Reducer puro, testavel isoladamente.
2. **Persistencia**: middleware no reducer (state -> localStorage no proximo tick via `useEffect`). Wrapper `lib/storage.ts` com try/catch.
3. **Toast**: Context API com Provider em `App.tsx`. `useToast()` retorna `showToast(msg)`.
4. **Filtro**: estado local em `<Painel />`, nao persistido (igual ao original). Aplica via classe condicional no `<TarefaItem />` (`display: none` via prop -- nao desmonta o DOM, igual ao original).
5. **Progresso**: derivado puro a partir de `dadosPainel` + `estado.tarefas` em hook `usePainelStats`.
6. **Status visual da fase**: tambem derivado, calculado em `<Fase />` ou em util `getStatusVisual(fase, tarefasConcluidas)`.
7. **Estilos**: 1 CSS global por feature (`Painel.css`) -- port literal das classes do HTML. CSS Modules adicionaria atrito desnecessario nesta primeira versao.
8. **Imutabilidade**: spreads/Object.assign no reducer; nunca mutar.

### Aderencia a `react-practices.md`

- TypeScript strict, sem `any`
- Imutabilidade no reducer
- `data-testid` em todos os elementos interativos (formato `type-action-component`)
- Hooks `use*` retornando objetos nomeados quando >1 valor
- Zero hardcoded de URLs (dados em `data.ts`); nenhuma URL externa fora dos materiais (que sao strings de dados)
- Estrutura `features/panel/` agrupando codigo por dominio

---

## Estrategia de Testes

Seguir `react-testing.md` rigorosamente.

### Unit (hooks puros)

| Hook | Cenarios |
|---|---|
| `usePainelState` | toggleTarefa marca/desmarca; toggleFase adiciona/remove de expandidas; setObservacao atualiza obs; persiste em localStorage; hidrata corretamente; aplica tarefas pre-concluidas no primeiro acesso |
| `useDebouncedSave` | debounce dispara apos 400ms; reset com nova chamada; status passa por saving -> saved -> hidden |
| `usePainelStats` | calcula total e concluidas corretamente |

### Integracao (componentes)

| Componente | Cenarios |
|---|---|
| `<Painel />` | renderiza header, hero, filtros, trilha, sidebar; estado inicial restaura tarefas pre-concluidas |
| `<TarefaItem />` | toggle do checkbox marca/desmarca + dispara toast; abrir observacao revela textarea; digitar mostra "Salvando..." -> "Salvo" |
| `<Fase />` | click no header expande/colapsa; status visual derivado correto (done quando todas marcadas); badge "Extra" quando `tipo === 'extra'`; secao de materiais nao renderiza se vazia |
| `<Filters />` | click muda filtro ativo; estado refletido em tarefas escondidas |
| `<MaterialCard />` | renderiza como link quando `url` valida; renderiza como pendente quando vazio/'#' |
| `<Biblioteca />` | mesma logica de pendente/ativo |
| `<ProgressBar />` | width = (concluidas / total) * 100% |

### data-testid (formato `type-action-component`)

```
btn-toggle-fase-{faseId}
chk-toggle-tarefa-{tarefaId}
btn-toggle-obs-{tarefaId}
input-edit-obs-{tarefaId}
btn-filter-{filtroNome}
link-open-material-{slugDoMaterial}
link-open-biblioteca-{slugDoItem}
```

### Smoke test inicial (proj-impl Phase 4 RED)

Reescreve `App.test.tsx` para testar a renderizacao do `<Painel />` (substitui o teste do counter atual).

---

## Dependencias de Infraestrutura

| Dependencia | Servico | Responsavel | Observacao |
|---|---|---|---|
| Google Fonts (Fraunces + Inter) | `fonts.googleapis.com` | -- | Adicionado via `<link>` no `index.html` (preconnect + stylesheet), igual ao original |

Nenhuma lib nova precisa ser instalada -- o boilerplate atual (React 19 + Vite + Vitest + RTL) cobre tudo.

Variaveis de ambiente: nenhuma nesta versao.

---

## Fora de Escopo

- Backend / API (estado e 100% local)
- Multi-cliente (apenas `estefania`; arquitetura pronta pra extensao mas nao implementada)
- Edicao de fases/tarefas via UI (atualmente apenas leitura via `data.ts`; admin edita o codigo)
- Autenticacao
- Internacionalizacao (pt-BR fixo)
- Animacoes alem das ja presentes no HTML original
- Tema claro/escuro alternavel (mantem o tema atual)
- Acessibilidade alem do baseline (nao haverao testes axe nesta versao)
- Mobile-first redesign (mantem os 2 breakpoints do original: 920px e 600px)

---

## Plano de Execucao (preview do proj-impl)

1. Tipos + dados (`types.ts`, `data.ts`, `constants/storage-keys.ts`)
2. `lib/storage.ts` com testes (try/catch, JSON parse fallback)
3. `usePainelState` reducer + testes (RED-GREEN)
4. `useDebouncedSave` + testes
5. `useToast` + `<Toast />` + testes
6. Componentes folha: `<ProgressBar />`, `<MaterialCard />`, `<TarefaItem />`, `<Filters />`, `<AgendaSemana />`, `<Biblioteca />` -- com testes
7. Componentes container: `<Fase />`, `<Trilha />`, `<Sidebar />`, `<Hero />`, `<PainelHeader />`
8. `<Painel />` raiz + teste de integracao
9. Estilos: `Painel.css` (port direto) + `index.css` (tokens) + `Toast.css`
10. Reescrever `App.tsx` para `<ToastProvider><Painel /></ToastProvider>`
11. Substituir `App.test.tsx` por teste de integracao
12. Validacao final: `pnpm lint && pnpm type-check && pnpm test && pnpm build`
