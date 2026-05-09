# Spec Técnica — Auditoria e Conformidade de Banco de Dados (backend-db-audit)

**Criado em:** 2026-05-09  
**Branch:** feat/checklist-obs-redesign  
**Status:** Aguardando aprovação

---

## Objetivo

Auditar o backend contra boas práticas de banco de dados relacionais e corrigir os 5 gaps identificados:

1. Ausência de sistema de migrations versionadas
2. Problema N+1 em `PainelService.getPainelCompleto`
3. Campo `status` armazenado no banco mas recalculado em memória (risco de dessincronização)
4. Ausência de `CHECK` constraints para valores enumerados
5. Geração de IDs com colisão potencial

---

## Modelo de Dados

### Schema atual (resumo)

```
clientes (id, nome, descricao, ativo, criado_em, atualizado_em)
fases (id, cliente_id, numero, titulo, resumo, status*, tipo, ordem, ativo, criado_em, atualizado_em)
tarefas (id, fase_id, cliente_id, texto, concluida, ordem, criado_em, atualizado_em)
observacoes (id, tarefa_id, cliente_id, conteudo, criado_em, atualizado_em)
materiais (id, cliente_id, fase_id, nome, tipo, url, ordem, criado_em, atualizado_em)
```

`*` coluna `status` em `fases` será removida nesta spec.

### Schema proposto

**Remoção:** coluna `fases.status` — status passa a ser campo derivado calculado em memória.

**Adição de `CHECK` constraints:**

```sql
-- fases
ADD CHECK (tipo IN ('extra') OR tipo IS NULL)
ADD CHECK (ativo IN (0, 1))

-- tarefas
ADD CHECK (concluida IN (0, 1))

-- materiais
ADD CHECK (tipo IN ('PDF', 'PNG', 'DOC', 'XLS', 'LINK', 'VIDEO'))

-- clientes
ADD CHECK (ativo IN (0, 1))
```

**Adição de migration versioning:**

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  aplicado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tipos TypeScript (impactados)

```typescript
// FaseRow: remover campo status
interface FaseRow {
  id: string
  cliente_id: string
  numero: string
  titulo: string
  resumo: string
  // status: removido — calculado em memória
  tipo: FaseTipo | null
  ordem: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// FaseStatus permanece como tipo derivado
type FaseStatus = 'done' | 'active' | 'pending'
```

---

## Regras de Negócio

### Cálculo de status (sem alteração na lógica)

```
se total_tarefas == 0       → 'pending'
se concluidas == total      → 'done'
se concluidas > 0           → 'active'
caso contrário              → 'pending'
```

Status sempre derivado em memória. **Nunca** persistido no banco.

### Geração de IDs

Migrar de `tipo-timestamp-random` para `crypto.randomUUID()` (disponível em Node 15+, já na stack).

- IDs existentes não serão alterados (migração não retroativa)
- Apenas novos registros usarão UUID v4

### Migrations

- Arquivo numerado por versão: `backend/src/database/migrations/001_initial.sql`, `002_add_check_constraints.sql`, etc.
- Runner executa ao iniciar o servidor — aplica apenas migrations ainda não presentes em `schema_migrations`
- Rollback: não implementado nesta spec (SQLite tem suporte limitado a ALTER TABLE)

---

## Critérios de Aceite

**CA-1 — Migrations versionadas**
- Dado que o servidor inicia pela primeira vez em um banco vazio
- Quando o app sobe
- Então todas as migrations são aplicadas em ordem e registradas em `schema_migrations`

**CA-2 — Migrations idempotentes**
- Dado que o servidor reinicia com migrations já aplicadas
- Quando o app sobe novamente
- Então nenhuma migration é re-executada (sem erro, sem duplicação)

**CA-3 — Status removido do banco**
- Dado que uma tarefa é marcada como concluída
- Quando o endpoint retorna a fase
- Então `status` está presente na resposta JSON mas ausente na tabela `fases` do banco

**CA-4 — N+1 eliminado**
- Dado um painel com 10 fases, 50 tarefas e 30 materiais
- Quando `GET /api/clientes/:id/painel` é chamado
- Então o banco recebe no máximo 3 queries (clientes + fases+tarefas JOIN + materiais)

**CA-5 — CHECK constraints ativas**
- Dado que uma query tenta inserir `materiais.tipo = 'XLSX'` (valor inválido)
- Quando a inserção é executada
- Então o banco retorna erro de constraint

