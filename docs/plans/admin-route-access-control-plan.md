# Plano de Implementação — admin-route-access-control

**Spec:** docs/specs/admin-route-access-control-spec.md  
**Data:** 2026-05-08  
**Status:** Concluído

---

## Notas de Infraestrutura

### Antes de começar
- [x] `pnpm add react-router-dom` — instalado v7.15.0

### Após implementação
- [ ] Validar variáveis de ambiente em ambientes de staging/prod se houver proxy reverso que reescreva paths

---

## Tasks

### Task 0 — Instalar react-router-dom
- **Arquivo:** `package.json`
- **Comando:** `pnpm add react-router-dom`
- **Resultado:** v7.15.0 instalado

---

### Task 1 — Criar AdminModeContext (TDD)
- **Arquivos criados:** `src/features/panel/context/AdminModeContext.tsx`, `src/features/panel/context/AdminModeContext.test.tsx`
- **RED:** testes escritos primeiro referenciando exports inexistentes
- **GREEN:** implementação do `createContext`, `AdminModeProvider`, `useAdminMode`
- **Testes:** 3 (default false, provider false, provider true)

---

### Task 2 — Atualizar test-utils.tsx
- **Arquivo:** `src/test/test-utils.tsx`
- **Mudança:** `customRender` envolve com `AdminModeProvider isAdmin={true}` por padrão; aceita `{ isAdmin?: boolean }` como opção
- **Motivo:** compatibilidade retroativa — testes existentes continuam testando comportamento admin; novos testes view passam `{ isAdmin: false }` explicitamente

---

### Task 3 — Gate TarefaItem (TDD)
- **Arquivo de teste:** `src/features/panel/components/TarefaItem.test.tsx`
- **Arquivo de prod:** `src/features/panel/components/TarefaItem.tsx`
- **RED:** 4 testes novos falhando (checkbox handler, obs button, obs textarea, obs readonly)
- **GREEN:** `useAdminMode()` importado; checkbox sem handler quando `!isAdmin`; botão obs + textarea apenas em admin; texto readonly quando `!isAdmin && temObs`

---

### Task 4 — Gate Biblioteca (TDD)
- **Arquivo de teste:** `src/features/panel/components/Biblioteca.test.tsx`
- **Arquivo de prod:** `src/features/panel/components/Biblioteca.tsx`
- **RED:** 2 testes novos falhando (form ausente, delete button ausente)
- **GREEN:** `useAdminMode()` importado; form envolto em `{isAdmin && (...)}` ; delete button envolto em `{isAdmin && (...)}`

---

### Task 5 — Atualizar App.tsx com React Router
- **Arquivo:** `src/App.tsx`
- **Mudança:** `BrowserRouter` + `Routes` com `/:clientId` (view) e `/:clientId/admin` (edit); fallback `*` redireciona para `/`

---

### Task 6 — Atualizar Painel.tsx e Painel.test.tsx
- **Arquivo de prod:** `src/features/panel/Painel.tsx`
  - Aceita `isAdmin: boolean` prop
  - Usa `useParams<{ clientId: string }>()` para obter clientId da rota
  - Envolve filhos com `<AdminModeProvider isAdmin={isAdmin}>`
- **Arquivo de teste:** `src/features/panel/Painel.test.tsx`
  - `renderPainel(isAdmin = true)` usa `MemoryRouter initialEntries={['/estefania']}` + `Routes` + `Route path="/:clientId"`
  - Adicionados 3 testes de integração para modo view (`isAdmin=false`)

---

## Resultado Final

| Métrica | Valor |
|---|---|
| Testes antes | 181 |
| Testes após | 192 |
| Novos testes | 11 (3 context + 5 TarefaItem + 3 Biblioteca/view + 3 Painel/view) |
| Arquivos criados | 3 |
| Arquivos modificados | 7 |
