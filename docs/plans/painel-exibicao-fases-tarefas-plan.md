# Plano — painel-exibicao-fases-tarefas

## Task 1 — Tipos: TarefaAPI e FaseAPI com campos opcionais

**Arquivos:** `src/features/panel/types.ts`

**Por quê:** O endpoint `/painel` retorna `tarefas` com apenas `{id, texto, concluida}` e
`fases` sem `cliente_id`/`ordem`. Tornar esses campos opcionais permite que o shape do
`/painel` seja atribuído aos tipos existentes sem criar novos.

**Mudanças:**
- `TarefaAPI.fase_id?: string`
- `TarefaAPI.cliente_id?: string`
- `TarefaAPI.ordem?: number`
- `FaseAPI.cliente_id?: string`
- `FaseAPI.ordem?: number`

---

## Task 2 — useFasesAPI: trocar /fases por /painel

**Arquivos:** `src/features/panel/hooks/useFasesAPI.ts`, `.test.ts`

**RED:** Teste esperando que o mock de `api.get` seja chamado com `/painel`.
**GREEN:** Mudar URL e extrair `data.fases`.
**VERIFY:** `pnpm test src/features/panel/hooks/useFasesAPI.test.ts`

---

## Task 3 — Painel.tsx: corrigir useEffect de expansão

**Arquivos:** `src/features/panel/Painel.tsx`, `Painel.test.tsx`

**Problema atual:** `useEffect([fases, estado.expandidas, dispatch])` — `estado.expandidas`
na dep causa re-execução após o próprio dispatch, podendo criar comportamento instável.

**Fix:** Usar `useRef` para rastrear se o carregamento inicial já foi processado — o efeito
roda apenas quando `fases` passa de vazio para preenchido pela primeira vez.

**RED:** Teste verificando que após load as tarefas da primeira fase aparecem.
**GREEN:** Corrigir o `useEffect`.
**VERIFY:** `pnpm test src/features/panel/Painel.test.tsx`

---

## Task 4 — Validação final

1. `pnpm test`
2. `pnpm lint`
3. `pnpm type-check`
4. `pnpm build`
