# Spec Técnica: Checklist Funcional, Observações no Backend e Redesign de UI

**Ticket:** checklist-obs-redesign  
**Branch base:** master  
**Branch sugerida:** `feat/checklist-obs-redesign`  
**Data:** 2026-05-09  
**Status:** Aguardando revisão

---

## Objetivo

Três problemas a resolver em conjunto:

1. **Checklist de tarefas não funciona para usuários comuns** — o checkbox só dispara a API quando `isAdmin`. Usuários comuns não conseguem marcar tarefas.
2. **Observações não persistem no backend** — atualmente ficam apenas no `localStorage`. Ao trocar de dispositivo ou limpar dados, as observações somem. O endpoint `PUT /api/clientes/{clienteId}/tarefas/{tarefaId}/observacao` já existe no backend mas não é chamado.
3. **Observações visualmente indistinguíveis das tarefas** — o usuário não distingue o bloco de observação do conteúdo da tarefa. Os formulários admin carecem de design adequado.

---

## Modelo de Dados

### Tipos atuais relevantes

```typescript
// src/features/panel/types.ts
interface TarefaAPI {
  id: string
  texto: string
  concluida: boolean
  fase_id?: string
  cliente_id?: string
  ordem?: number
  // FALTANDO: observacao
}

interface EstadoPainel {
  tarefas: Record<string, boolean>       // pode ser removido (dado vem do backend)
  observacoes: Record<string, string>    // pode ser removido (dado vem do backend)
  expandidas: string[]                   // mantém
  obsAbertas: string[]                   // mantém
}
```

### Mudanças no modelo

```typescript
// src/features/panel/types.ts — ADICIONAR campo em TarefaAPI
interface TarefaAPI {
  id: string
  texto: string
  concluida: boolean
  fase_id?: string
  cliente_id?: string
  ordem?: number
  observacao: string | null  // NOVO — carregado junto com o painel
}

// EstadoPainel — REMOVER campos que migram para o backend:
interface EstadoPainel {
  // tarefas: removido — concluida vem de TarefaAPI.concluida
  // observacoes: removido — observacao vem de TarefaAPI.observacao
  expandidas: string[]
  obsAbertas: string[]
}
```

### Novo hook `useObservacaoAPI`

```typescript
// src/features/panel/hooks/useObservacaoAPI.ts
interface UseObservacaoAPIResult {
  saving: Set<string>                                        // tarefaIds em saving
  saveObservacao: (tarefaId: string, conteudo: string) => Promise<void>
  deleteObservacao: (tarefaId: string) => Promise<void>
}
```

---

## Regras de Negócio

### Checklist de tarefas
- Qualquer usuário autenticado (admin ou não) pode marcar/desmarcar tarefas via checkbox.
- O toggle chama `PATCH /api/clientes/{clienteId}/tarefas/{tarefaId}/concluida`.
- Enquanto aguarda resposta da API, o checkbox fica desabilitado (estado `toggling`).
- Sucesso: refetch do painel para atualizar contadores de progresso.
- Erro: exibir mensagem não-bloqueante; checkbox retorna ao estado anterior (o refetch já fará isso).
- Toast "Tarefa concluída" exibido apenas ao marcar (não ao desmarcar) — comportamento já existente.

### Observações
- Qualquer usuário autenticado pode criar, editar ou visualizar a observação de uma tarefa.
- Uma tarefa tem no máximo uma observação por `(tarefa_id, cliente_id)` — upsert no backend.
- Observação é carregada junto com o painel (eager loading via `TarefaAPI.observacao`).
- Edições são enviadas ao backend com debounce de 400ms via `useObservacaoAPI`.
- Observação vazia ou somente espaços: chamar `DELETE` em vez de `PUT` para limpar.
- O campo de observação fica aberto/fechado por toggle — estado `obsAbertas` persiste no `localStorage`.
- Observação em modo readonly para usuário comum: exibida automaticamente se não vazia (sem toggle).
- Admin e usuário comum podem editar a mesma observação (modelo atual: 1 observação por tarefa por cliente).

