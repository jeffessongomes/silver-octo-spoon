# Spec: Controle de Acesso Admin por Rota

**Ticket ID:** admin-route-access-control  
**Data:** 2026-05-08  
**Status:** Rascunho

---

## Objetivo

Restringir todas as operações de escrita do painel às rotas `/{clientId}/admin`, tornando a rota `/{clientId}` somente leitura.

**Por que:** Atualmente qualquer usuário que acesse a URL pode marcar tarefas, editar observações e gerenciar a biblioteca. A separação admin/view permite compartilhar a rota de visualização sem risco de edição não autorizada.

---

## Modelo de Dados

Nenhuma alteração nas entidades de domínio existentes (`EstadoPainel`, `Fase`, `Tarefa`, `Material`).

Novo valor de contexto de runtime:

```typescript
interface AdminModeContextValue {
  isAdmin: boolean
}
```

---

## Regras de Negócio

1. Se o pathname corresponde ao padrão `/:clientId/admin`, `isAdmin = true`.
2. Se o pathname corresponde ao padrão `/:clientId` (sem `/admin`), `isAdmin = false`.
3. Quando `isAdmin = false`, as seguintes ações são bloqueadas na UI:
   - a. Marcar/desmarcar tarefa como concluída
   - b. Abrir área de observação
   - c. Editar observação
   - d. Adicionar material à Biblioteca
   - e. Deletar material da Biblioteca
4. O `clientId` é o mesmo nas duas rotas — o estado do painel (localStorage) é compartilhado entre as duas views do mesmo cliente.
5. Nenhuma autenticação/senha é exigida; a proteção é somente por URL (security by obscurity).

---

## Critérios de Aceite

**CA-1: Rota view — edições bloqueadas**
- Dado que o usuário acessa `/{clientId}`
- Quando a página carrega
- Então checkboxes de tarefas não disparam ação ao clicar
- E o botão "Adicionar observação" não está visível
- E o formulário de adicionar material não está visível
- E os botões de deletar material não estão visíveis

**CA-2: Rota admin — edições liberadas**
- Dado que o usuário acessa `/{clientId}/admin`
- Quando a página carrega
- Então checkboxes disparam toggle de tarefa ao clicar
- E o botão "Adicionar observação" está visível
- E o formulário de adicionar material está visível
- E os botões de deletar material estão visíveis

**CA-3: Estado compartilhado entre rotas**
- Dado que o admin marca uma tarefa em `/{clientId}/admin`
- Quando o usuário acessa `/{clientId}` (view)
- Então a tarefa aparece como concluída (lida do localStorage)

**CA-4: Rota desconhecida**
- Dado que o usuário acessa uma rota inválida (ex: `/foo/bar/baz`)
- Então a aplicação redireciona para `/` sem crash

---

## Edge Cases

1. **Acesso via query string** — `/{clientId}?admin=true` não concede acesso admin; somente o path segment `/admin` conta.
2. **clientId vazio** — `//admin` ou `/` não deve causar crash; `clientId` fica string vazia, painel carrega estado vazio.
3. **Troca de URL manual em runtime** — navegar de `/x/admin` para `/x` atualiza o contexto; as edições anteriores persistem no localStorage.
4. **Hidratação de estado em rota view** — `usePainelState` ainda lê/persiste estado; apenas as interações de escrita ficam bloqueadas na UI.
5. **Lista da Biblioteca em rota view** — a lista de materiais continua visível (leitura); somente form e botões de delete ficam ocultos.

---

## UI

### Rota View (`/{clientId}`)

- **TarefaItem**: checkbox renderizado sem handler de clique (sem cursor pointer, sem tabIndex interativo); botão "+ Adicionar observação" ausente do DOM; se existe observação salva, exibe como texto simples (não como textarea editável).
- **Biblioteca**: formulário de adição ausente do DOM; botão "×" de cada item ausente do DOM; lista de materiais mantida e clicável.

### Rota Admin (`/{clientId}/admin`)

- Comportamento atual preservado integralmente.

### Sem alteração em

`Filters`, `Hero`, `PainelHeader`, `AgendaSemana`, `ProgressBar`, expansão/colapso de fases.

---

## Arquitetura

### Arquivos a criar

| Arquivo | Propósito |
|---|---|
| `src/features/panel/context/AdminModeContext.tsx` | Context + Provider + `useAdminMode` hook |
| `src/features/panel/context/AdminModeContext.test.tsx` | Testes unitários do context |

### Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `package.json` | Adicionar `react-router-dom` |
| `src/App.tsx` | Envolver com `BrowserRouter` + `Routes` com `/:clientId` e `/:clientId/admin` |
| `src/features/panel/Painel.tsx` | Receber `clienteId` via `useParams()`; envolver filhos com `AdminModeProvider` passando `isAdmin` |
| `src/features/panel/hooks/usePainelState.ts` | Aceitar `clienteId` como parâmetro em vez de chamar `getClienteIdFromUrl()` internamente |
| `src/features/panel/components/TarefaItem.tsx` | Consumir `useAdminMode()`; gate em checkbox, botão obs e textarea |
| `src/features/panel/components/Biblioteca.tsx` | Consumir `useAdminMode()`; gate em form e botão delete |
| `src/test/test-utils.tsx` | Adicionar `MemoryRouter` como wrapper padrão (necessário para `useParams`) |

