# silver-octo-spoon

Projeto React + TypeScript com Vite, Vitest e React Testing Library.

## Stack

- **React 19** + TypeScript (strict)
- **Vite** -- dev server e build
- **Vitest** + **React Testing Library** + **jest-dom** -- testes
- **ESLint** -- lint

## Setup

```bash
pnpm install
```

## Scripts

```bash
pnpm dev              # dev server
pnpm build            # build para producao
pnpm preview          # preview do build
pnpm lint             # lint
pnpm type-check       # verificacao de tipos
pnpm test             # roda testes uma vez
pnpm test:watch       # testes em watch
pnpm test:coverage    # testes com cobertura
```

## Estrutura

```
src/
  App.tsx
  App.test.tsx
  main.tsx
  test/
    setup.ts          # setup global do Vitest (cleanup, jest-dom)
    test-utils.tsx    # custom render + userEvent re-exportados
  assets/
public/
.claude/
  rules/              # convencoes de codigo (carregadas pelo Claude)
  skills/             # skills customizadas (SDD workflow)
  settings.local.json
```

## Workflow (Spec-Driven Development)

1. `/proj-preflight` -- verifica pre-condicoes (git, estrutura)
2. `/proj-spec [ticket-id]` -- gera spec tecnica a partir de um ticket
3. `/proj-impl [ticket-id]` -- implementa a partir da spec aprovada (TDD)
4. `/proj-review [branch]` -- revisa branch contra spec
5. `/proj-e2e [feature]` -- gera testes E2E Playwright

Ver `.claude/rules/` para convencoes de codigo e testes.
