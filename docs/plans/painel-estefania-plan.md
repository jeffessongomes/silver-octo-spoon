# Plano de Implementacao -- Painel Estefania

**Spec:** `docs/specs/painel-estefania-spec.md`
**Branch:** `master` (projeto novo, sem PR flow ainda)

## Tasks (TDD: RED -> GREEN -> IMPROVE)

### T1. Tipos + Dados + Constantes
- `src/features/panel/types.ts`
- `src/features/panel/data.ts` (port literal de `dadosPainel`)
- `src/constants/storage-keys.ts`
- Verificacao: `pnpm type-check`

### T2. lib/storage.ts (wrapper localStorage)
- Teste primeiro: `lib/storage.test.ts` (read/write/parse-fallback/localStorage-throws)
- Implementacao: `lib/storage.ts`
- Verificacao: `pnpm test src/lib/storage.test.ts`

### T3. Reducer + usePainelState
- Teste do reducer puro: `features/panel/hooks/painelReducer.test.ts` (toggleTarefa, toggleFase, toggleObs, setObservacao)
- Reducer: `features/panel/hooks/painelReducer.ts`
- Hook: `features/panel/hooks/usePainelState.ts` (hidratacao + tarefas pre-concluidas + persistencia em useEffect)
- Teste do hook: `usePainelState.test.ts` (hidrata estado, aplica pre-concluidas, persiste)

### T4. useDebouncedSave
- Teste com `vi.useFakeTimers()`: dispara apos 400ms, reset com nova chamada, status saving -> saved -> hidden
- Implementacao

### T5. usePainelStats (derivado puro)
- Teste: total e concluidas por fase + total geral
- Implementacao

### T6. Toast (Provider + hook + componente)
- Teste do componente: aparece com mensagem, some apos timeout
- Implementacao: `components/Toast.tsx`, `hooks/useToast.ts` (Context)
- CSS: `components/Toast.css`

### T7. Componentes folha (com testes)
- `<ProgressBar />`
- `<MaterialCard />` (link vs pendente)
- `<TarefaItem />` (checkbox, observacao, status)
- `<Filters />`
- `<AgendaSemana />` (estatico)
- `<Biblioteca />`

### T8. Componentes container
- `<Fase />` (status derivado, expansao, secao de materiais condicional)
- `<Trilha />`
- `<Sidebar />`
- `<Hero />`
- `<PainelHeader />`

### T9. Painel raiz + integracao
- `<Painel />` compoe tudo + provider de toast
- Teste de integracao: marca tarefa -> toast aparece -> contador atualiza

### T10. Estilos
- `index.css` (tokens + reset + body)
- `features/panel/Painel.css` (port literal do `<style>` do HTML)
- `components/Toast.css`

### T11. App.tsx + App.test.tsx
- Substituir contador pelo `<ToastProvider><Painel /></ToastProvider>`
- Substituir teste do counter por smoke test do painel

### T12. Validacao final
- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm build`

## Notas

- Sem branch nova nesta primeira implementacao (projeto recem-criado).
- Sem PR.
- Cada task deve ser commitavel independentemente -- mas vamos commitar em bloco no fim, se o usuario pedir.
