# Spec Tecnica — Configuracao de CORS no Backend

**Ticket ID:** cors-backend-config  
**Data:** 2026-05-07  
**Status:** Aguardando aprovacao  
**Branch proposta:** `fix/cors-backend-config` (a partir de `master`)

---

## Objetivo

Habilitar requisicoes cross-origin do frontend React (`http://localhost:5173`) para a API Express (`http://localhost:3001`), eliminando o erro:

```
Access to XMLHttpRequest at 'http://localhost:3001/api/clientes/2/biblioteca'
from origin 'http://localhost:5173' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

O backend atualmente nao possui nenhum middleware de CORS configurado em `backend/src/app.ts`. Como o frontend usa o header customizado `X-Client-ID` para autenticacao, todo request dispara um preflight `OPTIONS` que o servidor nao responde corretamente.

**Abordagem escolhida:** CORS middleware no backend via pacote `cors`.

---

## Modelo de Dados

Nenhuma alteracao em entidades ou banco de dados. Esta spec afeta exclusivamente a camada de middleware HTTP.

**Tipos envolvidos (sem alteracao):**

```typescript
// Ja existentes — nenhuma modificacao necessaria
// backend/src/shared/types.ts
// src/features/panel/types.ts
```

---

## Regras de Negocio

1. O backend deve responder ao preflight `OPTIONS` com status `200` e os headers CORS corretos.
2. Os headers obrigatorios na resposta CORS:
   - `Access-Control-Allow-Origin`: apenas origins explicitamente permitidas (nunca `*` em producao)
   - `Access-Control-Allow-Methods`: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers`: `Content-Type, X-Client-ID`
   - `Access-Control-Max-Age`: `86400` (cache do preflight por 24h)
3. O header `X-Client-ID` deve estar em `allowedHeaders` — e obrigatorio pelo middleware de autenticacao do backend.
4. A origin permitida deve ser configuravel via variavel de ambiente `CORS_ORIGIN` para suportar diferentes ambientes (dev, staging, producao) sem alterar codigo.
5. Em desenvolvimento, o valor padrao de `CORS_ORIGIN` sera `http://localhost:5173`.
6. Credenciais (cookies) nao sao usadas — `credentials: false`.

---

## Criterios de Aceite

**Dado** que o frontend faz uma requisicao `POST /api/clientes/2/biblioteca` com header `Origin: http://localhost:5173` e `X-Client-ID: 2`  
**Quando** o browser envia o preflight `OPTIONS`  
**Entao** o servidor responde com status `200` e headers `Access-Control-Allow-Origin: http://localhost:5173` e `Access-Control-Allow-Headers: Content-Type, X-Client-ID`

---

**Dado** que o frontend faz `GET /api/clientes/2/biblioteca` com header `Origin: http://localhost:5173`  
**Quando** o request e enviado  
**Entao** a resposta contem `Access-Control-Allow-Origin: http://localhost:5173` e o body com os materiais

---

**Dado** que uma origin nao permitida (ex: `http://evil.com`) faz um request  
**Quando** o request e processado  
**Entao** o servidor NAO inclui `Access-Control-Allow-Origin` na resposta (comportamento padrao do pacote `cors` quando a origin nao consta na lista)

---

**Dado** que a variavel `CORS_ORIGIN` nao esta definida no `.env`  
**Quando** o servidor inicia  
**Entao** o fallback e `http://localhost:5173` (sem quebrar o servidor)

---

## Edge Cases

1. **Request sem header `Origin`** (ex: curl, Postman sem origin): deve funcionar normalmente — CORS so se aplica quando `Origin` esta presente.
2. **Header `X-Client-ID` ausente no preflight**: o browser nao envia o header real no `OPTIONS`, apenas declara via `Access-Control-Request-Headers`. O middleware `cors` responde com `allowedHeaders` configurado e o browser prossegue.
3. **Multiplas origins** (ex: dev local + staging): `CORS_ORIGIN` pode receber uma lista separada por virgula. O codigo deve fazer o parse para array.
4. **Metodos nao listados** (ex: `PATCH`): estao incluidos em `methods` mesmo sem uso imediato para nao bloquear extensoes futuras.
5. **`OPTIONS` interceptado antes do middleware de auth**: o middleware `cors` deve ser registrado **antes** das rotas e do middleware `authClienteMiddleware` para que o preflight retorne `200` sem exigir `X-Client-ID`.