**CA-6 — IDs novos são UUID v4**
- Dado que uma nova tarefa é criada
- Quando o ID é inspecionado no banco
- Então ele segue o formato `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**CA-7 — Testes existentes continuam passando**
- Dado que todas as mudanças acima são aplicadas
- Quando `pnpm test` é executado no backend
- Então 0 testes falham

---

## Edge Cases

1. **Banco com dados existentes na coluna `status`:** a migration de remoção da coluna deve funcionar mesmo com dados — SQLite `ALTER TABLE DROP COLUMN` requer versão 3.35+; se indisponível, recriar a tabela via `CREATE TABLE ... AS SELECT` sem a coluna.

2. **Fase sem tarefas:** status calculado retorna `'pending'` — comportamento atual mantido.

3. **Migration parcialmente executada (crash no meio):** cada migration deve ser envolva em `BEGIN/COMMIT` para garantir atomicidade.

4. **UUID com colisão:** probabilidade desprezível (~1 em 5,3×10³⁶), mas tabelas possuem `PRIMARY KEY` que garante erro na inserção duplicada.

5. **Query JOIN retornando duplicatas:** ao fazer `LEFT JOIN` de materiais em fases com múltiplas tarefas, pode haver rows duplicadas — o mapeamento em memória deve agrupar por `fase_id`.

6. **Fase com 0 tarefas em JOIN:** o `LEFT JOIN` com tarefas deve retornar a fase mesmo sem tarefas — usar `LEFT JOIN`, nunca `INNER JOIN`.

---

## UI

Sem impacto em interface. Esta spec é exclusivamente backend.

---

## Arquitetura

### Arquivos a criar

| Arquivo | Descrição |
|---|---|
| `backend/src/database/migrations/001_initial.sql` | Schema inicial (extraído do schema.sql atual) |
| `backend/src/database/migrations/002_add_check_constraints.sql` | CHECK constraints para tipo, ativo, concluida |
| `backend/src/database/migrations/003_drop_fase_status.sql` | Remove coluna `fases.status` |
| `backend/src/database/migrationRunner.ts` | Runner que aplica migrations pendentes na inicialização |

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `backend/src/database/index.ts` | Chamar `runMigrations()` na inicialização, remover execução do schema.sql |
| `backend/src/repositories/FaseRepository.ts` | Remover `recalculateFaseStatus()`, remover `status` das queries INSERT/UPDATE, calcular status via `tarefas.concluida` nas queries SELECT |
| `backend/src/repositories/TarefaRepository.ts` | Migrar geração de ID para `crypto.randomUUID()` |
| `backend/src/repositories/MaterialRepository.ts` | Migrar geração de ID para `crypto.randomUUID()` |
| `backend/src/repositories/ObservacaoRepository.ts` | Migrar geração de ID para `crypto.randomUUID()` |
| `backend/src/repositories/ClienteRepository.ts` | Migrar geração de ID para `crypto.randomUUID()` |
| `backend/src/services/FaseService.ts` | Remover chamadas a `recalculateFaseStatus` |
| `backend/src/services/PainelService.ts` | Reescrever `getPainelCompleto` com query de JOIN único |

### Query proposta para N+1 (PainelService)

```sql
-- Query 1: Fases com tarefas e observações (via JOIN)
SELECT
  f.id AS fase_id, f.numero, f.titulo, f.resumo, f.tipo, f.ordem,
  t.id AS tarefa_id, t.texto, t.concluida, t.ordem AS tarefa_ordem,
  o.conteudo AS observacao
FROM fases f
LEFT JOIN tarefas t ON t.fase_id = f.id AND t.cliente_id = ?
LEFT JOIN observacoes o ON o.tarefa_id = t.id
WHERE f.cliente_id = ? AND f.ativo = 1
ORDER BY f.ordem ASC, t.ordem ASC

-- Query 2: Materiais (fases + biblioteca)
SELECT * FROM materiais
WHERE cliente_id = ?
ORDER BY fase_id NULLS LAST, ordem ASC
```

Resultado: 2 queries totais em vez de `2 + N` (onde N = número de fases).

---

## Dependências de Infraestrutura

| Item | Tipo | Motivo |
|---|---|---|
| SQLite >= 3.35 | Banco | `ALTER TABLE DROP COLUMN` — verificar versão em produção |
| Node.js >= 15 | Runtime | `crypto.randomUUID()` nativo |

Nenhuma biblioteca nova necessária.

---

## Estratégia de Testes

### Unitários (Repositories)

- `FaseRepository`: verificar que queries não incluem campo `status`, que status é calculado a partir de tarefas
- `TarefaRepository`: verificar que IDs novos seguem UUID v4
- Manter cobertura dos casos existentes (GET, CREATE, UPDATE, DELETE)

### Integração (Services)

- `PainelService.getPainelCompleto`: spy no banco para verificar número de queries ≤ 3
- `FaseService`: verificar que toggle de tarefa retorna fase com `status` correto sem chamar `recalculateFaseStatus`

### Migration Runner

- Teste de idempotência: rodar `runMigrations()` duas vezes, verificar que `schema_migrations` não duplica
- Teste de ordem: migrations são aplicadas em ordem crescente por versão

### CHECK constraints

- Teste negativo: inserir `materiais.tipo = 'INVALIDO'` e verificar erro de banco
- Teste negativo: inserir `fases.tipo = 'nao-existe'` e verificar erro

---

## Fora de Escopo

- Troca do banco de dados (SQLite permanece)
- ORM (sem introdução de Prisma, TypeORM, etc.)
- Backup e disaster recovery
- Alteração de IDs existentes no banco (migração retroativa de IDs)
- Rollback de migrations
- Multi-tenant sharding ou particionamento
- Mudanças no frontend / tipos compartilhados em `src/`