### Estrutura de rotas proposta — `App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import { PainelPage } from './features/panel/PainelPage'

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <Routes>
        <Route path="/:clientId" element={<PainelPage isAdmin={false} />} />
        <Route path="/:clientId/admin" element={<PainelPage isAdmin={true} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  </BrowserRouter>
)
```

> Nota: `Painel` pode ser renomeado para `PainelPage` para deixar claro que é o componente de página, não apenas um componente de UI. Isso é opcional — avaliar durante `/proj-impl`.

### AdminModeContext

```tsx
// src/features/panel/context/AdminModeContext.tsx
import { createContext, useContext, type ReactNode } from 'react'

interface AdminModeContextValue {
  isAdmin: boolean
}

const AdminModeContext = createContext<AdminModeContextValue>({ isAdmin: false })

export const AdminModeProvider = ({
  isAdmin,
  children,
}: {
  isAdmin: boolean
  children: ReactNode
}) => (
  <AdminModeContext.Provider value={{ isAdmin }}>
    {children}
  </AdminModeContext.Provider>
)

export const useAdminMode = (): AdminModeContextValue =>
  useContext(AdminModeContext)
```

### Integração em `Painel.tsx`

```tsx
export const Painel = ({ isAdmin }: { isAdmin: boolean }) => {
  const { clientId } = useParams<{ clientId: string }>()
  const { estado, dispatch } = usePainelState(clientId ?? '')
  // ...

  return (
    <AdminModeProvider isAdmin={isAdmin}>
      {/* filhos inalterados */}
    </AdminModeProvider>
  )
}
```

### Gate em `TarefaItem`

```tsx
const { isAdmin } = useAdminMode()

// checkbox: sem handler quando !isAdmin
<div
  className="task-checkbox"
  role="checkbox"
  aria-checked={concluida}
  tabIndex={isAdmin ? 0 : undefined}
  data-testid={`chk-toggle-tarefa-${tarefa.id}`}
  onClick={isAdmin ? handleCheckboxClick : undefined}
  onKeyDown={isAdmin ? handleCheckboxKeyDown : undefined}
/>

// botão obs + textarea: só renderiza em admin
{isAdmin && (
  <button ...>...</button>
)}
{isAdmin && obsAberta && (
  <textarea .../>
)}
```

### Gate em `Biblioteca`

```tsx
const { isAdmin } = useAdminMode()

// form de adição: só em admin
{isAdmin && (
  <form ...>...</form>
)}

// botão delete: só em admin
{isAdmin && (
  <button data-testid={`btn-delete-material-${item.id}`} ...>×</button>
)}
```

---

## Dependências de Infraestrutura

| Tipo | Item | Versão sugerida | Comando de instalação |
|---|---|---|---|
| Runtime | `react-router-dom` | `^7.x` | `pnpm add react-router-dom` |

> `@types/react-router-dom` não é necessário — tipos já incluídos no pacote v7.

---

## Estratégia de Testes

Seguindo `.claude/rules/react-testing.md`.

### Unit — `AdminModeContext`

- `useAdminMode()` retorna `{ isAdmin: false }` fora de um Provider
- `AdminModeProvider isAdmin={false}` → `useAdminMode().isAdmin === false`
- `AdminModeProvider isAdmin={true}` → `useAdminMode().isAdmin === true`

### Integration — `TarefaItem`

**when isAdmin is false:**
- Clicar no checkbox não chama `onToggleConcluida`
- Botão "+ Adicionar observação" não está no DOM
- Textarea de obs não está no DOM
- Se tarefa tem observação salva, texto é exibido (modo leitura)

**when isAdmin is true:**
- Comportamento atual preservado integralmente (cobre regressão nos testes existentes)

### Integration — `Biblioteca`

**when isAdmin is false:**
- Formulário de adição ausente do DOM
- Botão delete ausente do DOM
- Lista de materiais visível

**when isAdmin is true:**
- Comportamento atual preservado integralmente

### Integration — `Painel` (rota)

- Renderizado via `MemoryRouter` com `initialEntries={['/estefania']}` → `isAdmin=false`
- Renderizado via `MemoryRouter` com `initialEntries={['/estefania/admin']}` → `isAdmin=true`

### Atualizar testes existentes

Os testes de `TarefaItem` e `Biblioteca` que passarem a exigir contexto de rota devem usar o `customRender` atualizado (com `MemoryRouter`) ou um wrapper explícito com `AdminModeProvider`.

---

## Fora de Escopo

- Autenticação (login/senha/token) — proteção é somente por obscuridade de URL
- Criação/edição do conteúdo de fases, trilhas e tarefas
- Controle de acesso baseado em usuário ou sessão
- Banner ou indicador visual de "modo admin"
- Expansão/colapso de fases e controles de filtro (estado de UI sem mutação de dado)
- Qualquer alteração de layout ou estilo além do gate de elementos