---

## UI

Nao ha alteracao de UI. Apos o fix:

- `useBiblioteca.ts` continuara funcionando sem modificacoes.
- O cliente HTTP (`src/lib/api.ts`) continuara enviando `X-Client-ID` via interceptor ou parametro.
- Erros de rede exibidos na UI deixarao de ocorrer para requisicoes legitimas.

---

## Arquitetura

### Arquivos a modificar

| Arquivo | Tipo | Mudanca |
|---|---|---|
| `backend/package.json` | Dependencia | Adicionar `cors` e `@types/cors` |
| `backend/src/app.ts` | Middleware | Registrar `cors()` antes das rotas |
| `backend/.env` | Config | Adicionar `CORS_ORIGIN=http://localhost:5173` |
| `backend/.env.example` | Documentacao | Adicionar `CORS_ORIGIN=` (sem valor) |

### Nenhum arquivo a criar.

### Implementacao em `backend/src/app.ts`

```typescript
import cors from 'cors'

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Client-ID'],
    maxAge: 86400,
  })
)
```

**Posicao no `app.ts`:** imediatamente apos `app.use(express.json())`, antes de `app.use('/api', createRouter())`.

**Motivo:** o middleware `cors` precisa processar o preflight `OPTIONS` antes que qualquer middleware de autenticacao ou rota seja avaliado.

---

## Dependencias de Infraestrutura

| Item | Tipo | Acao |
|---|---|---|
| `cors` | npm package (backend) | `pnpm add cors` no diretorio `backend/` |
| `@types/cors` | npm devDependency (backend) | `pnpm add -D @types/cors` no diretorio `backend/` |
| `CORS_ORIGIN` | Variavel de ambiente | Adicionar em `backend/.env` |

---

## Estrategia de Testes

Esta mudanca e de infraestrutura HTTP — o foco dos testes e validar o comportamento do middleware, nao logica de negocio.

### Testes de integracao do backend (obrigatorios)

Arquivo: `backend/src/middleware/cors.test.ts` (ou no arquivo de teste do `app.ts`)

Cenarios:

| Cenario | Metodo | Validar |
|---|---|---|
| Preflight de origin permitida | `OPTIONS /api/clientes/1/biblioteca` com `Origin: http://localhost:5173` | Status `200`, header `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Headers` inclui `X-Client-ID` |
| Request simples de origin permitida | `GET /health` com `Origin: http://localhost:5173` | Resposta contem `Access-Control-Allow-Origin` |
| Origin nao permitida | `GET /health` com `Origin: http://evil.com` | Resposta NAO contem `Access-Control-Allow-Origin` |
| Request sem Origin (curl/Postman) | `GET /health` sem header `Origin` | Resposta `200` sem erros CORS |

### Testes do frontend (nao necessarios)

O `useBiblioteca.ts` nao precisa de alteracao — os testes existentes continuam validos. CORS e resolvido na camada de rede, transparente para o hook.

### Validacao manual pos-implementacao

```bash
# Simular preflight do browser
curl -X OPTIONS http://localhost:3001/api/clientes/2/biblioteca \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, X-Client-ID" \
  -v

# Esperado: 200 com Access-Control-Allow-Origin: http://localhost:5173
```

---

## Fora de Escopo

- Configuracao de CORS para ambiente de producao (URL definitiva nao definida — adicionar a `CORS_ORIGIN` quando conhecida).
- Proxy Vite (`server.proxy`) — nao necessario com CORS configurado no backend.
- Alteracao do cliente HTTP (`src/lib/api.ts`) ou do hook `useBiblioteca.ts`.
- Autenticacao JWT ou alteracao do middleware `authClienteMiddleware`.
- Configuracao de CI/CD.
