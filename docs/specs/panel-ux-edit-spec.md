# Spec Técnica — Melhoria de UX: Edição e Exclusão de Fases e Tarefas

**Ticket:** panel-ux-edit  
**Data:** 2026-05-09  
**Branch:** feat/admin-manage-content  
**Status:** Aguardando aprovação

---

## Objetivo

Melhorar a experiência de edição e exclusão de fases e tarefas no painel admin:

1. **Tarefas**: substituir o fluxo atual (botão "Editar" → input + botão "Salvar") por edição inline com auto-save ao clicar no texto — mesmo padrão já usado nas observações (`useDebouncedSave`).
2. **Fases e Tarefas**: redesenhar botões e formulários de edição/exclusão para melhor hierarquia visual e consistência.
3. **Exclusão de tarefas**: adicionar confirmação (atualmente delete é direto, sem confirmação).

---

## Contexto da Implementação Atual

### TarefaItem — Edição (antes)
- Botão "Editar" → estado `editando = true` → mostra input + botões "Salvar" / "Cancelar"
- Validação: `editTexto.trim() !== tarefa.texto && editTexto.trim().length >= 3`
- Keyboard: Enter salva, Escape cancela

### TarefaItem — Exclusão (antes)
- Botão "Excluir" com classe `.admin-action-btn--danger`
- Sem confirmação — delete imediato ao clicar

### Observação — Referência (padrão a replicar)
- Toggle da área abre textarea
- `useDebouncedSave` (400ms) — auto-save ao digitar
- Indicador de status: `salvando...` / `salvo`
- Sem botões de ação explícitos

### Fase — Edição (antes)
- Botão "Editar" → formulário inline com múltiplos campos (titulo, resumo, numero, status)
- Botões "Salvar" / "Cancelar" explícitos
- Confirmação de delete já existe (conta tarefas afetadas)

---

## Modelo de Dados

Sem alterações no modelo de dados — todos os endpoints existem e funcionam:

```typescript
// Já existente — sem mudanças
interface EditarTarefaInput {
  texto: string
}

interface EditarFaseInput {
  titulo?: string
  resumo?: string
  numero?: string
  status?: FaseStatus
  tipo?: FaseTipo | null
}
```

Hooks e endpoints reutilizados:
- `useTarefasAPI(clienteId)` — `PATCH /api/clientes/{id}/tarefas/{tarefaId}`
- `useFasesAPI(clienteId)` — `PATCH /api/clientes/{id}/fases/{faseId}`
- `useDebouncedSave` — já existe em `src/hooks/useDebouncedSave.ts`

---

## Regras de Negócio

### Edição de Tarefa (inline auto-save)
1. Admin clica no texto da tarefa → texto vira `<input>` editável imediatamente.
2. Auto-save com debounce de 600ms a partir do último keystroke.
3. Validação: texto deve ter ≥ 3 caracteres e ser diferente do valor original para disparar save.
4. Se inválido (< 3 chars): indicador de erro visual, não dispara save.
5. Escape: cancela edição, restaura texto original, sem API call.
6. Clicar fora do input (blur): salva imediatamente (sem aguardar debounce).
7. Indicador de status igual às observações: `salvando...` → `salvo` (some após 2s).
8. Durante saving: input permanece editável (non-blocking).

### Exclusão de Tarefa (confirmação)
1. Admin clica em "Excluir" → mini-diálogo inline de confirmação (não modal full-screen).
2. Diálogo mostra: "Excluir esta tarefa?" + botões "Sim, excluir" / "Cancelar".
3. Confirmar → chamada DELETE → item removido da lista.
4. Cancelar → volta ao estado normal sem API call.
5. Fora de escopo: animação de remoção — lista atualiza normalmente.

### Edição de Fase (manter formulário, redesign visual)
1. Botão "Editar" → formulário inline permanece (múltiplos campos justificam form explícito).
2. Formulário redesenhado: layout mais compacto, botões com melhor hierarquia.
3. Comportamento funcional sem alteração.

### Exclusão de Fase (manter confirmação existente, redesign visual)
1. Fluxo de confirmação existente é mantido.
2. Apenas redesign dos botões.

---

## Critérios de Aceite

### CA-01: Edição inline de tarefa por clique

**Dado** que sou admin e o painel está carregado  
**Quando** clico no texto de uma tarefa  
**Então** o texto é substituído por um `<input>` com o valor atual em foco

---

**Dado** que estou editando o texto de uma tarefa  
**Quando** digito um texto válido (≥ 3 chars, diferente do original)  
**Então** após 600ms sem digitação, a tarefa é salva automaticamente e o indicador mostra "salvo"

