-- Recria tabela fases: remove coluna status, adiciona CHECK constraints
-- Status passa a ser campo calculado em memoria pela aplicacao
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS fases_v2 (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  numero TEXT NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT,
  tipo TEXT CHECK (tipo IS NULL OR tipo IN ('extra')),
  ordem INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1 CHECK (ativo IN (0, 1)),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

INSERT INTO fases_v2 (id, cliente_id, numero, titulo, resumo, tipo, ordem, ativo, criado_em, atualizado_em)
  SELECT id, cliente_id, numero, titulo, resumo, tipo, ordem, ativo, criado_em, atualizado_em
  FROM fases;

DROP TABLE fases;
ALTER TABLE fases_v2 RENAME TO fases;

CREATE INDEX IF NOT EXISTS idx_fases_cliente ON fases(cliente_id);

PRAGMA foreign_keys = ON;
