# React Testing Practices

Convencoes obrigatorias para testes React deste projeto (Vitest + Testing Library). Carregada como contexto durante a geracao de testes.

## IMPORTANT

Este documento define **como** escrever testes neste projeto. Deve ser consultado sempre que testes forem criados ou modificados.

## AI Language

Always respond in Portuguese (pt-BR). (Nota: testes sao escritos em ingles -- ver Secao 2).

---

## 1. Objetivo e Mentalidade

Escrever testes que validem **comportamento do usuario**, nao implementacao. Foco em resiliencia, nao cobertura.

**Pergunta de Ouro:** se eu refatorar a logica interna (ex: `useState` -> `useReducer`) mas o comportamento visual continuar o mesmo, o teste vai quebrar? Se sim, esta viciado em implementacao.

---

## TL;DR -- Regras nao-negociaveis

- `data-testid` obrigatorio em elementos interativos, formato `type-action-component`
- `userEvent` importado do `test-utils`, nunca direto da lib
- `await screen.findBy*` em vez de `waitFor(() => getBy*)` para query de elemento
- Factory functions tipadas + wrappers semanticos por cenario
- Mockar apenas a fronteira (cliente HTTP / camada de dados), nao mocke o componente sob teste
- Testes em ingles (`it`, `describe`); dados de fixture em pt-BR
- Pass-through nao testa isoladamente; orquestradores testam obrigatoriamente
- Snapshots evitar -- so para componentes verdadeiramente puros e estaveis
- TypeScript strict tambem em mocks -- `any` proibido

---

## 2. Naming e Estrutura

Obrigatorio agrupar `it` por contexto ou comportamento usando blocos `describe('when <condicao>')` ou `describe('given <precondicao>')`. Testes soltos no topo do arquivo sao proibidos em componentes com mais de um cenario.

### Idioma dos testes: ingles (obrigatorio)

Descricoes de `it`, `describe` devem ser **sempre em ingles**.

A excecao sao **dados de fixture** (nome de usuario, endereco, produto) -- esses permanecem em portugues para refletir o contexto brasileiro.

### Naming de `it`: dois cenarios

A condicao aparece uma unica vez -- ou no `it`, ou no `describe`. Nunca duplicada.

**Cenario A -- Testes planos:**

```typescript
it('should display error message when CPF is invalid', () => { /* ... */ })
it('should navigate to checkout when cart has items', () => { /* ... */ })
it('should disable submit button when form is incomplete', () => { /* ... */ })
```

**Cenario B -- Organizacao com `describe`:**

A condicao sobe para o `describe('when <condicao>')`. O `it` carrega **estritamente a acao**.

```typescript
// BOM
describe('CheckoutForm', () => {
  describe('when CPF is invalid', () => {
    it('should display error message', () => { /* ... */ })
    it('should keep submit button disabled', () => { /* ... */ })
  })
})

// RUIM -- condicao repetida
describe('CheckoutForm', () => {
  describe('when CPF is invalid', () => {
    it('should display error message when CPF is invalid', () => { /* ... */ })
  })
})
```

**Ruim em qualquer cenario:** `'renders correctly'`, `'test error'`, `'should work'`.

### Profundidade

`describe` raiz = nome do componente/hook. Internos representam cenarios. Evite mais de 2 niveis. Se precisar mais, achate em uma string composta.

```typescript
// BOM -- 2 niveis, condicao composta
describe('CheckoutForm', () => {
  describe('when logged in and cart is empty', () => {
    it('should redirect to menu', () => { /* ... */ })
  })
})
```

---

## 3. Seletores

`data-testid` e **obrigatorio** em todo elemento interativo.

> **Decisao consciente:** invertemos a hierarquia do Testing Library (que prefere role > label > text > testid) em favor de `data-testid` por resiliencia contra mudanca de copy. `getByRole`/`getByLabelText` ficam como assertions complementares de a11y.

### Formato: `type-action-component`

| type | Elemento |
|---|---|
| `btn` | button |
| `input` | input, textarea |
| `sel` | select |
| `chk` | checkbox |
| `modal` | modal, dialog |
| `link` | ancora, Link |

