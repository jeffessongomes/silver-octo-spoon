# React + Vite Practices

Convencoes obrigatorias para este projeto React (Vite + React 19 + TypeScript).

## Stack

- React 19 + TypeScript strict
- Vite (dev server + build)
- Vitest + React Testing Library + jest-dom (testes)
- ESLint

## Code Conventions

- TypeScript strict -- `any` proibido
- Imutabilidade -- sempre crie novos objetos, nunca mute
- Hooks: prefixo `use`, retornar objetos nomeados quando expor mais de um valor
- Errors: trate explicitamente, nunca engula
- Sem valores hardcoded para coisas que podem mudar (URLs, limites, chaves) -- use `import.meta.env.VITE_*` ou constantes em `src/constants/`

## Patterns

- Componentes funcionais com hooks (sem class components)
- Evite `useEffect` quando puder -- prefira event handlers, derivacao de estado, ou `useMemo`/`useCallback` para sincronizacao real
- `useState` para estado local; estado global so quando compartilhado entre rotas/features (Zustand recomendado se necessario)
- Forms: Zod (schema) + React Hook Form quando o formulario tiver mais de 2 campos com validacao
- Async complexo (polling, optimistic updates, infinite scroll): TanStack Query. Para fetch simples, `fetch` + `useEffect` ou Suspense + transitions
- Suspense + error boundaries para conteudo assincrono pesado

## Estrutura de Arquivos

```
src/
  App.tsx
  main.tsx
  components/        # componentes reutilizaveis (UI puro, sem logica de negocio)
  features/          # agrupamento por dominio (cada feature: components, hooks, api, types)
  hooks/             # hooks compartilhados entre features
  lib/               # utilitarios e wrappers (clientes HTTP, helpers)
  types/             # tipos compartilhados
  constants/         # constantes (rotas, limites, configuracoes)
  test/              # setup e test-utils do Vitest
  assets/            # imagens e SVGs
```

Regras:
- Arquivos pequenos e focados (200-400 linhas tipico, 800 max)
- Funcoes pequenas (<50 linhas), sem aninhamento profundo (>4 niveis)
- 1 componente exportado por arquivo (excecao: subcomponentes pequenos no mesmo arquivo)

## Styling

Por padrao, CSS Modules ou CSS plain (`App.css`, `index.css`). Se adicionar Tailwind:

- Token-based: cores e spacing pelos tokens (escala default ou customizada em `tailwind.config`)
- Proibido: cores arbitrarias inline (`className="bg-[#ff0000]"`), valores fora da escala (`className="p-[17px]"`)
- Use classes utilitarias ordenadas (recomendado plugin `prettier-plugin-tailwindcss`)

## Testing

- Framework: Vitest + React Testing Library
- Arquivo de teste ao lado da fonte: `Component.test.tsx` (use `.test.ts` apenas para hooks/utils sem JSX)
- `data-testid` obrigatorio em elementos interativos -- formato `type-action-component` (ex: `btn-add-to-cart`, `input-user-email`)
- Queries: `getByTestId` como seletor primario; `getByRole`/`getByLabelText` para assertions de acessibilidade
- Proibido: `getByText` para selecionar elemento interativo, XPath, classes CSS
- Para o guia completo de testes, ver `.claude/rules/react-testing.md`
- Rodar antes de commitar: `pnpm test && pnpm lint && pnpm type-check`

## Commands

```bash
pnpm dev              # dev server
pnpm build            # build
pnpm preview          # preview do build
pnpm test             # testes
pnpm test:watch       # testes watch
pnpm test:coverage    # testes com cobertura
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
```

## Code Quality (gerais)

- Imutabilidade
- Tratamento de erro explicito em cada nivel (UI: mensagem amigavel; logica: erro tipado)
- Validacao na fronteira (input do usuario, resposta de API) -- falhe rapido com mensagem clara
- Sem valores hardcoded (use constantes ou `import.meta.env`)

## Disciplina de Escopo

- So modifique arquivos diretamente relacionados ao pedido.
- Melhorias cosmeticas (rename, format, simplificacao) sao permitidas APENAS em arquivos ja sendo tocados pela tarefa.
- NUNCA modifique arquivos fora do escopo sem perguntar. Se identificar melhorias adjacentes, liste-as como sugestoes ao final.
- NUNCA proponha mudancas arquiteturais (trocar patterns, reorganizar modulos) sem solicitacao explicita.
- Em bug fixes: foque APENAS no bug reportado.
- Em code review fixes: aplique APENAS o feedback recebido.

## Validacao Pos-Edicao

Apos qualquer edicao de codigo, SEMPRE rode validacao antes de apresentar como completo:
- `pnpm lint` (ESLint)
- `pnpm type-check` (TypeScript)
- `pnpm test` (testes afetados)

Se a validacao falhar, corrija antes de reportar. NUNCA apresente codigo como "pronto" sem validar.
