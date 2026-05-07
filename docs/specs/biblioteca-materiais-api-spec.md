# Spec -- Biblioteca Materiais de Consulta (API Integration)

**Slug:** `biblioteca-materiais-api`
**Origem:** integração do componente `Biblioteca.tsx` com o backend REST já existente, substituindo dados hardcoded por dados reais do SQLite, com formulário inline de adição.

---

## Objetivo

Conectar a Biblioteca de Materiais de Consulta (sidebar do Painel) ao backend REST, eliminando os dados hardcoded de `data.ts`. O componente passa a buscar, exibir e criar materiais via API, usando axios como cliente HTTP.

**Por que:** o backend já está implementado e funcional (rotas `GET /biblioteca`, `POST /biblioteca`, `DELETE /materiais/:id`), mas o frontend ainda consome dados estáticos. Essa integração fecha o ciclo e permite que materiais reais sejam gerenciados sem deploy de código.

---

## Modelo de Dados

### Tipos existentes (src/features/panel/types.ts) — sem alteração

```typescript
export type MaterialTipo = 'PDF' | 'PNG' | 'DOC' | 'XLS' | 'LINK' | 'VIDEO'

export interface Material {
  nome: string
  tipo: MaterialTipo
  url: string  // '' ou '#' = pendente
}

export type BibliotecaItem = Material
```

### Novos tipos a adicionar (src/features/panel/types.ts)

```typescript
// Resposta da API: Material com id persistido
export interface MaterialAPI {
  id: string
  nome: string
  tipo: MaterialTipo
  url: string
  cliente_id: string
  fase_id: string | null
  ordem: number
}

// Payload do formulário de criação
export interface CriarMaterialInput {
  nome: string
  tipo: MaterialTipo
  url: string
}
```

> `MaterialAPI` mapeia diretamente a `MaterialRow` do backend. O frontend usa `MaterialAPI` internamente no hook e converte para `Material` (sem `id`) onde necessário para compatibilidade com `MaterialCard` já existente.

---

## Regras de Negócio

1. **clienteId fixo:** `"estefania"` — extrair como constante `CLIENTE_ID` em `src/constants/storage-keys.ts` (já existe o arquivo).
2. **Validação de nome:** obrigatório, mínimo 2 caracteres, máximo 80.
3. **Validação de tipo:** obrigatório, deve ser um dos valores de `MaterialTipo`.
4. **Validação de URL:** obrigatória, deve começar com `http://` ou `https://`. URLs vazias ou `'#'` não são aceitas no formulário (apenas materiais já cadastrados podem ter URL pendente).
5. **Duplo submit:** botão "Adicionar" é desabilitado enquanto o POST estiver em andamento.
6. **Pós-criação:** formulário é limpo (reset) e a lista é refetchada automaticamente.
7. **Material pendente:** materiais retornados pela API com `url === ''` ou `url === '#'` são exibidos no estado visual degradado (opacidade 0.6, cursor not-allowed) — mantendo o comportamento atual.
8. **Erro de rede (GET):** exibir mensagem de erro com botão de retry; não ocultar a lista anterior se já havia sido carregada.
9. **Erro de criação (POST):** exibir mensagem de erro inline no formulário; não fechar nem resetar o form.
10. **Deleção (nice-to-have):** confirmar via clique simples em botão "×" no item; fazer `DELETE /api/clientes/:clienteId/materiais/:id`; remover da lista localmente sem refetch.

---

## Critérios de Aceite

### CA-01 — Listagem inicial
- **Dado** que o usuário abre o painel
- **Quando** o componente `Biblioteca` é montado
- **Então** é feito `GET /api/clientes/estefania/biblioteca` e a lista de materiais retornada é exibida

### CA-02 — Estado de carregamento
- **Dado** que a requisição GET está em andamento
- **Quando** `loading === true`
- **Então** são exibidos 3 itens skeleton animados no lugar da lista

### CA-03 — Erro de rede (listagem)
- **Dado** que o GET retornou erro (rede ou 5xx)
- **Quando** `error !== null` e `lista.length === 0`
- **Então** é exibida a mensagem "Erro ao carregar materiais" e o botão "Tentar novamente"

### CA-04 — Retry após erro
- **Dado** que o estado de erro está visível
- **Quando** o usuário clica em "Tentar novamente"
- **Então** o GET é refeito e o estado retorna para loading → lista ou erro

