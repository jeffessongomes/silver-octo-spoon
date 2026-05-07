# Painel Estefania Backend

Backend para Painel Estefania desenvolvido com **Express.js + Node.js + SQLite + TypeScript**.

## Stack

- **Node.js** 18+
- **Express.js** 4.x
- **SQLite3** 5.x
- **TypeScript** 5.x
- **Vitest** (testes)
- **Supertest** (testes HTTP)

## Estrutura do Projeto

```
backend/
  src/
    shared/        # tipos compartilhados, erros, utilitários
    database/      # inicialização SQLite, schema
    repositories/  # acesso a dados (padrão Repository)
    services/      # lógica de negócio
    controllers/   # handlers HTTP
    middleware/    # autenticação, validação, erros
    routes/        # definição de rotas
    app.ts         # setup Express
    server.ts      # entry point
  tests/
    unit/          # testes unitários
    integration/   # testes de API
    fixtures/      # dados de teste
  package.json
  tsconfig.json
  .env.example
```

## Setup Inicial

1. **Instalar dependências**
   ```bash
   pnpm install
   ```

2. **Configurar ambiente**
   ```bash
   cp .env.example .env
   ```

3. **Inicializar banco de dados**
   ```bash
   npm run dev
   ```
   O banco será criado automaticamente ao iniciar o servidor.

## Comandos

```bash
pnpm dev              # dev server (http://localhost:3000)
pnpm build            # build de produção
pnpm preview          # preview do build
pnpm test             # testes (run once)
pnpm test:watch       # testes em watch
pnpm test:coverage    # testes com cobertura
pnpm lint             # ESLint
pnpm type-check       # tsc --noEmit
```

## Autenticação (MVP)

Por enquanto, utilizamos um header simples de cliente:

```
X-Client-ID: estefania
```

Em produção, seria utilizado JWT + roles.

## API Endpoints

Base URL: `http://localhost:3000/api`

Ver `spec` em `/docs/specs/painel-estefania-backend-spec.md` para detalhes completos.

### Exemplos

```bash
# Criar cliente
curl -X POST http://localhost:3000/api/clientes \
  -H "Content-Type: application/json" \
  -d '{"id": "estefania", "nome": "Estefania"}'

# Obter painel completo
curl -X GET http://localhost:3000/api/clientes/estefania/painel \
  -H "X-Client-ID: estefania"

# Toggle tarefa
curl -X PATCH http://localhost:3000/api/clientes/estefania/tarefas/t1-1 \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: estefania" \
  -d '{"concluida": true}'
```

## Spec Técnica

Ver `/docs/specs/painel-estefania-backend-spec.md` para:
- Modelo de dados (esquema SQLite)
- Critérios de aceite
- API REST completa
- Arquitetura em camadas
- Estratégia de testes

## Desenvolvimento

### Convenções de Código

- **TypeScript strict mode**: `any` é proibido
- **Tratamento de erro explícito**: sempre valide entradas e lance erros tipados
- **Pattern Repository**: acesso a dados isolado
- **Pattern Service**: lógica de negócio reutilizável
- **Tests**: TDD (RED → GREEN → REFACTOR)

### Validação Pós-Edição

Após editar código, sempre rode:

```bash
pnpm lint
pnpm type-check
pnpm test
```

## Próximas Etapas

- [ ] Implementar setup de banco de dados
- [ ] Criar tipos compartilhados
- [ ] Implementar repositories
- [ ] Implementar services
- [ ] Implementar controllers
- [ ] Implementar middleware
- [ ] Integração com frontend
