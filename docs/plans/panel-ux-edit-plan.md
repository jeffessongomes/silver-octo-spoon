# Plano de Implementação — panel-ux-edit

**Spec:** docs/specs/panel-ux-edit-spec.md  
**Branch:** feat/admin-manage-content  
**Data:** 2026-05-09

---

## Decisões de Implementação

- `useDebouncedSave` não será modificado. Debounce para texto usa `useRef<ReturnType<typeof setTimeout>>` diretamente no componente.
- Status de save é otimista: `salvando...` → `salvo` (sem propagação de erro — igual ao padrão das observações).
- Edição inline só ativa quando `isAdmin && onEdit` existe — clique por não-admin não abre o input.
- Blur fecha o modo de edição após salvar (ou cancelar se texto inválido).

---

## Task 1 — TarefaItem: edição inline (TDD)

**Arquivos:** `src/features/panel/components/TarefaItem.tsx` + `TarefaItem.test.tsx`

### RED — testes novos

Substituir bloco `describe('admin actions — edit tarefa')` pelos seguintes testes:

```
describe('when admin clicks on task text', () => {
  it('should show input with current text')
  it('should not open edit mode when not admin')
  it('should not open edit mode when onEdit is not provided')
})

describe('when editing task text', () => {
  it('should show saving indicator while debounce is pending')
  it('should call onEdit after debounce delay with valid text')
  it('should not call onEdit when text is unchanged')
  it('should not call onEdit when text has fewer than 3 chars')
  it('should call onEdit immediately on blur with valid text')
  it('should not call onEdit on blur when text is invalid')
  it('should cancel and restore original text on Escape')
  it('should close edit mode after saving on blur')
})
```

### GREEN — implementação

**Remover de TarefaItem.tsx:**
- Estados: `editando`, `editTexto`
- `inputRef` (era para autoFocus do botão Editar)
- Handlers: `handleIniciarEdicao`, `handleCancelarEdicao`, `handleConfirmarEdicao`, `handleEditKeyDown`
- `isEditValid`
- JSX: botão "Editar", div `.task-edit-row` com input + botões "Salvar"/"Cancelar"

**Adicionar:**
- Estados: `isEditingTexto: boolean`, `editTextoValue: string`, `editSaveStatus: 'idle' | 'saving' | 'saved'`
- Ref: `editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)`
- Constante: `EDIT_DEBOUNCE_MS = 600`
- Handler `handleTextoClick` — abre edit mode se `isAdmin && onEdit`
- Handler `handleTextoChange` — atualiza valor + agenda debounce se válido
- Handler `handleTextoBlur` — cancela debounce + salva imediatamente se válido + fecha edit mode
- Handler `handleTextoKeyDown` — Escape cancela; Enter dispara blur
- Substituir `<div className="task-text">` por elemento clicável condicionalmente

**Lógica de validação:**
```
const isTextoValido = (t: string) => t.trim().length >= 3 && t.trim() !== tarefa.texto
```

**Indicador de status:** renderizado próximo ao input quando `isEditingTexto`

**data-testid:** `input-edit-tarefa-{id}`, `status-edit-tarefa-{id}`

### VERIFY
```bash
pnpm test src/features/panel/components/TarefaItem.test.tsx
pnpm lint && pnpm type-check
```

---

## Task 2 — TarefaItem: confirmação de delete (TDD)

**Arquivos:** `src/features/panel/components/TarefaItem.tsx` + `TarefaItem.test.tsx`  
(mesma sessão de edição da Task 1)

### RED — testes novos

Substituir bloco `describe('admin actions — delete tarefa')`:

```
describe('when admin clicks delete', () => {
  it('should show confirmation dialog')
  it('should not call onDelete directly on click')
  it('should call onDelete when "Sim, excluir" is clicked')
  it('should hide dialog without calling onDelete when "Cancelar" is clicked')
  it('should not render delete button when not admin')
  it('should not render delete button when onDelete not provided')
})
```

### GREEN — implementação

**Adicionar:**
- Estado: `confirmandoDelete: boolean`
- Handler `handleDeleteClick` → `setConfirmandoDelete(true)`
- Handler `handleConfirmarDelete` → `onDelete(tarefa.id); setConfirmandoDelete(false)`
- Handler `handleCancelarDelete` → `setConfirmandoDelete(false)`
- JSX: mini-diálogo inline renderizado dentro de `.task-content` quando `confirmandoDelete`

**data-testid:**
- `btn-delete-tarefa-{id}` (mantido — apenas muda o comportamento do click)
- `dialog-confirm-delete-tarefa-{id}`
- `btn-confirm-delete-tarefa-{id}`
- `btn-cancel-delete-tarefa-{id}`

**Remover:**
- Click direto em `onDelete` no botão "Excluir"

### VERIFY
```bash
pnpm test src/features/panel/components/TarefaItem.test.tsx
```

---

## Task 3 — Fase: redesign visual de botões

**Arquivos:** `src/features/panel/components/Fase.tsx` + `Fase.test.tsx`

### Mudanças em Fase.tsx

**Botões de admin no header (Editar / Excluir):**
- `admin-action-btn` → `admin-action-btn admin-action-btn--secondary`
- `admin-action-btn admin-action-btn--danger` → `admin-action-btn admin-action-btn--danger` (sem mudança, mas revisar estilo)

**Formulário de edição:**
- Reordenar: Cancelar antes de Salvar
- `admin-btn` (Salvar) → `admin-btn admin-btn--primary`
- `admin-btn admin-btn--secondary` (Cancelar) → `admin-btn admin-btn--ghost`

**Diálogo de confirmação de delete:**
- `admin-btn admin-btn--danger` (Confirmar) → mantido
- `admin-btn admin-btn--secondary` (Cancelar) → `admin-btn admin-btn--ghost`

Nenhum `data-testid` muda → testes de Fase.test.tsx passam sem alteração.

### VERIFY
```bash
pnpm test src/features/panel/components/Fase.test.tsx
pnpm lint && pnpm type-check
```

---

## Task 4 — Validação Final

```bash
pnpm test
pnpm lint
pnpm type-check
pnpm build
```

Testar manualmente em `pnpm dev`:
- [ ] Clicar no texto de uma tarefa abre o input
- [ ] Digitar texto válido → salvar automaticamente após 600ms
- [ ] Clicar fora → salva imediatamente
- [ ] Escape → cancela e restaura texto
- [ ] Clicar em Excluir → mostra diálogo de confirmação
- [ ] Confirmar → exclui; Cancelar → fecha diálogo
- [ ] Não-admin: sem botão Excluir, sem edição inline