| action | Exemplos |
|---|---|
| `open` | abrir modal, dropdown |
| `submit` | submeter formulario |
| `delete` | remover item |
| `add` | adicionar |
| `toggle` | alternar estado |
| `close` | fechar modal |

Exemplos: `btn-add-to-cart`, `input-user-email`, `sel-select-store`, `modal-open-address`, `chk-toggle-terms`.

**Regra critica:** O `data-testid` deve ser aplicado ao **elemento que recebe o evento** (ex: o `<button>`, nao a `<div>` envolvente).

Nos testes, use `screen.getByTestId()`. `getByRole`/`getByLabelText` complementam para a11y.

### O que sao "elementos interativos"

| Categoria | Elementos |
|---|---|
| Acionaveis | `<button>`, `<a>` |
| Inputs | `<input>`, `<textarea>`, `<select>` |
| Toggleaveis | checkbox, radio, switch |
| Compostos | modal, dropdown, tabs, accordion |

### Regra pratica

- Vai **fazer algo** com o elemento (click, type, toggle) -> `getByTestId`
- Vai apenas **verificar** que um texto aparece (mensagens de erro, label de preco) -> `getByText` ou `getByRole` aceitos

### Proibido

- `getByText` para selecao de elemento interativo
- XPath
- Classes CSS
- Seletores por texto visivel em elementos que recebem acao

### Listas e elementos dinamicos

Quando houver multiplos elementos do mesmo tipo (lista de itens), o `data-testid` deve incluir um identificador unico da entidade -- nunca o indice do array.

- **BOM:** `btn-delete-item-${productId}`, `chk-select-store-${storeId}`
- **RUIM:** `btn-delete-item-0`, `chk-select-store-1` (quebra com reordenacao/filtro)

### Acessibilidade (a11y)

Use `vitest-axe` pontualmente apenas em componentes com padrao de a11y complexo (modal, dialog, menu, combobox) ou para cercar bug recorrente. Nao e obrigatorio em todo unit test.

---

## 4. Interacao

- `userEvent` obrigatorio para simular interacao (focus, blur, keydown, delays realistas)
- `fireEvent` so quando `userEvent` nao suporta o evento

### Importacao do userEvent

Sempre importar do `test-utils` do projeto -- **nunca** direto de `@testing-library/user-event`.

```typescript
// RUIM
import userEvent from '@testing-library/user-event'

// BOM
import { render, screen, userEvent } from './test/test-utils'
```

```typescript
const user = userEvent.setup()

await user.click(screen.getByTestId('btn-submit-order'))
await user.type(screen.getByTestId('input-user-cpf'), '123.456.789-09')
```

### Prevencao de flaky tests

**Regra 1:** Prefira `await screen.findBy*` em vez de `getBy*` dentro de `waitFor()`.

```typescript
// RUIM
await waitFor(() => {
  expect(screen.getByTestId('modal-open-success')).toBeInTheDocument()
})

// BOM
expect(await screen.findByTestId('modal-open-success')).toBeInTheDocument()
```

Use `waitFor` apenas para validar **ausencia** (`waitFor(() => expect(screen.queryByTestId('spinner')).not.toBeInTheDocument())`) ou assertion sem query.

**Regra 2:** Proibido `expect` imediato apos acao assincrona.

```typescript
// RUIM -- estado ainda nao atualizou
await user.click(screen.getByTestId('btn-submit-order'))
expect(screen.getByTestId('modal-open-success')).toBeInTheDocument()

// BOM
await user.click(screen.getByTestId('btn-submit-order'))
expect(await screen.findByTestId('modal-open-success')).toBeInTheDocument()
```

**Regra 3:** Proibido `setTimeout` e `sleep` no teste. Use `findBy`, `waitFor` ou `vi.useFakeTimers()` + `vi.advanceTimersByTime()`.

---

## 5. Mocks

### Regra de fronteira

Todas as chamadas de API/dados devem passar por uma camada bem definida (cliente HTTP, hooks de query, services). Testes mockam essa **fronteira**, nao `fetch`/`axios` diretamente nem o componente sob teste.

### O que mockar

- Hooks de dados (TanStack Query, hooks de API customizados)
- Servicos externos (analytics, geolocalizacao, storage)
- Modulos third-party com side effects (`react-router`, `next-intl`, etc.)

