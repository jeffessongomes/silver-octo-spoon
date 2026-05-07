# CLAUDE.md

Contexto deste repositorio para o Claude Code.

## Stack

- **React 19** + TypeScript (strict)
- **Vite 8** -- dev server e build
- **Vitest** + **React Testing Library** + **jest-dom** -- testes
- **ESLint** -- lint
- **Package manager:** pnpm

## Commands

```bash
pnpm dev              # dev server (http://localhost:5173)
pnpm build            # build de producao
pnpm preview          # preview do build
pnpm test             # testes (run once)
pnpm test:watch       # testes em watch
pnpm test:coverage    # testes com cobertura
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
```

## Estrutura

```
src/
  App.tsx
  main.tsx
  components/         # componentes reutilizaveis (UI puro)
  features/           # agrupamento por dominio
  hooks/              # hooks compartilhados
  lib/                # utilitarios
  types/              # tipos compartilhados
  constants/          # constantes
  test/               # setup + test-utils
  assets/
public/
e2e/                  # testes Playwright (gerados via /proj-e2e)
docs/
  specs/              # specs tecnicas (geradas via /proj-spec)
  plans/              # planos de implementacao (gerados via /proj-impl)
  reviews/            # reviews de PR (gerados via /proj-review)
  test-cases/         # docs de testes E2E
.claude/
  rules/              # convencoes de codigo
  skills/             # skills customizadas
```

## Convencoes

- Ver `.claude/rules/react-practices.md` para convencoes de codigo React/TS
- Ver `.claude/rules/react-testing.md` para convencoes de testes (Vitest + RTL)

## Workflow (Spec-Driven Development)

| Skill | Para quem | Proposito |
|---|---|---|
| `/proj-preflight` | Todos | Verifica pre-condicoes (git, estrutura, deps) |
| `/proj-spec [ticket-id]` | Todos | Gera spec tecnica de um ticket/feature |
| `/proj-impl [ticket-id]` | Devs | Implementa spec aprovada com TDD |
| `/proj-review [branch-or-pr]` | Devs/TLs | Revisa branch/PR contra spec e CAs |
| `/proj-e2e [ticket-id]` | QA/Devs | Gera testes Playwright a partir da spec |

Fluxo: **DEFINE** (spec) -> **VALIDATE** (aprovar abordagem) -> **GENERATE** (TDD) -> **VERIFY** (testes, lint, review) -> **DEPLOY**

## Principios fundamentais

- **AI gera, humano revisa e decide. Nunca o contrario.**
- Sem commit sem confirmacao explicita.
- Sem push direto em `main`/`master`/`develop`.
- TDD sempre: RED -> GREEN -> IMPROVE.
- Validar antes de declarar pronto: `pnpm test && pnpm lint && pnpm type-check`.

## Git -- Confirmacao de Branch

Antes de qualquer operacao git (criar branch, commit, PR):
1. Identificar branch atual e branch base.
2. Confirmar com o usuario: "Vou criar branch X a partir de Y. PR para Z. Confirma?"
3. NUNCA assumir branch base.
4. Antes de criar PR: verificar que o diff contem APENAS arquivos da feature/fix.

## Git -- Idioma

- Commit messages: prefixo conventional commits em ingles (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`), descricao em pt-BR.
  - Exemplo: `feat(checkout): adicionar validacao de CPF`
- PR descriptions: pt-BR.
- Code review comments: pt-BR.

## Output

- Sem emojis em codigo, commits, PRs, comentarios de review.
- Sempre escrever em arquivo local antes de postar em sistemas externos.

## Validacao Pos-Edicao

Apos qualquer edicao, sempre rodar:
- `pnpm lint`
- `pnpm type-check`
- `pnpm test` (testes afetados)

Se falhar, corrigir antes de reportar.

## Disciplina de Escopo

- So modifique arquivos diretamente relacionados ao pedido.
- Melhorias cosmeticas: apenas em arquivos ja sendo tocados.
- Sem mudancas arquiteturais sem solicitacao explicita.
- Bug fix: foque APENAS no bug reportado.

## Pull Request Format

PRs devem incluir um changelog na descricao:

```
## Changelog

### Added
- [item]

### Changed
- [item]

### Removed
- [item]

### Fixed
- [item]
```

Regras:
- Omitir secoes vazias
- Cada entrada: descricao concisa do que mudou (nao copia do commit message)
- pt-BR
- Apos changelog, secao `## Contexto` explicando a motivacao
