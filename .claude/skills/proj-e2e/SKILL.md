---
name: proj-e2e
description: Gera testes E2E Playwright a partir da spec e codigo do projeto. Scaffolda Playwright na primeira execucao.
argument-hint: "[ticket-id-ou-feature] [--scaffold]"
---

# Proj E2E -- Gerador de Testes E2E (Playwright)

Gera testes E2E Playwright a partir da spec/CAs e do codigo-fonte do projeto. Na primeira execucao, scaffolda a estrutura Playwright. Gera Page Objects e arquivos `.spec.ts`.

## IMPORTANT

Esta skill nao executa testes. Apenas gera arquivos.

Nao instala dependencias automaticamente -- exibe os comandos para o usuario rodar.

## Language

Always respond in Portuguese (pt-BR).

## O que esta skill NAO faz

- Nao executa testes (apenas gera os arquivos)
- Nao instala dependencias sem confirmacao
- Nao altera codigo de producao (apenas cria/atualiza arquivos em `e2e/`)

## Estrategia de Seletores

Ao gerar testes, usar seletores nesta ordem:

| Prioridade | Tipo | Exemplo Playwright |
|---|---|---|
| 1 | `data-testid` | `page.getByTestId('btn-submit-order')` |
| 2 | Role ARIA | `page.getByRole('button', { name: 'Enviar' })` |
| 3 | Texto visivel | `page.getByText('Confirmar pedido')` |
| 4 | CSS (ultimo recurso) | `page.locator('.form-submit')` |

**Regra:** Nunca usar CSS se houver `data-testid`, role ou texto. CSS quebra com refatoracao.

## Phase 0 -- Preflight

1. Verificar `package.json` com dependencia `react`. Se nao for projeto React: encerrar.
2. Verificar branch atual. Se em branch protegida, alertar.

## Phase 1 -- Parsing

**1.1 Argumento**

`$ARGUMENTS` = ticket-id ou feature-slug.
- Se nao fornecido: encerrar com "Uso: /proj-e2e [ticket-id-ou-feature] [--scaffold]"

**1.2 Flag**

- `--scaffold`: forca scaffold mesmo se `e2e/` ja existe.

**1.3 Output paths**

- Testes: `e2e/tests/[ticket-id]-[feature-slug].spec.ts`
- Page Objects: `e2e/page-objects/[page-name].page.ts`
- Fixtures: `e2e/fixtures/[fixture-name].ts`
- Documentacao: `docs/test-cases/[ticket-id]-e2e.md`

## Phase 2 -- Scaffold (se necessario)

**Condicao:** rodar se `e2e/` nao existe OU `--scaffold` foi passado.

Se `e2e/` ja existe e nao tem `--scaffold`: pular.

**2.1 Criar estrutura**

```
e2e/
  playwright.config.ts
  page-objects/
  fixtures/
  tests/
  .env.example
```

**2.2 `e2e/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**2.3 `e2e/.env.example`**

```
BASE_URL=http://localhost:5173

# TEST_USER_EMAIL=
# TEST_USER_PASSWORD=
```

**2.4 Sugerir scripts e dependencias**

Exibir no terminal (NAO modificar package.json automaticamente):

```
Adicione ao package.json:
  "test:e2e": "playwright test --config=e2e/playwright.config.ts",
  "test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui",
  "test:e2e:headed": "playwright test --config=e2e/playwright.config.ts --headed"

Instale as dependencias:
  pnpm add -D @playwright/test dotenv
  npx playwright install chromium
```

Perguntar: "Deseja que eu adicione os scripts e instale as dependencias agora? (sim/nao)"

## Phase 3 -- Coleta de Contexto

**3.1 Ler spec**

Procurar `docs/specs/[ticket-id]-spec.md`.

Se nao encontrada: perguntar ao usuario por uma descricao da feature ou listagem de cenarios.

Extrair:
- Criterios de aceite (formato Dado/Quando/Entao)
- Cenarios de UI / fluxos do usuario
- Edge cases

**3.2 Analisar codigo-fonte**

Buscar componentes/rotas relacionadas:

1. Extrair keywords do titulo + CAs
2. Buscar em `src/`:
   - Rotas (se router configurado)
   - Componentes com `data-testid` que matcham keywords
   - Formularios e validacoes
3. Para cada componente: extrair `data-testid`, roles, textos de botoes, inputs

Limite: 15 arquivos. Priorizar por relevancia ao titulo.

Reportar: "Analisados N arquivos. Encontrados N seletores reais."

## Phase 4 -- Analise de Gaps

Comparar cenarios da spec com codigo. Identificar:

1. Elemento da spec nao encontrado no codigo
2. Navegacao ambigua entre paginas
3. Dados de teste necessarios (estado previo, login)
4. Permissoes/perfis de usuario
5. Ambiente externo (APIs)

Apresentar duvidas **uma por vez**, max 5:

> **Duvida 1/N:** O cenario "[titulo]" menciona [acao], mas nao encontrei [elemento]. Qual seletor usamos?
> a) [sugestao baseada no codigo]
> b) [outra]
> c) Vou marcar como TODO

Gaps nao resolvidos viram comentarios `// TODO:` nos testes.

