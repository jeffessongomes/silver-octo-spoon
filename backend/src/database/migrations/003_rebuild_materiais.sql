-- Recria tabela materiais: adiciona CHECK constraint em tipo
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS materiais_v2 (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  fase_id TEXT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('PDF', 'PNG', 'DOC', 'XLS', 'LINK', 'VIDEO')),
  url TEXT,
  ordem INTEGER DEFAULT 0,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fase_id) REFERENCES fases(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

INSERT INTO materiais_v2 (id, cliente_id, fase_id, nome, tipo, url, ordem, criado_em, atualizado_em)
  SELECT id, cliente_id, fase_id, nome, tipo, url, ordem, criado_em, atualizado_em
  FROM materiais;

DROP TABLE materiais;
ALTER TABLE materiais_v2 RENAME TO materiais;

CREATE INDEX IF NOT EXISTS idx_materiais_cliente ON materiais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_materiais_fase ON materiais(fase_id);

PRAGMA foreign_keys = ON;
