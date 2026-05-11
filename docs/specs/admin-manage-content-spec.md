# Spec: Admin — Gerenciar Conteúdo (tarefa, fase, material)

**Ticket:** admin-manage-content  
**Data:** 2026-05-09  
**Status:** Aguardando aprovação

---

## Objetivo

Permitir que o admin edite e exclua tarefas, edite e exclua fases (com exclusão em cascata das tarefas filhas), e exclua materiais vinculados a uma fase. Toda a infraestrutura de backend (endpoints `DELETE` e `PATCH`) já existe. O trabalho é expor essas operações no frontend.

---

## Contexto do codebase

| Recurso | Backend | Frontend |
|---|---|---|
| `PATCH /tarefas/:id` | Existe | Não exposto |
| `DELETE /tarefas/:id` | Existe | Não exposto |
| `PATCH /fases/:id` | Existe | Não exposto |
| `DELETE /fases/:id` | Existe | Não exposto |
| `DELETE /materiais/:id` | Existe | Só na Biblioteca |

O banco usa `ON DELETE CASCADE`: excluir uma fase deleta automaticamente suas tarefas e observações no banco.

`useAdminMode()` já está consumido em `Fase.tsx` e `Biblioteca.tsx` — o padrão está estabelecido.

---

## Modelo de dados

### Novos tipos a adicionar em `types.ts`

```typescript
export interface EditarTarefaInput {
  texto: string
}

export interface EditarFaseInput {
  titulo?: string
  resumo?: string
  numero?: string
  status?: FaseStatus
  tipo?: FaseTipo | null
}
```

### Ajuste necessário: `FaseAPI.materiais`

Atualmente `FaseAPI.materiais` é `Material[]` (sem `id`). Para suportar exclusão de materiais de fase, precisa ser `MaterialAPI[]`.

```typescript
// Antes
export interface FaseAPI {
  materiais: Material[]
}

// Depois
export interface FaseAPI {
  materiais: MaterialAPI[]
}
```

> **Verificação necessária:** confirmar se `GET /api/clientes/:clienteId/painel` já retorna o campo `id` dentro de `fases[].materiais[]`. Se retornar, basta ajustar o tipo. Se não retornar, o `PainelController` (backend) precisa incluir o campo.

---

## Regras de negócio

1. Botões de editar e excluir visíveis **apenas** quando `isAdmin === true`.
2. **Excluir tarefa:** hard delete, sem diálogo de confirmação. Optimistic update com rollback em erro.
3. **Excluir fase:** hard delete com **diálogo de confirmação**. A mensagem deve indicar quantas tarefas serão perdidas. Ao confirmar, a fase é removida do estado local e o `DELETE` é enviado.
4. **Cascata:** o banco garante a exclusão das tarefas filhas. O frontend apenas remove a fase do estado local — não precisa remover tarefas individualmente.
5. **Editar tarefa:** campo `texto` com mínimo de 3 caracteres. Não enviar `PATCH` se o texto não mudou.
6. **Editar fase:** campos `titulo`, `resumo`, `numero`, `status`. `titulo` é obrigatório (mínimo 3 chars). Os demais são opcionais.
7. **Excluir material de fase:** usa `MaterialAPI.id`. Sem confirmação (padrão da Biblioteca). Optimistic update com rollback em erro.
8. Botão de excluir tarefa fica **desabilitado** enquanto `toggling.has(tarefa.id)` for verdadeiro (toggle em andamento).
9. Click nos botões de ação da fase (editar/excluir) não propaga o evento para o toggle da fase (`stopPropagation`).

---

## Critérios de Aceite

**CA-01 — Excluir tarefa**  
Dado que o admin visualiza uma fase expandida com tarefas  
Quando clica no botão excluir de uma tarefa  
Então a tarefa é removida da lista imediatamente (optimistic)  
E o `DELETE /api/clientes/:id/tarefas/:tarefaId` é enviado ao backend  
E se o backend retornar erro, a tarefa é restaurada na lista e um toast de erro é exibido

**CA-02 — Editar tarefa**  
Dado que o admin visualiza uma fase expandida  
Quando clica no botão editar de uma tarefa  
Então o texto da tarefa é substituído por um `<input>` preenchido com o texto atual  
Quando confirma (botão ou Enter)  
Então o `PATCH` é enviado com o novo texto e o item é atualizado na lista  
Quando cancela (botão ou Escape)  
Então o input fecha sem salvar e o texto original é restaurado

**CA-03 — Excluir fase (com confirmação)**  
Dado que o admin visualiza o painel  
Quando clica no botão excluir de uma fase  
Então um diálogo de confirmação é exibido indicando o número de tarefas que serão perdidas  
Quando confirma  
Então a fase (e suas tarefas) é removida do estado local e o `DELETE /api/clientes/:id/fases/:faseId` é enviado  
Quando cancela  
Então nenhuma alteração ocorre