---

**Dado** que estou editando o texto de uma tarefa  
**Quando** pressiono Escape  
**Então** o texto volta ao valor original e o input some, sem chamar a API

---

**Dado** que estou editando o texto de uma tarefa  
**Quando** clico fora do input (blur)  
**Então** o texto válido é salvo imediatamente (sem aguardar debounce)

---

**Dado** que estou editando o texto de uma tarefa  
**Quando** o texto tem menos de 3 caracteres  
**Então** o indicador mostra erro e o save não é disparado

### CA-02: Exclusão de tarefa com confirmação

**Dado** que sou admin  
**Quando** clico em "Excluir" em uma tarefa  
**Então** aparece um mini-diálogo inline com "Excluir esta tarefa?" e botões "Sim, excluir" e "Cancelar"

---

**Dado** que o diálogo de confirmação está visível  
**Quando** clico em "Sim, excluir"  
**Então** a tarefa é removida e o diálogo fecha

---

**Dado** que o diálogo de confirmação está visível  
**Quando** clico em "Cancelar"  
**Então** o diálogo fecha e a tarefa permanece

### CA-03: Design de botões — consistência visual

**Dado** que sou admin  
**Quando** visualizo ações de edição/exclusão (em fases e tarefas)  
**Então** os botões seguem hierarquia visual: ação primária (salvar/confirmar) destaca, ação destrutiva (excluir) em vermelho, ação secundária (cancelar) em cinza

---

**Dado** que uma ação assíncrona está em andamento  
**Quando** o save está sendo processado  
**Então** o botão/indicador correspondente mostra estado de loading e evita duplo envio

### CA-04: Não-admin não vê controles de edição

**Dado** que não sou admin  
**Quando** visualizo tarefas e fases  
**Então** nenhum botão de editar/excluir é exibido (comportamento atual mantido)

---

## Edge Cases

1. **Clique no texto durante checkbox-click**: o clique no checkbox (concluída) não deve disparar edição inline — usar `stopPropagation` no checkbox.
2. **Edição durante loading de save**: se o save está em curso e o usuário edita novamente, o debounce reinicia — o save anterior deve ser cancelado (abortar ou ignorar resposta stale).
3. **Edição de texto idêntico**: se o usuário edita mas restaura o valor original, não disparar API call.
4. **Duas tarefas em edição simultânea**: cada `TarefaItem` tem estado independente — duas tarefas podem estar em edição ao mesmo tempo sem conflito.
5. **Excluir enquanto está em edição**: se a tarefa está em modo edição e o usuário clica "Excluir" (via outro path), a edição em curso deve ser descartada.
6. **Falha no save**: exibir indicador de erro (`erro ao salvar`) e manter o input aberto com o texto editado para retentar.
7. **Texto muito longo**: input deve ter `maxLength` alinhado ao limite do backend (verificar schema).
8. **Mobile/touch**: o clique no texto para editar deve funcionar em toque — sem conflito com scroll.

---

## UI — Estados Visuais

### TarefaItem — Novos estados

```
Estado Normal (admin):
[x] Texto da tarefa                    [Excluir]
                                        ^botão discreto, visível no hover

Estado Editando:
[x] [input: Texto da tarefa_____]      salvando... | salvo | ⚠ erro
     ^cursor ativo, borda highlighted

Estado Confirmando Exclusão:
[x] Texto da tarefa
    ┌─────────────────────────────────┐
    │ Excluir esta tarefa?            │
    │ [Sim, excluir]  [Cancelar]      │
    └─────────────────────────────────┘
```

**Hierarquia de botões:**
- Ação destrutiva confirmada: `btn--danger` (vermelho, fundo sólido)
- Ação secundária / cancelar: `btn--ghost` (borda, sem fundo)
- Ação primária de edição (fases): `btn--primary` (azul/cor do tema)

**Indicador de status (edição inline):**
- `salvando...` — texto muted com spinner pequeno (ou texto apenas)
- `salvo` — texto verde, some após 2s
- `erro ao salvar` — texto vermelho, persiste até nova tentativa

### Fase — Redesign dos botões do formulário

```
[Antes]
Editar | Excluir   (dois botões sem hierarquia clara)

[Depois — cabeçalho da fase, admin mode]
[✎ Editar]  [✕ Excluir]
 ^secundário  ^danger/outline
```

```
[Formulário de edição de fase — antes]
[inputs...] [Salvar] [Cancelar]   (sem hierarquia)

[Formulário de edição de fase — depois]
[inputs...]
              [Cancelar]  [Salvar alterações]
               ^ghost      ^primary
```

---