### Design de Observação
- O bloco de observação deve ser visualmente distinguível do texto da tarefa.
- Label explícita "Observação" sempre visível quando há conteúdo ou quando está aberta.
- Ícone de nota (📝 ou SVG equivalente sem emoji — usar SVG) no label.

### Formulários Admin
- Formulário de adicionar fase: campos com labels visíveis, validação visual em tempo real.
- Formulário de adicionar tarefa: mesma consistência.
- Botões com estado disabled adequado e feedback visual de loading.

---

## Critérios de Aceite

### CA-1: Checklist para todos os usuários

**Dado** que sou um usuário não-admin no painel  
**Quando** clico no checkbox de uma tarefa pendente  
**Então** o checkbox fica desabilitado, a API é chamada e a tarefa é marcada como concluída no backend

**Dado** que sou um usuário não-admin no painel  
**Quando** clico no checkbox de uma tarefa concluída  
**Então** a tarefa é desmarcada no backend e os contadores de progresso atualizam

### CA-2: Observações persistidas no backend

**Dado** que sou qualquer usuário (admin ou não) no painel  
**Quando** abro uma observação e digito texto  
**Então** após 400ms, o conteúdo é enviado via `PUT /api/clientes/{clienteId}/tarefas/{tarefaId}/observacao`  
**E** o status "Salvando..." → "Salvo" é exibido

**Dado** que existe uma observação salva no backend  
**Quando** carrego o painel  
**Então** a observação aparece pré-preenchida no campo (vem de `TarefaAPI.observacao`)

**Dado** que existe uma observação e eu apago todo o conteúdo do campo  
**Quando** aguardo 400ms  
**Então** `DELETE /api/clientes/{clienteId}/tarefas/{tarefaId}/observacao` é chamado

### CA-3: Observação visualmente distinta

**Dado** que uma tarefa tem observação  
**Quando** vejo a lista de tarefas  
**Então** o bloco de observação tem estilo visual diferente da tarefa (borda lateral, fundo, label "Observação")

**Dado** que sou usuário não-admin  
**Quando** uma tarefa tem observação  
**Então** vejo a observação em modo readonly com label "Observação" visível (não confundo com texto da tarefa)

### CA-4: Usuário comum pode adicionar observação

**Dado** que sou usuário não-admin  
**Quando** uma tarefa não tem observação  
**Então** vejo o botão "+ Adicionar observação" (igual ao admin)

**Dado** que clico em "+ Adicionar observação"  
**Quando** digito texto  
**Então** o texto é salvo no backend com debounce de 400ms

### CA-5: Formulários admin melhorados

**Dado** que sou admin e vejo o formulário de adicionar fase  
**Então** cada campo tem label visível, o botão de submit mostra "Adicionando..." durante o envio e o formulário tem hierarquia visual clara

---

## Edge Cases

1. **Falha no toggle de tarefa**: API retorna erro → toast de erro não-bloqueante → estado visual do checkbox reverte (refetch garante consistência).
2. **Falha ao salvar observação**: API retorna erro → status muda para "Erro ao salvar" → usuário pode tentar novamente ao editar.
3. **Observação nula no backend (404 ou 204)**: `TarefaAPI.observacao` vem como `null` → campo inicia vazio.
4. **Edição simultânea**: dois usuários editando a mesma observação → last-write-wins (comportamento do upsert no backend — aceitável para esta versão).
5. **Painel vazio**: se `fases` vier sem tarefas, nada quebra — lista renderiza vazia.
6. **Toggle rápido**: usuário clica checkbox duas vezes rápido → segundo clique ignorado enquanto `toggling.has(tarefaId)`.
7. **Observação só com espaços**: trim antes de enviar; se vazio após trim → `DELETE`.
8. **Migração do localStorage**: `observacoes` do `EstadoPainel` no localStorage será ignorado após remoção do campo — não há dados críticos perdidos pois eram apenas locais.
9. **Redução do `EstadoPainel`**: o campo `tarefas: Record<string, boolean>` do reducer deve ser removido para evitar conflito com dados do backend. `concluida` vem diretamente de `TarefaAPI.concluida`.

---

## UI — Estados Visuais

### TarefaItem — estado atual vs novo

