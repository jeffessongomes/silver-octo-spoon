-- Schema SQLite para Painel Estefania
-- Baseado em: painel-estefania-backend-spec

-- Clientes (white-label)
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fases (roadmap)
CREATE TABLE IF NOT EXISTS fases (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  numero TEXT NOT NULL,            -- 'Fase 01 · Mes 1'
  titulo TEXT NOT NULL,
  resumo TEXT,
  status TEXT DEFAULT 'pending',   -- done | active | pending
  tipo TEXT,                        -- extra (opcional)
  ordem INTEGER DEFAULT 0,          -- para ordenacao
  ativo BOOLEAN DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id TEXT PRIMARY KEY,
  fase_id TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  texto TEXT NOT NULL,
  concluida BOOLEAN DEFAULT 0,
  ordem INTEGER DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fase_id) REFERENCES fases(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Observacoes (uma por tarefa)
CREATE TABLE IF NOT EXISTS observacoes (
  id TEXT PRIMARY KEY,
  tarefa_id TEXT NOT NULL,
  cliente_id TEXT NOT NULL,
  conteudo TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  UNIQUE(tarefa_id)                 -- uma observacao por tarefa
);

-- Materiais (biblioteca global + por fase)
CREATE TABLE IF NOT EXISTS materiais (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  fase_id TEXT,                     -- NULL = item de biblioteca global
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,               -- PDF | PNG | DOC | XLS | LINK | VIDEO
  url TEXT,                         -- '' | '#' = pendente
  ordem INTEGER DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fase_id) REFERENCES fases(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Indices para queries comuns
CREATE INDEX IF NOT EXISTS idx_fases_cliente ON fases(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente ON tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_fase ON tarefas(fase_id);
CREATE INDEX IF NOT EXISTS idx_observacoes_cliente ON observacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_materiais_cliente ON materiais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_materiais_fase ON materiais(fase_id);
