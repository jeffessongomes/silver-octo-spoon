# Plano de Implementacao -- biblioteca-materiais-api

**Spec:** `docs/specs/biblioteca-materiais-api-spec.md`
**Abordagem:** TDD -- RED → GREEN → IMPROVE por task

---

## Notas de Infraestrutura

### Antes de comecar
- [ ] `pnpm add axios`
- [ ] Criar `.env` na raiz com `VITE_API_URL=http://localhost:3000`

### Apos implementacao
- [ ] Validar `VITE_API_URL` em ambiente de producao (quando houver)

---

## Tasks

### Task 0 -- Infraestrutura
**Arquivos:** `package.json`, `.env`, `src/lib/api.ts`, `src/constants/storage-keys.ts`
- Instalar axios
- Criar `.env` com `VITE_API_URL`
- Criar `src/lib/api.ts` com instancia axios
- Adicionar `CLIENTE_ID = 'estefania'` em `storage-keys.ts`
- Verificar: `pnpm type-check`

---

### Task 1 -- Tipos: MaterialAPI e CriarMaterialInput
**Arquivo:** `src/features/panel/types.ts`
- Adicionar `MaterialAPI` (com `id`, `cliente_id`, `fase_id`, `ordem`)
- Adicionar `CriarMaterialInput`
- **Teste:** nao aplicavel (tipos puros)
- Verificar: `pnpm type-check`

---

### Task 2 -- Hook useBiblioteca (listagem)
**Arquivos:**
- `src/features/panel/hooks/useBiblioteca.ts` (CRIAR)
- `src/features/panel/hooks/useBiblioteca.test.ts` (CRIAR)

**RED → GREEN → IMPROVE:**
1. Escrever testes: GET sucesso, GET erro, fetchBiblioteca re-executa
2. Implementar hook com `useState + useEffect`
3. Verificar: `pnpm test src/features/panel/hooks/useBiblioteca.test.ts`

---

### Task 3 -- Hook useBiblioteca (criacao)
**Arquivos:** mesmos da Task 2

**RED → GREEN → IMPROVE:**
1. Adicionar testes: POST sucesso (lista atualizada), POST erro (submitError populado), submitting durante POST
2. Implementar `criarMaterial` no hook
3. Verificar: `pnpm test src/features/panel/hooks/useBiblioteca.test.ts`

---

### Task 4 -- Hook useBiblioteca (delecao)
**Arquivos:** mesmos da Task 2

**RED → GREEN → IMPROVE:**
1. Adicionar testes: DELETE sucesso (item removido localmente), DELETE erro
2. Implementar `deletarMaterial` no hook
3. Verificar: `pnpm test src/features/panel/hooks/useBiblioteca.test.ts`

---

### Task 5 -- CSS: estilos do form, skeleton, empty state
**Arquivo:** `src/features/panel/Painel.css`
- Adicionar `.biblioteca-form`, `.biblioteca-form-row`, `.biblioteca-form input/select/button`
- Adicionar `@keyframes pulse` + `.biblioteca-skeleton`
- Adicionar `.biblioteca-empty`
- Adicionar `.biblioteca-divider`
- **Sem teste** (estilos puros)

---

### Task 6 -- Biblioteca.tsx refatorado (self-contained)
**Arquivos:**
- `src/features/panel/components/Biblioteca.tsx` (MODIFICAR)
- `src/features/panel/components/Biblioteca.test.tsx` (MODIFICAR)

**RED → GREEN → IMPROVE:**
1. Reescrever testes: todos os estados (loading, error+retry, empty, lista, form, submit, pendente, ativo)
2. Refatorar componente: remover prop `itens`, consumir `useBiblioteca`, adicionar form
3. Verificar: `pnpm test src/features/panel/components/Biblioteca.test.tsx`

---

### Task 7 -- Sidebar.tsx e Painel.tsx: remover prop biblioteca
**Arquivos:**
- `src/features/panel/components/Sidebar.tsx`
- `src/features/panel/Painel.tsx`
- Testes existentes dos dois (se houver)

**RED → GREEN:**
1. Remover prop `biblioteca` de `SidebarProps`
2. Remover passagem de `dadosPainel.biblioteca` em `Painel.tsx`
3. Verificar: `pnpm test && pnpm type-check`

---

### Task 8 -- Validacao final
1. `pnpm test` (suite completa)
2. `pnpm lint`
3. `pnpm type-check`
4. `pnpm build`
5. Validacao manual: `pnpm dev`
