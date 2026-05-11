# Plano de Implementação: admin-manage-content

**Branch:** `feat/admin-manage-content`  
**Spec:** `docs/specs/admin-manage-content-spec.md`  
**Data:** 2026-05-09

---

## Visão geral das tasks

| # | Task | Arquivos | Status |
|---|---|---|---|
| 1 | Tipos + backend material id | `types.ts`, `backend/shared/types.ts`, `PainelService.ts` | pending |
| 2 | useTarefasAPI — editarTarefa + deletarTarefa | `useTarefasAPI.ts`, `.test.ts` | pending |
| 3 | useFasesAPI — editarFase + deletarFase | `useFasesAPI.ts`, `.test.ts` | pending |
| 4 | TarefaItem — edit/delete inline | `TarefaItem.tsx`, `.test.tsx` | pending |
| 5 | MaterialCard — botão delete | `MaterialCard.tsx`, `.test.tsx` | pending |
| 6 | Fase — edit/delete + confirmação + form | `Fase.tsx`, `.test.tsx` | pending |
| 7 | Painel.tsx — conectar handlers | `Painel.tsx` | pending |
| 8 | Validação final | — | pending |

---

## Task 1 — Tipos + ajuste backend

### Arquivos
- `src/features/panel/types.ts`
- `backend/src/shared/types.ts`
- `backend/src/services/PainelService.ts`

### Mudanças

**Frontend `types.ts`:**
- Adicionar `EditarTarefaInput { texto: string }`
- Adicionar `EditarFaseInput { titulo?, resumo?, numero?, status?, tipo? }`
- Adicionar `id?: string` à interface `Material`
- Alterar `FaseAPI.materiais: Material[]` → `MaterialAPI[]`

**Backend `shared/types.ts`:**
- Adicionar `id?: string` à interface `Material`

**Backend `PainelService.ts`:**
- `mapMaterialToDTO`: incluir `id: m.id`

### Verificação
```bash
pnpm type-check
```

---

## Task 2 — useTarefasAPI

### Arquivo de teste (RED primeiro)
`src/features/panel/hooks/useTarefasAPI.test.ts`

### Novos testes
- `deletarTarefa`: chama DELETE; `onSuccess` chamado em 200; `onError` chamado em 4xx/5xx; `deleting` Set gerenciado corretamente; 404 trata como sucesso
- `editarTarefa`: chama PATCH com texto correto; `onSuccess` recebe tarefa atualizada; `editing` Set gerenciado

### Implementação
`src/features/panel/hooks/useTarefasAPI.ts`

Novos estados:
```typescript
const [deleting, setDeleting] = useState<Set<string>>(new Set())
const [editing, setEditing] = useState<Set<string>>(new Set())
```

Helper para gerenciar Sets (evitar duplicação):
```typescript
const addToSet = (setter: ..., id: string) => setter(prev => new Set([...prev, id]))
const removeFromSet = (setter: ..., id: string) => setter(prev => { const s = new Set(prev); s.delete(id); return s })
```

### Verificação
```bash
pnpm test src/features/panel/hooks/useTarefasAPI.test.ts
```

---

## Task 3 — useFasesAPI

### Arquivo de teste (RED primeiro)
`src/features/panel/hooks/useFasesAPI.test.ts`

### Novos testes
- `deletarFase`: chama DELETE; `onSuccess` chamado; 404 trata como sucesso; `deletingFase` Set gerenciado
- `editarFase`: chama PATCH com body correto; `onSuccess` recebe fase atualizada; `editingFase` Set gerenciado

### Implementação
`src/features/panel/hooks/useFasesAPI.ts`

Novos estados e métodos análogos ao `useTarefasAPI`.

### Verificação
```bash
pnpm test src/features/panel/hooks/useFasesAPI.test.ts
```

---

## Task 4 — TarefaItem

### Arquivo de teste (RED primeiro)
`src/features/panel/components/TarefaItem.test.tsx`

### Novos testes
- Sem admin: não renderiza `btn-edit-tarefa-*` nem `btn-delete-tarefa-*`
- Com admin: renderiza ambos os botões
- Clicar editar: `input-edit-tarefa-${id}` aparece, `.task-text` some
- Confirmar (botão): `onEdit` chamado com novo texto; input desaparece
- Cancelar (Escape): texto original restaurado
- Botão confirmar disabled quando texto === original ou length < 3
- Clicar delete: `onDelete` chamado com tarefa.id
- Botão delete disabled quando `isToggling === true`

### Novas props
```typescript
onEdit?: (id: string, input: EditarTarefaInput) => void
onDelete?: (id: string) => void
isDeleting?: boolean
```

### Verificação
```bash
pnpm test src/features/panel/components/TarefaItem.test.tsx
```

---

## Task 5 — MaterialCard

### Arquivo de teste (RED primeiro)
`src/features/panel/components/MaterialCard.test.tsx`

### Novos testes
- Sem `onDelete`/`materialId`: não renderiza `btn-delete-material-*`
- Com ambos: renderiza `btn-delete-material-${materialId}`
- Clicar: `onDelete` chamado com `materialId`

### Novas props
```typescript
onDelete?: (id: string) => void
materialId?: string
```

### Verificação
```bash
pnpm test src/features/panel/components/MaterialCard.test.tsx
```

---

## Task 6 — Fase

### Arquivo de teste (RED primeiro)
`src/features/panel/components/Fase.test.tsx`

### Novos testes
- Sem admin: não renderiza `btn-edit-fase-*` nem `btn-delete-fase-*`
- Com admin: renderiza ambos
- Clicar delete não dispara toggle da fase (stopPropagation)
- Clicar delete: `dialog-confirm-delete-fase-${id}` aparece com número de tarefas
- Mensagem adaptada para fase sem tarefas
- Confirmar exclusão: `onDeleteFase` chamado; diálogo some
- Cancelar exclusão: `onDeleteFase` não chamado; diálogo some
- Clicar editar: form inline aparece com valores atuais preenchidos
- Salvar edição: `onEditFase` chamado com campos corretos
- Cancelar edição: form some sem chamar `onEditFase`

### Novas props
```typescript
onEditFase?: (id: string, input: EditarFaseInput) => void
onDeleteFase?: (id: string) => void
onDeleteMaterial?: (id: string) => void
```

### Verificação
```bash
pnpm test src/features/panel/components/Fase.test.tsx
```

---

## Task 7 — Painel.tsx

### Arquivo
`src/features/panel/Painel.tsx`

### Mudanças
- Conectar `useTarefasAPI.editarTarefa` e `deletarTarefa` ao `TarefaItem` via `Fase`
- Conectar `useFasesAPI.editarFase` e `deletarFase` ao `Fase`
- Para delete de tarefa: optimistic update no estado local `fases` + rollback em erro + toast
- Para delete de fase: remover do estado local após `onSuccess`
- Para delete de material de fase: optimistic update em `fases[i].materiais` + rollback + toast
- Conectar `onDeleteMaterial` ao `MaterialCard` dentro de `Fase`

### Verificação
```bash
pnpm type-check
pnpm test src/features/panel/Painel.test.tsx
```

---

## Task 8 — Validação final

```bash
pnpm test
pnpm lint
pnpm type-check
pnpm build
```

Testar manualmente:
- Modo admin: editar e excluir tarefa
- Modo admin: excluir fase (verificar confirmação + desaparecimento)
- Modo admin: editar fase (verificar form inline)
- Modo admin: excluir material de fase
- Modo não-admin: confirmar que nenhum botão aparece
