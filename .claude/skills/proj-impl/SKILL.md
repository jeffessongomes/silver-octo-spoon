---
name: proj-impl
description: Use when implementing an approved spec from /proj-spec. TDD-first.
argument-hint: <ticket-id>
---

# Proj Impl -- Spec-Driven Implementation

Implementa uma especificacao tecnica aprovada usando TDD, validacao automatica e PR estruturado.

## IMPORTANT

Esta skill requer uma spec aprovada (gerada por /proj-spec) antes de comecar.
Se nenhuma spec existe para o ticket, bloqueia: "Nenhuma spec encontrada. Gere usando /proj-spec [ticket-id] primeiro."

## Language

Always respond in Portuguese (pt-BR).

## Phase 1 -- Carregar Spec

1. Ticket = $ARGUMENTS (se fornecido) ou perguntar.
2. Procurar spec em `docs/specs/[ticket-id]-spec.md`.
3. Se nao encontrada, bloquear: "Spec nao encontrada para o ticket [ticket-id]. Gere usando /proj-spec [ticket-id]."
4. Apresentar resumo da spec ao usuario para confirmacao: objetivo, arquitetura, criterios de aceite.
5. Aguardar confirmacao do usuario.

**Carregar contexto obrigatorio:**
- `.claude/rules/react-practices.md`
- `.claude/rules/react-testing.md` (sempre que for gerar testes)

## Phase 2 -- Branch

Lembrar:

```bash
git checkout main && git pull
git checkout -b feat/[ticket-id]-[descricao-curta]
git push -u origin feat/[ticket-id]-[descricao-curta]
```

Aguardar confirmacao da branch criada.

## Phase 3 -- Plano de Implementacao

Quebrar a spec em tasks atomicas. Cada task contem:

- Arquivos a tocar
- Teste a escrever (RED)
- Implementacao (GREEN)
- Refator (IMPROVE) se aplicavel
- Comando de verificacao (`pnpm test [path]`, `pnpm lint`, `pnpm type-check`)

Salvar plano em `docs/plans/[ticket-id]-plan.md`.

**Notas de infraestrutura:** Se a spec contem secao "Dependencias de Infraestrutura" preenchida, adicionar bloco no plano:

```markdown
## Notas de Infraestrutura

### Antes de comecar
- [ ] [Acoes bloqueantes: instalar libs, configurar env vars]

### Apos implementacao
- [ ] [Acoes pos-merge: deploy, validar variaveis em ambientes]
```

## Phase 4 -- Execucao (TDD)

Para cada task:

1. **RED:** Escrever o teste primeiro. Rodar -- deve falhar.
2. **GREEN:** Implementar o minimo para o teste passar.
3. **IMPROVE:** Refatorar mantendo testes verdes.
4. **VERIFY:** Rodar `pnpm test`, `pnpm lint`, `pnpm type-check`.

**Testes:** Antes de gerar qualquer teste, releia `.claude/rules/react-testing.md` e siga as convencoes (naming, seletores, mocks, dados realistas).

Apos cada task: checkpoint com o usuario antes de seguir para a proxima.

## Phase 5 -- Validacao

Antes de abrir PR:

1. Rodar suite completa: `pnpm test`
2. Lint: `pnpm lint`
3. Type-check: `pnpm type-check`
4. Build: `pnpm build`
5. Verificar manualmente o comportamento em `pnpm dev` (golden path + edge cases criticos)

Se algo falha, corrigir antes de abrir PR.

## Phase 6 -- PR

Antes de abrir o PR, executar:

```bash
git diff --stat main...HEAD | tail -1
```

Se diff > 800 linhas ou >20 arquivos sem justificativa: pausar e sugerir divisao.

### Template da descricao do PR

```markdown
## Descricao

**[Tipo]-[ID]:** [Titulo da feature / correcao]

---

## Problema

[Descrever o problema do usuario ou inconsistencia. Maximo 3 linhas.]

---

## Causa raiz

- [Ponto 1]
- [Ponto 2]
- [Ponto 3]

---

## Solucao

### Camada 1 -- adaptar ao escopo

- [Mudancas]

### Camada 2

- [Mudancas]

---

## Verificacao

- X arquivos de teste / Y testes passando
- Cobertura: X%
- Build: 0 erros
- Lint: 0 erros
```

Exemplos de subsecoes da Solucao para frontend: `Hooks / Camada de dados`, `Componentes / UI`, `Tipos / Schemas`, `Tests`, `Configuracao`.

### Regras de preenchimento

- Mirar em ate **4000 caracteres** total (diretriz)
- Bullets curtos
- Verificacao com dados reais da execucao
- Omitir secoes que nao se aplicam

### Qualidade do portugues (pt-BR)

Antes de entregar, revisar acentuacao e ortografia. Nao entregar texto sem acentos.

## What this skill does NOT do

- Nao comeca sem spec aprovada
- Nao pula testes
- Nao commita sem confirmacao
- Nao da push direto em main/master
- Nao expande escopo alem da spec