### CA-05 — Lista vazia
- **Dado** que o GET retornou `[]`
- **Quando** `lista.length === 0` e `loading === false`
- **Então** é exibido o texto "Nenhum material adicionado ainda."

### CA-06 — Formulário desabilitado com campos inválidos
- **Dado** que algum campo do formulário está inválido (nome vazio, URL sem protocolo, tipo não selecionado)
- **Quando** o botão "Adicionar" é renderizado
- **Então** o botão permanece desabilitado (`disabled`)

### CA-07 — Criação de material (sucesso)
- **Dado** que todos os campos estão válidos
- **Quando** o usuário clica em "Adicionar"
- **Então** é feito `POST /api/clientes/estefania/biblioteca` com `{ nome, tipo, url }`, o botão mostra estado de loading, e ao sucesso: form é limpo e a lista é atualizada com o novo item

### CA-08 — Criação de material (erro)
- **Dado** que o POST retornou erro (rede ou 4xx/5xx)
- **Quando** o submit falha
- **Então** uma mensagem de erro é exibida abaixo do formulário e o form não é resetado

### CA-09 — Material pendente na lista
- **Dado** que um material retornado pela API tem `url === ''` ou `url === '#'`
- **Quando** esse item é renderizado
- **Então** é exibido com `opacity: 0.6` e `cursor: not-allowed`, sem link clicável

### CA-10 — Material ativo na lista
- **Dado** que um material tem URL válida (`http://...` ou `https://...`)
- **Quando** esse item é renderizado
- **Então** é exibido como link clicável com `target="_blank"` e `rel="noopener noreferrer"`

### CA-11 — Deleção de material (nice-to-have)
- **Dado** que a lista tem pelo menos um material
- **Quando** o usuário clica no botão "×" de um item
- **Então** é feito `DELETE /api/clientes/estefania/materiais/:id`, o item é removido da lista sem refetch completo

---

## Edge Cases

1. **URL sem protocolo:** `"google.com"` não passa na validação — exibir hint "URL deve começar com http:// ou https://".
2. **Duplo clique em "Adicionar":** segundo clique ignorado pois botão fica `disabled` durante o POST.
3. **Backend offline ao iniciar:** CA-03 é acionado imediatamente no mount.
4. **Material criado com URL vazia via API (direto no banco):** exibido como pendente sem quebrar a UI.
5. **Nome com caracteres especiais ou acentos:** `slugify()` existente garante `data-testid` válido.
6. **Lista com muitos itens (>15):** sidebar tem altura fixa com `overflow-y: auto` — verificar scroll.
7. **Refetch após deleção do último item:** CA-05 (empty state) é exibido corretamente.
8. **Timeout da requisição:** axios padrão espera infinitamente — definir `timeout: 10_000` na instância.
9. **clienteId com caracteres especiais na URL:** não aplicável nesse escopo (`"estefania"` é fixo e seguro).
10. **Formulário submetido com Enter:** `onSubmit` do `<form>` deve ser tratado igualmente ao clique no botão.

---

## UI — Estados Visuais e Comportamentos

### Layout do componente (sidebar-section)

```
┌─────────────────────────────────────┐
│ Biblioteca                          │  ← .sidebar-title
│ MATERIAIS DE CONSULTA               │  ← .sidebar-subtitle
├─────────────────────────────────────┤
│ [input: nome do material          ] │  ← input[type=text]
│ [select: tipo ▼] [input: url      ] │  ← linha 2 do form
│ [           Adicionar             ] │  ← button submit
│ ← mensagem de erro do form (se há) →│
├─────────────────────────────────────┤
│  PDF  · Nome do material            │  ← .biblioteca-item (link)
│  XLS  · Planilha de modelo          │  ← .biblioteca-item (link)
│  DOC  · Briefing ░░░░░░░░░░░        │  ← .biblioteca-item (pendente)
└─────────────────────────────────────┘
```

### Estado: loading
- 3 linhas skeleton com animação `@keyframes pulse` (opacity 0.4 → 0.7 → 0.4)
- Dimensões iguais a um `.biblioteca-item` real
- `data-testid="skeleton-biblioteca"`

### Estado: erro de listagem
- Texto: `"Erro ao carregar materiais"`
- Botão: `"Tentar novamente"` com `data-testid="btn-retry-biblioteca"`
- Estilo: mesma paleta do projeto (cor `--ink-mute` para o texto)

