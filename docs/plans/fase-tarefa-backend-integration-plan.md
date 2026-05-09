# Plano de Implementação: fase-tarefa-backend-integration

**Spec:** `docs/specs/fase-tarefa-backend-integration-spec.md`  
**Branch:** `feature/page-admin`  
**Data:** 2026-05-08

---

## Dependências de Infraestrutura

### Antes de começar
- [x] `axios` já instalado
- [x] `react-router-dom` já instalado
- [ ] Backend com os 4 endpoints implementado e rodando em `VITE_API_URL`

### Após implementação
- [ ] Configurar `VITE_API_URL` nos ambientes (dev, staging, prod)
- [ ] Validar com backend os contratos dos 4 endpoints

---

## Tasks

### Task 1 — Tipos novos (`types.ts`)
- **Arquivo:** `src/features/panel/types.ts`
- **O que faz:** Adiciona `TarefaAPI`, `FaseAPI`, `CriarTarefaInput`, `CriarFaseInput`, `ToggleTarefaResponse`
- **Verificar:** `pnpm type-check`

### Task 2 — `usePainelStats` com `FaseAPI[]`
- **Arquivos:** `src/features/panel/hooks/usePainelStats.ts`, `usePainelStats.test.ts`
- **RED:** Atualizar factory de teste para `TarefaAPI[]` com campo `concluida`
- **GREEN:** Mudar assinatura para `fases: FaseAPI[]`; calcular de `tarefa.concluida`
- **Verificar:** `pnpm test src/features/panel/hooks/usePainelStats.test.ts`

### Task 3 — `useFasesAPI` (hook + testes)
- **Arquivos:** `src/features/panel/hooks/useFasesAPI.ts`, `useFasesAPI.test.ts`
- **RED:** Testes para GET, refetch, criarFase (sucesso/erro/submitting)
- **GREEN:** Hook seguindo padrão de `useBiblioteca`
- **Verificar:** `pnpm test src/features/panel/hooks/useFasesAPI.test.ts`

### Task 4 — `useTarefasAPI` (hook + testes)
- **Arquivos:** `src/features/panel/hooks/useTarefasAPI.ts`, `useTarefasAPI.test.ts`
- **RED:** Testes para toggleConcluida (toggling Set, sucesso, erro) e criarTarefa
- **GREEN:** Hook com `Set<string>` para tracking de requests em andamento
- **Verificar:** `pnpm test src/features/panel/hooks/useTarefasAPI.test.ts`

### Task 5 — `TarefaItem` — prop `isToggling`
- **Arquivos:** `src/features/panel/components/TarefaItem.tsx`, `TarefaItem.test.tsx`
- **RED:** Adicionar teste: `isToggling=true` → `aria-disabled="true"` no checkbox
- **GREEN:** Adicionar prop `isToggling: boolean`; aplicar `aria-disabled` quando true
- **Verificar:** `pnpm test src/features/panel/components/TarefaItem.test.tsx`

### Task 6 — `Fase` — novo tipo + toggling + formulário nova tarefa
- **Arquivos:** `src/features/panel/components/Fase.tsx`, `Fase.test.tsx`
- **RED:** Atualizar factories para `TarefaAPI`; adicionar testes do formulário
- **GREEN:** `fase: FaseAPI`, `concluida = tarefa.concluida`, props `toggling` + `criarTarefa`; form admin
- **Mudança de assinatura:** `onToggleTarefa: (id, concluida) => void` (novo param)
- **Verificar:** `pnpm test src/features/panel/components/Fase.test.tsx`

### Task 7 — `Trilha` — pass-through das novas props
- **Arquivo:** `src/features/panel/components/Trilha.tsx`
- **O que faz:** Adicionar `toggling`, `criarTarefa`, atualizar `onToggleTarefa` signature
- **Sem novos testes** (componente pass-through puro)
- **Verificar:** `pnpm type-check`

### Task 8 — `Painel` — integrar hooks + loading/error + formulário nova fase
- **Arquivos:** `src/features/panel/Painel.tsx`, `Painel.test.tsx`
- **RED:** Mockar `useFasesAPI` + `useTarefasAPI`; adicionar testes loading/error/forms
- **GREEN:** Substituir `dadosPainel.fases` por API; integrar handlers; form nova fase
- **Verificar:** `pnpm test src/features/panel/Painel.test.tsx`

### Task 9 — Validação final
- `pnpm test` (suite completa)
- `pnpm lint`
- `pnpm type-check`
- `pnpm build`

---

## Fluxo de dados (nova arquitetura)

```
Painel
  ├── useFasesAPI(clientId)     → fases: FaseAPI[], loading, error, fetchFases, criarFase
  ├── useTarefasAPI(clientId)   → toggling: Set<string>, toggleConcluida, criarTarefa
  ├── usePainelState(clientId)  → estado: {expandidas, obsAbertas, observacoes} (localStorage)
  └── usePainelStats(fases)     → stats calculados de FaseAPI[].tarefas[].concluida
       ↓
  Trilha(fases, toggling, criarTarefa, onToggleTarefa(id, concluida))
       ↓
  Fase(fase: FaseAPI, toggling, criarTarefa, onToggleTarefa(id, concluida))
       ↓
  TarefaItem(concluida=tarefa.concluida, isToggling=toggling.has(id))
```

## Endpoints a implementar no backend

| Método | Path | Resposta |
|---|---|---|
| `GET` | `/api/clientes/{clienteId}/fases` | `FaseAPI[]` |
| `PATCH` | `/api/clientes/{clienteId}/tarefas/{tarefaId}/concluida` | `ToggleTarefaResponse` |
| `POST` | `/api/clientes/{clienteId}/fases/{faseId}/tarefas` | `TarefaAPI` |
| `POST` | `/api/clientes/{clienteId}/fases` | `FaseAPI` |
