---
name: proj-preflight
description: Verifica pre-condicoes (git, estrutura, dependencias) antes de iniciar trabalho. Roda standalone ou como Phase 0 de outras skills.
argument-hint: (sem argumentos)
---

# Proj Preflight -- Verificacao de Pre-condicoes

Verifica estado do repositorio, dependencias e configuracao antes de iniciar qualquer trabalho.

## IMPORTANT

Esta skill e somente leitura. Nao cria, altera ou remove nenhum dado.

## Language

Always respond in Portuguese (pt-BR).

## Execucao

### Check 1 -- Estado do repositorio

1. Reportar branch atual (`git branch --show-current`).
2. Reportar status git (clean/dirty via `git status --porcelain`).
3. Se estiver em branch protegida (`main`, `master`, `develop`, `release/*`): alertar "Voce esta em uma branch protegida. Crie uma feature branch antes de comecar."
4. Reportar quantos commits adiante/atras de `main`/`master` (se aplicavel).

### Check 2 -- Estrutura do projeto

1. Verificar `package.json` na raiz.
2. Verificar dependencias minimas (`react`, `vite`).
3. Verificar `vite.config.ts` com bloco `test` (Vitest).
4. Verificar `src/test/setup.ts` e `src/test/test-utils.tsx`.
5. Listar campos faltantes ou problemas detectados.

### Check 3 -- Dependencias instaladas

1. Verificar se `node_modules/` existe.
2. Se nao existe: alertar "Rode `pnpm install` antes de comecar".
3. Verificar se versoes em `package.json` batem com `node_modules` (existencia das pastas chave: `react`, `vitest`, `@testing-library/react`).

### Check 4 -- Configuracao Claude (.claude/)

1. Verificar `.claude/rules/react-practices.md` e `.claude/rules/react-testing.md`.
2. Verificar `.claude/skills/` com as skills do projeto.
3. Verificar `CLAUDE.md` na raiz.
4. Listar campos faltantes.

### Check 5 -- Validacao basica

1. Rodar `pnpm type-check` (se possivel) -- reportar pass/fail.
2. NAO rodar testes nem build (preflight e leve).

## Resultado

Apresentar sumario formatado:

```
Preflight Check
================
Branch:                [nome] [clean | dirty: N arquivos]
Estrutura do projeto:  [OK | Faltando: itens]
Dependencias:          [Instaladas | node_modules ausente]
.claude/:              [OK | Parcial: arquivos faltantes]
TypeScript:            [OK | N erros]
================
```

Se todos OK: "Todas as pre-condicoes atendidas. Pronto para trabalhar."
Se algum falhou: listar recomendacoes de correcao.