**CA-04 — Editar fase**  
Dado que o admin visualiza o painel  
Quando clica no botão editar de uma fase  
Então um formulário inline é exibido com os campos preenchidos com os valores atuais: número, título, resumo, status  
Quando salva  
Então o `PATCH /api/clientes/:id/fases/:faseId` é enviado e os dados da fase são atualizados na tela  
Quando cancela  
Então o formulário fecha sem salvar

**CA-05 — Excluir material de fase**  
Dado que o admin visualiza uma fase expandida com materiais  
Quando clica no botão excluir de um material  
Então o material é removido da lista imediatamente (optimistic)  
E o `DELETE /api/clientes/:id/materiais/:materialId` é enviado  
E se o backend retornar erro, o material é restaurado e um toast de erro é exibido

---

## Edge cases

1. **Tarefa sendo toggled:** botão de excluir desabilitado enquanto `toggling.has(tarefa.id)` for `true`.
2. **Fase sem tarefas:** diálogo de confirmação exibe "Esta fase não possui tarefas. Confirmar exclusão?" em vez de mencionar perda de tarefas.
3. **Texto idêntico ao original:** botão de confirmar edição fica desabilitado quando `texto.trim() === tarefa.texto`.
4. **Formulário de edição de fase durante submit:** botão cancelar fica desabilitado; botão salvar exibe "Salvando...".
5. **Backend retorna 404 ao excluir:** item já foi excluído por outra sessão. Tratar como sucesso — remover do estado local sem exibir erro.
6. **`MaterialAPI.id` ausente:** se o painel não retornar `id` nos materiais de fase, o botão de excluir não é renderizado (fallback seguro via `material.id ?? null`).
7. **Excluir fase enquanto expande:** botões de ação no header devem ser clicáveis independente do estado de expansão da fase.

---

## UI

### TarefaItem — modo admin

- Botões `btn-edit-tarefa-${id}` e `btn-delete-tarefa-${id}` aparecem no `.task-header` ao lado do texto.
- Ao clicar em editar:
  - `.task-text` é substituído por `<input data-testid="input-edit-tarefa-${id}">` com o texto atual.
  - Botão confirmar `btn-confirm-edit-tarefa-${id}` e cancelar `btn-cancel-edit-tarefa-${id}`.
  - Enter confirma; Escape cancela.
- Ao clicar em excluir: remoção optimistic, sem modal.
- Botão de excluir tem `disabled` enquanto `isToggling === true`.

### Fase — modo admin

- Botões `btn-edit-fase-${id}` e `btn-delete-fase-${id}` no `.fase-header`, visíveis mesmo com a fase colapsada.
- Click nesses botões chama `event.stopPropagation()` para não disparar o toggle.
- **Exclusão:** exibe um diálogo de confirmação inline (ex: `div[role="dialog"]` ou elemento similar com `data-testid="dialog-confirm-delete-fase-${id}"`).
  - Botão confirmar: `btn-confirm-delete-fase-${id}`
  - Botão cancelar: `btn-cancel-delete-fase-${id}`
- **Edição:** formulário inline abaixo do header (similar ao `add-tarefa-form` existente) com:
  - `input-numero-fase-${id}` (opcional)
  - `input-titulo-fase-${id}` (obrigatório, mín 3 chars)
  - `input-resumo-fase-${id}` (opcional)
  - `sel-status-fase-${id}` (select: done / active / pending)
  - `btn-save-edit-fase-${id}` e `btn-cancel-edit-fase-${id}`

### MaterialCard — modo admin (dentro de Fase)

- Botão `btn-delete-material-${materialId}` ao lado do card, mesmo padrão visual da Biblioteca (botão "×").
- Requer que `material.id` esteja disponível.
- Se `material.id` for `undefined`, o botão não é renderizado.

---

## Arquitetura

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/features/panel/types.ts` | Adicionar `EditarTarefaInput`, `EditarFaseInput`; alterar `FaseAPI.materiais: MaterialAPI[]` |
| `src/features/panel/hooks/useTarefasAPI.ts` | Adicionar `editarTarefa`, `deletarTarefa`, estados `editing: Set<string>`, `deleting: Set<string>` |
| `src/features/panel/hooks/useFasesAPI.ts` | Adicionar `editarFase`, `deletarFase`, estados `editingFase: Set<string>`, `deletingFase: Set<string>` |
| `src/features/panel/components/TarefaItem.tsx` | Adicionar props `onEdit?`, `onDelete?`; modo de edição inline |
| `src/features/panel/components/Fase.tsx` | Adicionar props `onEditFase?`, `onDeleteFase?`; diálogo de confirmação e formulário de edição |
| `src/features/panel/components/MaterialCard.tsx` | Adicionar prop `onDelete?: (id: string) => void` e `materialId?: string`; botão de delete admin |
| `src/features/panel/Painel.tsx` | Conectar novos handlers dos hooks aos componentes |

### Novos métodos nos hooks

```typescript
// useTarefasAPI — novos retornos
editing: Set<string>
deleting: Set<string>
editarTarefa: (tarefaId: string, input: EditarTarefaInput, onSuccess: (tarefa: TarefaAPI) => void) => Promise<void>
deletarTarefa: (tarefaId: string, onSuccess: () => void, onError: () => void) => Promise<void>

