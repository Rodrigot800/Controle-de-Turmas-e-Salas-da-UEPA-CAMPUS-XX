ALTER TABLE disciplinas
  ADD COLUMN IF NOT EXISTS codigo VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS disciplinas_codigo_unique
  ON disciplinas (LOWER(codigo))
  WHERE codigo IS NOT NULL;

ALTER TABLE professores
  ADD COLUMN IF NOT EXISTS lotacao VARCHAR(30);

CREATE TABLE IF NOT EXISTS importacoes_grade (
  id SERIAL PRIMARY KEY,
  turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE RESTRICT,
  ano_letivo INTEGER NOT NULL,
  semestre_letivo INTEGER NOT NULL CHECK (semestre_letivo IN (1, 2)),
  periodo_turma INTEGER,
  turno VARCHAR(20),
  texto_origem TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE alocacoes_periodo
  ALTER COLUMN sala_id DROP NOT NULL;

ALTER TABLE alocacoes_periodo
  ADD COLUMN IF NOT EXISTS ano_letivo INTEGER,
  ADD COLUMN IF NOT EXISTS semestre_letivo INTEGER,
  ADD COLUMN IF NOT EXISTS dias_semana INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
  ADD COLUMN IF NOT EXISTS periodos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS observacao TEXT,
  ADD COLUMN IF NOT EXISTS importacao_id INTEGER REFERENCES importacoes_grade(id) ON DELETE SET NULL;