### O que NAO mockar

- O componente sob teste
- Hooks internos da mesma feature (logica de UI)
- `useState`/`useContext` do componente

### TypeScript strict tambem em mocks

`any` proibido inclusive em mocks.

```typescript
// RUIM
const mockUseCart = vi.fn() as any

// BOM
const mockUseCart = vi.fn<[], ReturnType<typeof useCart>>()
```

### Test doubles padronizados

Mocks vivem proximos dos testes que os consomem, em `src/mocks/` por dominio (`cart.ts`, `users.ts`).

Nomenclatura por cenario:

- `mockUseCartDefault` -- carrinho padrao com 1-2 itens
- `mockUseCartEmpty` -- estado vazio
- `mockUseCartWithError` -- com erro

Antes de criar um mock novo, procure em `src/mocks/` se ja existe.

### Uso de `vi.hoisted()`

`vi.mock()` e elevado para o topo do arquivo. Para referenciar variaveis no `vi.mock()`, use `vi.hoisted()`:

```typescript
const { mockUseCart } = vi.hoisted(() => ({
  mockUseCart: vi.fn<[], ReturnType<typeof useCart>>(),
}))

vi.mock('@/features/cart/hooks', () => ({
  useCart: mockUseCart,
}))

it('should show empty state when cart has no items', () => {
  mockUseCart.mockReturnValue({ items: [], total: 0 })
})
```

### MSW (Mock Service Worker)

MSW e permitido para testes que precisam validar parsing de resposta HTTP, error handling no protocolo (status codes, retries) ou contratos de API end-to-end. Para testes de UI, prefira mockar a camada de dados (hook/service) -- e mais simples e mais rapido.

### Setup global

`src/test/setup.ts` cuida de cleanup automatico (`afterEach(cleanup)`) e import do `jest-dom`. Para mocks globais (matchMedia, ResizeObserver, etc.), adicione la antes de criar mock manual em testes individuais.

---

## 6. Dados de Teste

### Factory functions (obrigatorias para tipos complexos)

Tipagem completa, sem `any`. Dados realistas em pt-BR:

```typescript
const createUser = (overrides?: Partial<User>): User => ({
  id: crypto.randomUUID(),
  name: 'Juliana Santos',
  email: 'juliana.santos@email.com.br',
  cpf: '123.456.789-09',
  phone: '(11) 99876-5432',
  ...overrides,
})
```

**Proibido:** `'abc'`, `'teste'`, `'foo'`, `'bar'`, `'user1'`, `'test@test.com'`.

### Wrappers semanticos

Alem da factory base, crie wrappers que comunicam a intencao do cenario.

```typescript
const createValidUser = () => createUser()
const createUserWithInvalidCPF = () => createUser({ cpf: '111.111.111-11' })
const createUserWithExpiredSession = () => createUser({ sessionExpiresAt: new Date('2020-01-01') })

const createEmptyCart = () => ({ items: [], total: 0 })
const createCartWithSingleItem = () => ({ items: [createCartItem()], total: 4590 })
```

No teste:

```typescript
it('should display error message when CPF is invalid', async () => {
  mockUseUser.mockReturnValue(createUserWithInvalidCPF())
})
```

Regra: se o mesmo cenario aparece em 2+ testes, extraia como wrapper.

---

## 7. Testes de Integracao

Testar o componente como um todo: UI + hooks + side-effects.

### Pass-through nao testa isoladamente

Componentes que **apenas repassam** props sem condicional/transformacao nao precisam de teste isolado -- ja sao cobertos pelo teste do consumidor.

**Obrigatorio testar: Orquestradores.** Componentes que unem multiplos dominios (Carrinho + Pagamento, Login + Navegacao). Foco no **wiring**: validar que dominios se comunicam e o fluxo do usuario atravessa o orquestrador.

### Asserts por comportamento

Multiplos `expects` sao bem-vindos desde que contem uma historia linear:

> clicou em submit -> exibiu loading -> removeu loading -> exibiu sucesso

Evitar: asserts sem relacao entre si.

### Cobertura de estados da UI

Componente que consome dados assincronos deve cobrir os 4 estados:

| Estado | O que validar |
|---|---|
| **Loading** | Skeletons, spinners |
| **Error** | Mensagem de fallback, botao retry |
| **Empty** | Layout sem dados |
| **Success** | Renderizacao com dados reais |

### Transicoes entre estados (obrigatorio)

Bugs comuns estao na transicao. Cubra ao menos uma sequencia: `loading -> success`, `loading -> error`, `error -> retry -> success`.

```typescript
it('should recover from error when user retries', async () => {
  const user = userEvent.setup()
  mockFetchStores
    .mockRejectedValueOnce(new Error('Network error'))
    .mockResolvedValueOnce([createStore()])

  render(<StoreList />)

  expect(await screen.findByTestId('modal-open-error')).toBeInTheDocument()

  await user.click(screen.getByTestId('btn-open-retry'))
  expect(await screen.findByTestId('list-stores')).toBeInTheDocument()
  expect(screen.queryByTestId('modal-open-error')).not.toBeInTheDocument()
})
```

### Side-effects invisiveis (obrigatorio validar)

| Side-effect | Como validar |
|---|---|
| Navegacao | mock de `useNavigate`/`router` -> `expect(mockNavigate).toHaveBeenCalledWith('/checkout')` |
| Analytics | mock do hook -> `expect(mockTrack).toHaveBeenCalledWith('checkout_submitted', { ... })` |
| `localStorage` | spy em `setItem`/`getItem` |
| `postMessage`, `window.location` | `vi.spyOn(window, ...)` |

### Cobertura de risco

Cobertura de linhas e metrica secundaria. A obrigatoriedade e manter testes de integracao ponta-a-ponta nos fluxos criticos do projeto (login, checkout, fluxos de dinheiro/dado sensivel).

---

## 8. Testes de Hooks Customizados

`renderHook` do `@testing-library/react` apenas quando o hook representa **logica reutilizavel**.

### Testar isoladamente

- Hooks com calculo complexo (calculo de frete, agrupamento)
- Hooks que orquestram multiplos side-effects
- Hooks reutilizados por varios componentes

### NAO testar isoladamente

- Wrappers simples de `useState`/`useMemo`
- Hooks "casca" que apenas repassam
- Hooks usados por um unico componente (ja coberto pelo teste de integracao)

---

## 9. Testes de Snapshot

Snapshots de DOM sao **proibidos** em componentes de negocio. Geram testes fragies que falham a cada alteracao trivial.

Permitido apenas em:
- Componentes verdadeiramente puros (atomos do design system) com estabilidade estrutural
- Validar payloads massivos de funcoes utilitarias

Sempre prefira asserts explicitos. Snapshot e ultimo recurso.

---

## 10. Anti-patterns

| Anti-pattern | Por que e ruim | O que fazer |
|---|---|---|
| Varios `toBeInTheDocument()` sem contexto | Checklist de DOM, nao valida comportamento | Validar intencao |
| Depender de `className`, `style`, state | Acopla a implementacao | Usar `data-testid` |
| Mockar tudo | Teste nao prova que o componente funciona | Mockar apenas fronteira |
| Asserts sem relacao | Teste sem foco | Agrupar so se contam historia linear |
| `any` em mocks | Perde type-safety | Tipar todos os mocks |

---

## 11. Custom Render

Use `src/test/test-utils.tsx`. Ele exporta `render`, `screen`, `userEvent` configurados.

Quando adicionar Providers (TanStack Query, Router, Theme), envolva no `customRender`:

```typescript
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, PropsWithChildren } from 'react'

const Providers = ({ children }: PropsWithChildren) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: Providers, ...options })

export * from '@testing-library/react'
export { customRender as render }
export { userEvent }
```

**Sempre usar o custom render, nunca o `render` direto do `@testing-library/react`.** Idem para `userEvent`.

---

## 12. Limpeza e Memory Leaks

- Cleanup automatico ja configurado em `src/test/setup.ts` (`afterEach(cleanup)`)
- Se o teste usar `vi.useFakeTimers()`, deve chamar `vi.useRealTimers()` no `afterEach`
- Aguarde toda operacao async antes do fim do teste (ver Secao 4)
- Para portais (modais) ou listeners manuais em `useEffect`, valide que foram removidos