## Arquitetura

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| [src/features/panel/components/TarefaItem.tsx](src/features/panel/components/TarefaItem.tsx) | Substituir botão "Editar" + form por clique no texto + `useDebouncedSave`; adicionar confirmação de delete |
| [src/features/panel/components/TarefaItem.test.tsx](src/features/panel/components/TarefaItem.test.tsx) | Atualizar testes para novos padrões de interação |
| [src/features/panel/components/Fase.tsx](src/features/panel/components/Fase.tsx) | Redesign visual dos botões de editar/excluir e formulário |
| [src/features/panel/components/Fase.test.tsx](src/features/panel/components/Fase.test.tsx) | Ajustar testes conforme redesign |

> Nenhum arquivo novo será criado. Todos os hooks e serviços reutilizados sem modificação.

### Mudança principal: TarefaItem — edição inline

**Remover:**
- Estado `editando: boolean`
- Estado `editTexto: string`
- Botão "Editar"
- Botões "Salvar" / "Cancelar"
- Handler `handleConfirmarEdicao`

**Adicionar:**
- Estado `isEditingTexto: boolean`
- `useDebouncedSave` conectado a `onEdit({ texto })`
- Handler `handleTextoClick` — ativa edição ao clicar no texto
- Handler `handleTextoBlur` — salva imediatamente (flush do debounce)
- Handler `handleTextoKeyDown` — Escape cancela, Enter faz blur (dispara save)
- Estado `confirmandoDelete: boolean` — mini-diálogo de confirmação

**Manter:**
- `useDebouncedSave` já implementado em `src/hooks/useDebouncedSave.ts` — reusar diretamente
- Toda a lógica de API (hook `useTarefasAPI`) sem alteração

### Mudança: TarefaItem — exclusão com confirmação

**Adicionar:**
- Estado `confirmandoDelete: boolean`
- Renderização condicional do mini-diálogo inline
- Handler `handleDeleteClick` — ativa `confirmandoDelete = true`
- Handler `handleConfirmarDelete` — chama `onDelete(tarefa.id)`
- Handler `handleCancelarDelete` — restaura `confirmandoDelete = false`

### Mudança: Fase — redesign visual

**Sem alteração de lógica** — apenas:
- Classes CSS dos botões de ação (hierarquia visual)
- Layout do formulário de edição (alinhamento, espaçamento)
- Botões "Salvar" / "Cancelar" com nova hierarquia visual

---

## Dependências de Infraestrutura

Nenhuma dependência de infraestrutura identificada.

- `useDebouncedSave` já existe em `src/hooks/useDebouncedSave.ts`
- Todos os endpoints de API existem e funcionam
- Sem novas libs, variáveis de ambiente ou configuração de build

---

## Estratégia de Testes

Ver `.claude/rules/react-testing.md` para convenções obrigatórias.

### TarefaItem — testes a escrever/atualizar

**Edição inline:**
```
describe('TarefaItem', () => {
  describe('when admin clicks on task text', () => {
    it('should replace text with an input field')
    it('should focus the input')
  })

  describe('when editing task text', () => {
    it('should auto-save after debounce when text is valid')
    it('should show saving indicator during save')
    it('should show saved indicator after successful save')
    it('should show error indicator when save fails')
    it('should cancel and restore original text on Escape')
    it('should save immediately on blur')
    it('should not call API when text is unchanged')
    it('should not call API when text has less than 3 chars')
  })
})
```

**Exclusão com confirmação:**
```
  describe('when admin clicks delete', () => {
    it('should show confirmation dialog')
    it('should call onDelete when confirmed')
    it('should hide dialog when cancelled')
    it('should not call onDelete when cancelled')
  })
```

**Não-admin:**
```
  describe('when not admin', () => {
    it('should not show delete button')
    it('should not open edit mode when clicking text')
  })
```

### Fase — testes a atualizar

- Ajustar `data-testid` se botões forem renomeados
- Verificar que confirmação de delete continua funcionando
- Testes de lógica sem alteração — apenas seletores visuais

### Cobertura de estados async (obrigatório)

Cobrir sequências:
- `clique → editando → salvando → salvo`
- `clique → editando → salvando → erro`
- `clique excluir → confirmação → deletado`
- `clique excluir → confirmação → cancelado`

---

## Fora de Escopo

- Edição inline de fases (múltiplos campos justificam formulário explícito)
- Reordenação de tarefas/fases via drag-and-drop
- Undo/Redo de edições
- Histórico de alterações
- Edição em lote de tarefas
- Animações de entrada/saída de elementos
- Alteração de endpoints ou schema de banco de dados
- Adição de novos campos editáveis além de `texto` da tarefa