## Phase 5 -- Geracao

**5.1 Page Objects**

Para cada pagina nos cenarios, criar/atualizar `e2e/page-objects/[page-name].page.ts`:

```typescript
import { type Page, type Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly cpfInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cpfInput = page.getByTestId('input-user-cpf');
    this.submitButton = page.getByTestId('btn-submit-order');
  }

  async navigate() {
    await this.page.goto('/checkout');
  }

  async fillCpf(cpf: string) {
    await this.cpfInput.fill(cpf);
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

Regras:
- 1 Page Object por pagina/rota
- Seletores como `readonly` no construtor
- Metodos semanticos para acoes (`fillLoginForm`, `submitOrder`)
- Se Page Object existe: adicionar metodos sem sobrescrever

**5.2 Arquivos de teste**

`e2e/tests/[ticket-id]-[feature-slug].spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../page-objects/checkout.page';

// Ticket: [ticket-id] - [titulo]
// Spec: docs/specs/[ticket-id]-spec.md
// Gerado por /proj-e2e em [YYYY-MM-DD]

test.describe('Checkout', () => {
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    await checkoutPage.navigate();
  });

  // Cenario 1: [titulo]
  test('should display success message when order is submitted with valid CPF', async ({ page }) => {
    // Dado: [pre-condicao]
    // Quando: [acao]
    await checkoutPage.fillCpf('123.456.789-09');
    await checkoutPage.submit();

    // Entao: [resultado esperado]
    await expect(page.getByTestId('modal-open-success')).toBeVisible();
  });
});
```

Regras:
- Comentario topo com link para spec
- 1 `test()` por cenario da spec
- Comentarios `// Dado:`, `// Quando:`, `// Entao:` para BDD
- Nome de teste em ingles
- Seletor nao encontrado: placeholder + `// TODO: verificar seletor`

**5.3 Fixtures (se necessario)**

`e2e/fixtures/[name].ts`:

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend<{
  loggedInUser: { email: string; token: string };
}>({
  loggedInUser: async ({}, use) => {
    const data = { email: 'juliana.santos@email.com.br', token: 'test-token' };
    await use(data);
  },
});

export { expect } from '@playwright/test';
```

## Phase 6 -- Apresentacao

**6.1 Resumo no terminal**

```
Testes E2E gerados para [ticket-id] - "[titulo]"

Arquivos criados/modificados:
- e2e/page-objects/[page].page.ts (novo)
- e2e/tests/[ticket-id]-[feature].spec.ts (novo)

| Arquivo | Cenarios | Page Objects |
|---|---|---|
| [filename].spec.ts | N | [PageName]Page |

Total: N testes em N arquivos
TODOs pendentes: N seletores
```

**6.2 Salvar documentacao**

`docs/test-cases/[ticket-id]-e2e.md`:

```markdown
# Testes E2E -- [ticket-id] [titulo]

**Ticket:** [ticket-id]
**Spec:** docs/specs/[ticket-id]-spec.md
**Gerado em:** [YYYY-MM-DD]

## Mapeamento Cenario -> Teste

| Cenario | Arquivo | Test name |
|---|---|---|

## Page Objects

| Page Object | Pagina | Seletores |
|---|---|---|

## Execucao

```bash
pnpm test:e2e
pnpm test:e2e:ui          # com browser
pnpm test:e2e:headed      # com browser visivel
pnpm test:e2e -- --grep "[nome]"
```

## TODOs

- [ ] [seletor a verificar]
```

**6.3 Pedir revisao**

> "Testes gerados. Quer ajustar antes de finalizar? (seletores, cenarios, Page Object)"

**6.4 Proximos passos**

```
1. Revise os arquivos e resolva TODOs
2. Instale: pnpm add -D @playwright/test dotenv && npx playwright install chromium
3. Configure .env: cp e2e/.env.example e2e/.env
4. Rode: pnpm test:e2e
```

## Tratamento de Erros

| Cenario | Comportamento |
|---|---|
| Nao e projeto React | Encerrar |
| Spec nao encontrada | Pedir descricao manual da feature |
| Componente nao encontrado | Placeholder + `// TODO:` |
| Page Object existe | Adicionar metodos, preservar existentes |
| Arquivo de teste existe | Perguntar: sobrescrever ou adicionar cenarios? |

## Limitacoes

- Depende de spec ou descricao manual da feature
- Se componentes nao usam `data-testid`/role, seletores podem ser frageis -- adicionar `data-testid` no codigo de producao
- Testes E2E precisam da app rodando (`pnpm dev` ou ambiente acessivel)
- Login/estados previos podem precisar de fixtures customizadas
