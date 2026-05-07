---
name: proj-review
description: Revisa branch ou PR contra a spec e criterios de aceite.
argument-hint: <branch-name-or-pr-number>
---

# Proj Review -- Revisor de PR/Branch

Gera review estruturado verificando aderencia a spec, criterios de aceite e regras de teste.

## IMPORTANT

Nao aprova nem rejeita o PR -- apenas gera um documento de review para o autor revisar.

## Language

Always respond in Portuguese (pt-BR).

## Phase 1 -- Coleta de Contexto

**1.1 Identificar branch/PR**

Argumento = $ARGUMENTS:
- Se for numero: tratar como PR (ex: `#42`). Buscar no git remote ou via `gh pr view <num>` se `gh` estiver disponivel.
- Se for string: tratar como branch.
- Se ausente: usar branch atual.

**1.2 Extrair ticket ID da branch**

Aplicar regex `(feat|fix|refactor|docs|test|chore|perf|hotfix)/([0-9a-zA-Z-]+)-.*` no nome da branch. Ticket ID = grupo 2.

Se nao bater: perguntar ao usuario.

**1.3 Ler spec**

Procurar em `docs/specs/[ticket-id]-spec.md`.

Se nao encontrada:
- Setar `spec_ausente = true`
- Avisar: "Spec nao encontrada. O veredicto sera 'Solicitar mudancas' ate que a spec exista."
- Continuar review baseado em criterios de aceite + analise de codigo.

**1.4 Diff e arquivos modificados**

Gerar diff: `git diff --name-status main...HEAD` (ou contra a branch base configurada).

Para cada arquivo, identificar:
- `add`: arquivo novo
- `modify`: arquivo modificado
- `delete`: arquivo removido

Ler conteudo dos arquivos relevantes.

## Phase 2 -- Geracao do Review

Gerar documento com as secoes abaixo.

### Criterios de Aceite

Tabela:

| # | Criterio | Status | Evidencia no codigo |
|---|---|---|---|
| CA1 | [CA text] | OK / Parcial / Ausente | `file.ts:function` |

Status:
- `OK`: implementado e verificavel no codigo
- `Parcial`: implementado mas incompleto
- `Ausente`: nao encontrado no codigo

### Analise qualitativa

- **Aderencia a spec**: o que foi implementado vs o que a spec definiu; gaps identificados
- **Qualidade**: logica, cobertura de testes, convencoes (`react-practices.md`), edge cases nao cobertos
- **Sugestoes**: opcionais -- nao bloqueiam aprovacao

### Aderencia a React Practices (frontend)

Carregar `.claude/rules/react-practices.md`. Avaliar:

| Convencao | Status | Evidencia |
|---|---|---|
| TypeScript strict (sem `any`) | OK / Violacao | `file.ts:line` |
| `data-testid` em elementos interativos | OK / Violacao / N/A | `file.tsx:line` |
| Estrutura de arquivos (components/features/hooks) | OK / Violacao | descricao |
| Imutabilidade (sem mutacao) | OK / Violacao | `file.ts:line` |
| Sem hardcoded (env vars, constantes) | OK / Violacao | `file.ts:line` |

Status:
- `OK`: convencao seguida
- `Violacao`: nao seguida -- explicar o que foi feito
- `N/A`: nao se aplica neste PR

**Violacoes bloqueantes (forcam veredicto "Solicitar mudancas"):**
- Uso de `any` (perde type-safety)
- Hardcoded de URL/valor sensivel
- Imports cross-feature inadequados (rompe modularidade)

### Aderencia a React Testing

Carregar `.claude/rules/react-testing.md`. Para cada item da TL;DR, avaliar nos arquivos de teste tocados pelo PR:

| Convencao | Status | Evidencia | Bloqueante |
|---|---|---|---|
| `data-testid` formato `type-action-component` | OK / Violacao / N/A | `file.test.tsx:line` | Sim (novo) / Nao (legado) / -- |
| `userEvent` do test-utils | OK / Violacao / N/A | `file.test.tsx:line` | Sim (novo) / Nao (legado) / -- |
| `findBy*` em vez de `waitFor + getBy*` | OK / Violacao / N/A | `file.test.tsx:line` | Sim (novo) / Nao (legado) / -- |
| Factory functions tipadas | OK / Violacao / N/A | descricao | Sim (novo) / Nao (legado) / -- |
| Sem mock de fetch/axios direto | OK / Violacao / N/A | `file.test.tsx:line` | Sim (novo) / Nao (legado) / -- |
| Testes em ingles | OK / Violacao / N/A | `file.test.tsx:line` | Sim (novo) / Nao (legado) / -- |

`Bloqueante`:
- `Sim (novo)`: violacao em arquivo de teste novo -- forca `Solicitar mudancas`
- `Nao (legado)`: violacao em arquivo pre-existente -- migracao gradual, nao bloqueia
- `--`: nao aplicavel (status OK ou N/A)

### Veredicto

**Se `spec_ausente = true`:**
- Veredicto forcado: `Solicitar mudancas`
- Nota: "Spec ausente em `docs/specs/[ticket-id]-spec.md`. A spec deve existir antes da aprovacao."

**Se spec encontrada:**
- `Aprovado`: todos CAs OK, sem violacoes bloqueantes
- `Aprovado com comentarios`: CAs OK, sugestoes nao-bloqueantes
- `Solicitar mudancas`: um ou mais CAs `Ausente`, gaps criticos da spec, OU violacoes bloqueantes

**Override por React Testing:** Se a tabela tem ao menos uma linha `Bloqueante = Sim (novo)`: forca `Solicitar mudancas`.

Gerar comentario final em texto plano:

```
Veredicto: [Aprovado / Aprovado com comentarios / Solicitar mudancas]

[Comentario em pt-BR: explicacao do veredicto, pontos principais, sugestoes]
```

## Phase 3 -- Salvar

Salvar em: `docs/reviews/[branch-or-pr]-review.md`.

Se arquivo ja existe: sobrescrever e adicionar `> Review anterior substituido em [data].` no topo.

Apresentar:
> "Review gerado em `docs/reviews/[branch-or-pr]-review.md`. Revise. Ajuste o veredicto/comentario se necessario. Quando pronto, copie o comentario para o PR."

## Error Handling

| Cenario | Comportamento |
|---|---|
| Branch/PR nao encontrado | Abortar com mensagem clara |
| Ticket ID nao identificado | Continuar sem secao de CAs, anotar "Ticket nao identificado" |
| Spec nao encontrada | Continuar com `spec_ausente = true` |
| Falha ao salvar arquivo | Avisar e exibir review no terminal |

## What this skill does NOT do

- Nao gera codigo
- Nao aprova/rejeita o PR no GitHub/Azure DevOps
- Nao posta automaticamente -- gera arquivo local para o usuario revisar
- Nao modifica codigo-fonte