| Elemento | Atual | Novo |
|---|---|---|
| Checkbox | Ativo só p/ admin | Ativo para todos |
| Botão obs | Só p/ admin | Para todos |
| Obs readonly | Parágrafo simples | Bloco com label "Observação" + ícone + borda lateral |
| Obs editável | Textarea sem contexto visual | Textarea dentro de bloco "Observação" com label |
| Status save | Ponto + texto | Mantém, com cor de erro se falhar |

### Bloco de observação (design)

```
┌──────────────────────────────────────────────┐
│ [ícone lápis] Observação                     │  ← label com ícone SVG
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Texto da observação aqui...              │ │  ← textarea (edit) ou p (readonly)
│ └──────────────────────────────────────────┘ │
│                              ● Salvo          │  ← status save
└──────────────────────────────────────────────┘
```

- Fundo: `var(--obs-bg)` (distinto do fundo da tarefa)
- Borda lateral esquerda: `var(--obs-accent)` (ex: 3px solid amber/amarelo)
- Padding interno, border-radius suave
- Label "Observação" em peso semibold, tamanho `0.75rem`, uppercase ou small-caps

### Formulários Admin (design)

**Formulário adicionar tarefa:**
```
┌─────────────────────────────────────┬──────────────┐
│ [input: texto da tarefa...]         │ [Adicionar]  │
└─────────────────────────────────────┴──────────────┘
  ← mensagem de erro aqui se houver
```

**Formulário adicionar fase:**
```
┌─────────────────────────────────────────────────────┐
│ Label: Título da fase                               │
│ [input: texto...]                                   │
│                                                     │
│ Label: Resumo                                       │
│ [textarea: descrição breve...]                      │
│                                                     │
│                               [+ Adicionar fase]    │
└─────────────────────────────────────────────────────┘
```
- Labels `<label>` explícitas acima dos campos
- Campo com erro: borda vermelha
- Botão submit: estado `loading` com texto "Adicionando..."
- Card/seção com separação visual do restante do painel

---

## Arquitetura

### Backend (modificações)

| Arquivo | Mudança |
|---|---|
| `backend/src/repositories/FaseRepository.ts` | `getFaseComTarefas()`: JOIN com `observacoes` para incluir `conteudo` como `observacao` em cada tarefa |
| `backend/src/services/PainelService.ts` | Garantir que `observacao` é mapeada para `TarefaAPI` ao construir `DadosPainel` |
| `backend/src/shared/types.ts` | Adicionar `observacao: string \| null` em `TarefaRow` ou criar `TarefaComObservacao` |

**Query SQL — FaseRepository (conceitual):**
```sql
SELECT 
  t.id, t.texto, t.concluida, t.fase_id, t.cliente_id, t.ordem,
  o.conteudo AS observacao
FROM tarefas t
LEFT JOIN observacoes o ON o.tarefa_id = t.id AND o.cliente_id = t.cliente_id
WHERE t.fase_id = ? AND t.cliente_id = ?
```

### Frontend (modificações)

| Arquivo | Mudança |
|---|---|
| `src/features/panel/types.ts` | `TarefaAPI.observacao: string \| null`; remover `observacoes` e `tarefas` de `EstadoPainel` |
| `src/features/panel/hooks/painelReducer.ts` | Remover ações `SET_OBSERVACAO` e `TOGGLE_TAREFA` (agora são via API); remover campos do `EstadoPainel` |
| `src/features/panel/hooks/usePainelState.ts` | Ajustar `hidratar()` para novo `EstadoPainel` sem `observacoes` e `tarefas` |
| `src/features/panel/hooks/useObservacaoAPI.ts` | **NOVO** — encapsula `PUT` e `DELETE` de observação com estado `saving` |
| `src/features/panel/hooks/useTarefasAPI.ts` | Remover guarda `isAdmin` do toggle (já não tem guarda lá — a guarda está no componente) |
| `src/features/panel/components/TarefaItem.tsx` | Remover guarda `isAdmin` do checkbox; disponibilizar campo obs para todos; redesign do bloco obs |
| `src/features/panel/components/Fase.tsx` | Passar `observacao` inicial de `tarefa.observacao` (não de `estado.observacoes`); redesign do formulário de tarefa |
| `src/features/panel/Painel.tsx` | Remover `handleChangeObservacao` do reducer; injetar `useObservacaoAPI`; redesign form de fase |
| `src/features/panel/Painel.css` | Adicionar tokens CSS e classes para bloco obs e formulários redesenhados |

