# Plano de Implementacao: admin-import-painel

**Spec:** `docs/specs/admin-import-painel-spec.md`  
**Branch:** `feat/checklist-obs-redesign`  
**Data:** 2026-05-09

---

## Tarefas

### Task 1 — Backend: FaseRepository
**Arquivos:** `backend/src/repositories/FaseRepository.ts`

- RED: estender teste `FaseRepository.test.ts` para cobrir criacao de tarefa com observacao
- GREEN: adicionar `observacao?: string` em `CreateTarefaDTO`; dentro da transacao em `createFaseWithTarefas`, apos INSERT em tarefas, se `observacao` for nao-vazio, fazer INSERT em `observacoes`
- VERIFY: `cd backend && pnpm test`

---

### Task 2 — Backend: ImportarPainelService
**Arquivos:** `backend/src/services/ImportarPainelService.ts` (novo)  
**Testes:** `backend/tests/unit/services/ImportarPainelService.test.ts` (novo)

- RED: escrever testes do service
- GREEN: implementar `ImportarPainelService`
- VERIFY: `cd backend && pnpm test`

---

### Task 3 — Backend: Controller + Rota
**Arquivos:** `backend/src/controllers/ImportarPainelController.ts` (novo),  
`backend/src/routes/index.ts` (modificar)  
**Testes:** `backend/tests/integration/api/importar-painel.test.ts` (novo)

- RED: escrever testes de integracao do endpoint
- GREEN: implementar controller e registrar rota
- VERIFY: `cd backend && pnpm test && pnpm lint && pnpm type-check`

---

### Task 4 — Frontend: Tipos
**Arquivos:** `src/features/panel/types.ts`

- Adicionar: `ImportarFaseInput`, `ImportarPainelInput`, `ImportarPainelResponse`, `ImportarPainelPreview`
- VERIFY: `pnpm type-check`

---

### Task 5 — Frontend: useImportarPainelAPI
**Arquivos:** `src/features/panel/hooks/useImportarPainelAPI.ts` (novo)  
**Testes:** `src/features/panel/hooks/useImportarPainelAPI.test.ts` (novo)

- RED: escrever testes do hook
- GREEN: implementar hook
- VERIFY: `pnpm test src/features/panel/hooks/useImportarPainelAPI.test.ts`

---

### Task 6 — Frontend: ImportarPainelForm
**Arquivos:** `src/features/panel/components/ImportarPainelForm.tsx` (novo)  
**Testes:** `src/features/panel/components/ImportarPainelForm.test.tsx` (novo)

- RED: escrever testes do componente (todos os 6 estados + cenarios de integracao)
- GREEN: implementar componente
- VERIFY: `pnpm test src/features/panel/components/ImportarPainelForm.test.tsx`

---

### Task 7 — Frontend: Integrar no Painel.tsx
**Arquivos:** `src/features/panel/Painel.tsx`

- Adicionar `<ImportarPainelForm>` na secao admin apos "Nova fase"
- Passar `clienteId` e `onSuccess={fetchFases}`
- VERIFY: `pnpm test src/features/panel/Painel.test.tsx`

---

### Task 8 — Validacao Final
- `pnpm test && pnpm lint && pnpm type-check`
- `cd backend && pnpm test && pnpm lint && pnpm type-check`