// useFasesAPI — novos retornos
editingFase: Set<string>
deletingFase: Set<string>
editarFase: (faseId: string, input: EditarFaseInput, onSuccess: (fase: FaseAPI) => void) => Promise<void>
deletarFase: (faseId: string, onSuccess: () => void) => Promise<void>
```

### Endpoints utilizados (todos existentes no backend)

```
PATCH  /api/clientes/:clienteId/tarefas/:tarefaId     body: { texto }
DELETE /api/clientes/:clienteId/tarefas/:tarefaId
PATCH  /api/clientes/:clienteId/fases/:faseId         body: { titulo?, resumo?, numero?, status?, tipo? }
DELETE /api/clientes/:clienteId/fases/:faseId
DELETE /api/clientes/:clienteId/materiais/:materialId
```

---

## Dependências de infraestrutura

Nenhuma dependência de infraestrutura identificada. Todos os endpoints existem no backend. Nenhuma nova biblioteca necessária.

> **Possível ajuste de backend:** verificar se `GET /painel` retorna `id` nos materiais de `fases[].materiais[]`. Se não retornar, alterar `PainelController` para incluir o campo — trabalho mínimo.

---

## Estratégia de testes

Referência: `.claude/rules/react-testing.md`

### `useTarefasAPI`

- `deletarTarefa`: mock `DELETE`; verifica que `onSuccess` é chamado em sucesso; verifica que `onError` é chamado em falha.
- `editarTarefa`: mock `PATCH`; verifica que `onSuccess` recebe tarefa atualizada; verifica `editing` Set durante chamada.
- Estado `deleting`/`editing`: verifica que o ID é adicionado antes e removido após a chamada.

### `useFasesAPI`

- `deletarFase`: mock `DELETE`; verifica `onSuccess` em sucesso; trata 404 como sucesso.
- `editarFase`: mock `PATCH`; verifica que `onSuccess` recebe fase atualizada com novos campos.

### `TarefaItem`

- Não renderiza botões edit/delete quando `isAdmin === false`.
- Renderiza `btn-edit-tarefa-${id}` e `btn-delete-tarefa-${id}` quando `isAdmin === true` e `onEdit`/`onDelete` fornecidos.
- Ao clicar em editar: `input-edit-tarefa-${id}` aparece, `.task-text` desaparece.
- Ao confirmar: `onEdit` chamado com novo texto; modo edição encerrado.
- Ao cancelar (Escape): texto original restaurado, modo edição encerrado.
- Botão de confirmar desabilitado se texto === original ou length < 3.
- Ao deletar: `onDelete` chamado com `tarefa.id`.
- `btn-delete-tarefa-${id}` fica `disabled` quando `isToggling === true`.

### `Fase`

- Não renderiza botões edit/delete quando `isAdmin === false`.
- Renderiza botões quando `isAdmin === true`.
- Click em `btn-delete-fase-${id}` não dispara toggle (stopPropagation verificado via mock `onToggleFase`).
- Ao clicar em excluir: `dialog-confirm-delete-fase-${id}` aparece com texto indicando N tarefas.
- Ao confirmar exclusão: `onDeleteFase` chamado.
- Ao cancelar: `onDeleteFase` não chamado, diálogo some.
- Mensagem de confirmação adaptada quando fase tem 0 tarefas.
- Ao clicar em editar: formulário inline aparece preenchido com valores atuais.
- Ao salvar: `onEditFase` chamado com campos corretos.
- Ao cancelar edição: formulário some.

### `MaterialCard`

- Não renderiza botão de delete sem props `onDelete`/`materialId`.
- Renderiza `btn-delete-material-${id}` quando ambos fornecidos.
- Ao clicar: `onDelete` chamado com `materialId`.

---

## Fora de escopo

- Editar material (nome, tipo, URL).
- Reordenar tarefas dentro de uma fase.
- Reordenar fases.
- Mover tarefa entre fases.
- Exclusão em lote de tarefas ou fases.
- Edição ou exclusão de materiais da Biblioteca (seção separada, já tem delete implementado).
- Qualquer operação de criação (já implementada).
