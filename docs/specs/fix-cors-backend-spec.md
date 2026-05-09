# Spec Tecnica — fix/cors-backend

**Ticket:** fix-cors-backend  
**Tipo:** bug fix  
**Data:** 2026-05-08  
**Status:** aprovada — pronta para implementar com `/proj-impl`

---

## Objetivo

Corrigir o erro de CORS que impede o frontend React (Vite, `http://localhost:5173`) de acessar o backend Express (`http://localhost:3001`) em ambiente de desenvolvimento.

**Causa raiz identificada:** Em `backend/src/app.ts`, quando a variavel de ambiente `CORS_ORIGIN` e definida como string vazia (`CORS_ORIGIN=` no `.env`), o operador `??` (nullish coalescing) nao ativa o valor padrao — ele so substitui `null` e `undefined`. O resultado e `allowedOrigins = ['']`, que nao faz match com nenhuma origem real, bloqueando todos os requests CORS.

---

## Modelo de Dados

Nao ha mudancas de modelo de dados ou entidades. A correcao e exclusivamente na configuracao de middleware.

---

## Regras de Negocio

- O backend deve aceitar requests de `http://localhost:5173` em desenvolvimento quando `CORS_ORIGIN` nao estiver configurada (vazia ou ausente).
- Quando `CORS_ORIGIN` estiver configurada com uma ou mais origens separadas por virgula, essas origens devem ser usadas.
- Strings vazias resultantes do split/trim devem ser ignoradas (filtradas).
- A configuracao de CORS nao deve regredir para producao (variavel preenchida continua funcionando normalmente).

---

## Criterios de Aceite

**Dado** que o backend esta rodando na porta 3001 com `CORS_ORIGIN=` (vazio) no `.env`  
**Quando** o frontend React faz um request para `http://localhost:3001/api/clientes/estefania/painel`  
**Entao** o preflight OPTIONS retorna status 200 com o header `Access-Control-Allow-Origin: http://localhost:5173`

**Dado** que `CORS_ORIGIN=https://meuapp.com,https://admin.meuapp.com` no `.env`  
**Quando** o frontend de `https://meuapp.com` faz um request  
**Entao** o CORS permite a origem configurada (regressao nao quebra)

**Dado** que `CORS_ORIGIN=` (vazio) no `.env`  
**Quando** a aplicacao inicializa  
**Entao** `allowedOrigins` nao contem strings vazias `['']`

---

## Edge Cases

1. **`CORS_ORIGIN` ausente (undefined):** `process.env.CORS_ORIGIN` e `undefined` → `|| 'http://localhost:5173'` ativa o fallback corretamente.
2. **`CORS_ORIGIN` com espacos extras:** `'http://localhost:5173 , https://outro.com '` → `trim()` + `filter(Boolean)` garantem limpeza.
3. **`CORS_ORIGIN` com virgula no final:** `'http://localhost:5173,'` → `filter(Boolean)` remove a string vazia resultante.
4. **Producao com `CORS_ORIGIN` preenchido:** comportamento identico ao atual, sem regressao.

---

## UI

Nao ha mudancas de UI. O fix e transparente para o usuario final — o erro de CORS deixa de aparecer no console do browser.

---

## Arquitetura

### Arquivo a modificar

**`backend/src/app.ts` — linha 10**

```ts
// ANTES (bug)
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

// DEPOIS (fix)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
```

**Mudancas:**
- `??` → `||`: captura string vazia alem de `null`/`undefined`
- `.filter(Boolean)`: remove strings vazias apos split (edge cases 2 e 3)

### Nenhum outro arquivo precisa ser alterado

A causa e isolada em uma unica linha. `src/lib/api.ts`, `vite.config.ts` e demais arquivos permanecem inalterados.

---

## Dependencias de Infraestrutura

Nenhuma dependencia de infraestrutura identificada.

---

## Estrategia de Testes

### Testes unitarios — `backend/src/app.test.ts` (criar)

Testar a funcao `createApp()` ou extrair a logica de parsing de `allowedOrigins` em funcao pura testavel:

| Cenario | Entrada `CORS_ORIGIN` | `allowedOrigins` esperado |
|---|---|---|
| Variavel ausente (`undefined`) | `undefined` | `['http://localhost:5173']` |
| Variavel vazia (`''`) | `''` | `['http://localhost:5173']` |
| Origem unica | `'https://meuapp.com'` | `['https://meuapp.com']` |
| Multiplas origens | `'https://a.com,https://b.com'` | `['https://a.com', 'https://b.com']` |
| Com espacos | `' https://a.com , https://b.com '` | `['https://a.com', 'https://b.com']` |
| Virgula no final | `'https://a.com,'` | `['https://a.com']` |

> Estrategia: extrair a logica de parsing em funcao pura `parseAllowedOrigins(env?: string): string[]` para facilitar o teste unitario sem precisar subir o servidor Express.

### Teste de integracao (manual/smoke)

1. Iniciar backend: `cd backend && pnpm dev`
2. Iniciar frontend: `pnpm dev`
3. Abrir `http://localhost:5173`
4. Verificar no DevTools → Network: request para `/api/clientes/estefania/painel` retorna dados sem erro de CORS

---

## Fora de Escopo

- Configuracao de CORS para producao (nao e escopo deste fix)
- Vite proxy (alternativa descartada — nao resolve producao)
- Adicionar `X-Client-ID` automaticamente no `api.ts` (problema separado, se existir)
- Mudancas em qualquer arquivo fora de `backend/src/app.ts`
- Autenticacao ou logica de negocio das rotas