### Estado: lista vazia
- Texto: `"Nenhum material adicionado ainda."`
- `data-testid="empty-biblioteca"`
- Estilo: `font-size: 13px; color: var(--ink-mute); padding: 8px 0`

### Formulário
- Campos: todos inline no `.sidebar-section`, acima da lista
- Separador visual: `border-top: 1px solid var(--line)` entre form e lista
- **Campo nome:** `<input type="text" placeholder="Nome do material" data-testid="input-nome-material">`
- **Campo tipo:** `<select data-testid="sel-tipo-material">` com `<option>` para cada `MaterialTipo`; primeira opção: `"-- tipo --"` com `value=""`
- **Campo url:** `<input type="url" placeholder="https://..." data-testid="input-url-material">`
- **Botão:** `<button type="submit" data-testid="btn-submit-material">` — texto `"Adicionar"` em idle, `"Salvando..."` durante POST
- **Erro do form:** `<p role="alert" data-testid="error-form-biblioteca">mensagem</p>` abaixo do botão

### Design das classes CSS novas (a adicionar em Painel.css)

```css
/* Formulário da Biblioteca */
.biblioteca-form { ... }               /* flex-col, gap: 8px, margin-bottom: 16px */
.biblioteca-form-row { ... }           /* flex, gap: 8px (tipo + url na mesma linha) */
.biblioteca-form input,
.biblioteca-form select { ... }        /* padding 8px, border 1px solid var(--line), border-radius 3px, font-size 13px */
.biblioteca-form input:focus,
.biblioteca-form select:focus { ... }  /* outline accent */
.biblioteca-form button { ... }        /* background var(--accent), color white, border-radius 3px */
.biblioteca-form button:disabled { ... } /* opacity 0.5, cursor not-allowed */
.biblioteca-form-error { ... }         /* color var(--accent), font-size 12px */

/* Skeleton */
.biblioteca-skeleton { ... }           /* border-radius 3px, animation pulse */
@keyframes pulse { ... }

/* Empty state */
.biblioteca-empty { ... }              /* font-size 13px, color var(--ink-mute) */

/* Separador form / lista */
.biblioteca-divider { ... }            /* border-top var(--line), margin: 12px 0 */
```

---

## Arquitetura

### Arquivos a CRIAR

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/api.ts` | Instância axios com `baseURL` e `timeout: 10_000` |
| `src/features/panel/hooks/useBiblioteca.ts` | Hook: listagem (GET), criação (POST), deleção (DELETE) |
| `src/features/panel/hooks/useBiblioteca.test.ts` | Testes unitários do hook (mock axios) |

### Arquivos a MODIFICAR

| Arquivo | O que muda |
|---|---|
| `src/features/panel/types.ts` | Adicionar `MaterialAPI` e `CriarMaterialInput` |
| `src/features/panel/components/Biblioteca.tsx` | Self-contained: consome `useBiblioteca`, exibe form + lista + estados |
| `src/features/panel/components/Biblioteca.test.tsx` | Atualizar/criar testes (mock do hook, todos os estados) |
| `src/features/panel/components/Sidebar.tsx` | Remover prop `biblioteca: BibliotecaItem[]` |
| `src/features/panel/Painel.tsx` | Remover passagem de `dadosPainel.biblioteca` para `<Sidebar>` |
| `src/features/panel/Painel.css` | Adicionar estilos do form, skeleton, empty state |
| `src/constants/storage-keys.ts` | Adicionar `CLIENTE_ID = 'estefania'` |

### Fluxo de dados pós-implementação

```
Painel.tsx
└── Sidebar.tsx (sem prop biblioteca)
    └── Biblioteca.tsx  ← self-contained
        └── useBiblioteca('estefania')
            └── src/lib/api.ts (axios instance)
                └── GET  /api/clientes/estefania/biblioteca
                └── POST /api/clientes/estefania/biblioteca
                └── DELETE /api/clientes/estefania/materiais/:id
```

### Interface do hook `useBiblioteca`

```typescript
interface UseBibliotecaResult {
  materiais: MaterialAPI[]
  loading: boolean
  error: string | null
  submitting: boolean
  submitError: string | null
  fetchBiblioteca: () => Promise<void>
  criarMaterial: (input: CriarMaterialInput) => Promise<void>
  deletarMaterial: (id: string) => Promise<void>
}