### Novo Hook `useObservacaoAPI`

```typescript
// src/features/panel/hooks/useObservacaoAPI.ts
export function useObservacaoAPI(clienteId: string): UseObservacaoAPIResult {
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const saveObservacao = useCallback(async (tarefaId: string, conteudo: string) => {
    const trimmed = conteudo.trim()
    setSaving(prev => new Set([...prev, tarefaId]))
    try {
      if (trimmed.length === 0) {
        await api.delete(`/api/clientes/${clienteId}/tarefas/${tarefaId}/observacao`, {
          headers: { 'X-Client-ID': clienteId },
        })
      } else {
        await api.put(`/api/clientes/${clienteId}/tarefas/${tarefaId}/observacao`,
          { conteudo: trimmed },
          { headers: { 'X-Client-ID': clienteId } },
        )
      }
    } finally {
      setSaving(prev => { const next = new Set(prev); next.delete(tarefaId); return next })
    }
  }, [clienteId])

  return { saving, saveObservacao }
}
```

### Fluxo revisado de observação no TarefaItem

```
1. Abre campo (toggle) → textarea inicia com `tarefa.observacao ?? ''`
2. onChange → `useDebouncedSave` agenda save (400ms)
3. Após 400ms → `useObservacaoAPI.saveObservacao(tarefaId, valor)`
4. Status: saving → saved (ou error)
```

---

## Dependências de Infraestrutura

Nenhuma dependência de infraestrutura identificada. Endpoints e libs necessários já existem.

---

## Estratégia de Testes

Ver convenções em `.claude/rules/react-testing.md`.

### `TarefaItem.test.tsx`

| Cenário | Tipo | O que validar |
|---|---|---|
| Checkbox ativo para usuário não-admin | Unit | `data-testid="chk-toggle-tarefa-{id}"` é clicável; `onToggleConcluida` é chamado |
| Checkbox desabilitado durante toggling | Unit | `aria-disabled=true`; click não dispara callback |
| Bloco obs visível para não-admin | Unit | `btn-toggle-obs-{id}` renderiza sem `isAdmin` |
| Obs readonly distinta | Unit | `obs-readonly-{id}` tem className `obs-block` (ou equivalente) |
| Label "Observação" visível | Unit | elemento com texto "Observação" renderiza quando obs aberta |

### `useObservacaoAPI.test.ts`

| Cenário | Tipo | O que validar |
|---|---|---|
| Conteúdo não-vazio → PUT | Unit | API chamada com body `{ conteudo }` |
| Conteúdo vazio → DELETE | Unit | API `delete` chamada |
| Estado `saving` durante requisição | Unit | `saving.has(tarefaId)` = true durante, false após |
| Erro na API | Unit | erro não estoura; `saving` remove tarefaId |

### `Painel.test.tsx` / Integração

| Cenário | Tipo | O que validar |
|---|---|---|
| Observação carregada do painel | Integração | Campo obs pré-preenchido com `tarefa.observacao` |
| Toggle tarefa usuário não-admin → API | Integração | `PATCH /tarefas/{id}/concluida` chamado |
| Digitar obs → debounce → PUT | Integração | `PUT /tarefas/{id}/observacao` chamado após 400ms (fake timers) |
| Apagar obs → DELETE | Integração | `DELETE /tarefas/{id}/observacao` chamado |

---

## Fora de Escopo

- Observações por role separadas (admin vs usuário têm observações diferentes) — modelo atual é compartilhado
- Histórico de versões da observação
- Menções ou comentários encadeados
- Formatação rica (markdown) na observação
- Notificações quando observação é editada
- Reordenação de tarefas ou fases
- Qualquer mudança no schema do banco além do JOIN de leitura em FaseRepository