function useBiblioteca(clienteId: string): UseBibliotecaResult
```

### Interface de `src/lib/api.ts`

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})
```

---

## Dependências de Infraestrutura

| Pacote / Config | Versão | Motivo | Ação |
|---|---|---|---|
| `axios` | `^1.7.x` | Cliente HTTP para consumir o backend | `pnpm add axios` |
| `VITE_API_URL` | `http://localhost:3000` | URL do backend (dev) | Criar `.env` na raiz do frontend |

**Arquivo `.env` a criar na raiz do frontend (`silver-octo-spoon/`):**
```env
VITE_API_URL=http://localhost:3000
```

> O backend roda na porta 3000 conforme `backend/.env.example`.

---

## Estratégia de Testes

Ver convenções em `.claude/rules/react-testing.md`.

### `useBiblioteca.test.ts` — testes do hook

| Cenário | Tipo | Ferramenta |
|---|---|---|
| GET retorna lista → `materiais` populado | Unit | `vi.mock('axios')` ou mock da instância `api` |
| GET retorna erro → `error` populado | Unit | mock rejeitado |
| POST sucesso → `materiais` atualizado, form resettado | Unit | mock resolvido |
| POST erro → `submitError` populado | Unit | mock rejeitado |
| `fetchBiblioteca` após erro → estado limpo | Unit | mock resolvido após rejeitado |
| DELETE sucesso → item removido de `materiais` | Unit | mock resolvido |

### `Biblioteca.test.tsx` — testes de integração do componente

| Cenário | `data-testid` principal |
|---|---|
| Exibe skeleton durante loading | `skeleton-biblioteca` |
| Exibe lista após GET bem-sucedido | `list-biblioteca` |
| Exibe erro + botão retry após GET falhar | `btn-retry-biblioteca` |
| Retry chama fetchBiblioteca | `btn-retry-biblioteca` (click) |
| Exibe empty state quando lista vazia | `empty-biblioteca` |
| Botão Adicionar desabilitado com form inválido | `btn-submit-material` |
| Botão Adicionar habilitado com form válido | `btn-submit-material` |
| Submit chama criarMaterial com dados corretos | `btn-submit-material` (click) |
| Botão mostra "Salvando..." durante POST | `btn-submit-material` |
| Form é limpo após criação bem-sucedida | `input-nome-material` |
| Exibe erro do form após POST falhar | `error-form-biblioteca` |
| Item com URL válida → link clicável | `link-open-biblioteca-{slug}` |
| Item com URL vazia → item pendente | `item-pending-biblioteca-{slug}` |
| Clique em "×" chama deletarMaterial (nice-to-have) | `btn-delete-material-{id}` |

**Mock do hook nos testes de componente:**

```typescript
const { mockUseBiblioteca } = vi.hoisted(() => ({
  mockUseBiblioteca: vi.fn<[string], ReturnType<typeof useBiblioteca>>(),
}))

vi.mock('../hooks/useBiblioteca', () => ({
  useBiblioteca: mockUseBiblioteca,
}))
```

**Factories de fixture:**

```typescript
const createMaterialAPI = (overrides?: Partial<MaterialAPI>): MaterialAPI => ({
  id: 'mat-001',
  nome: 'Guia de Fonética',
  tipo: 'PDF',
  url: 'https://exemplo.com/fonetica.pdf',
  cliente_id: 'estefania',
  fase_id: null,
  ordem: 0,
  ...overrides,
})

const createMaterialPendente = () => createMaterialAPI({ url: '', nome: 'Planilha em breve' })
```

---

## Fora de Escopo

- **Edição de material existente** (PATCH `/materiais/:id`) — não será implementado nesta iteração
- **Materiais de fase** (POST `/fases/:faseId/materiais`) — biblioteca global apenas
- **Autenticação / autorização** — não há auth no frontend ainda
- **Paginação ou busca** da lista
- **Upload de arquivo** — apenas URL externa
- **Reordenação** (drag & drop) de materiais
- **Toast de confirmação** após criar/deletar — pode ser adicionado em iteração futura reaproveitando o `useToast` existente (mencionado como sugestão, fora do escopo)
- **Variável de ambiente de produção** (`VITE_API_URL` para staging/prod)
