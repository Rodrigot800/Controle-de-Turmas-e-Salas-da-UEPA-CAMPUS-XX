CREATE TABLE cursos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  vagas INTEGER NOT NULL,
  semestres INTEGER NOT NULL
);

CREATE TABLE salas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  capacidade INTEGER,
  piso VARCHAR(20),
  tipo_sala VARCHAR(20)
);

CREATE TABLE turmas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  curso_id INTEGER NOT NULL,
  semestre_inicio INTEGER,
  ano_inicio INTEGER,
  turno VARCHAR(20),
  FOREIGN KEY (curso_id) 
    REFERENCES cursos(id)
    ON DELETE RESTRICT
);

CREATE TABLE alocacoes (
  id SERIAL PRIMARY KEY,
  turma_id INTEGER NOT NULL,
  sala_id INTEGER NOT NULL,
  turno VARCHAR(20),
  time_alocacao VARCHAR(20),
  ano_temp INTEGER,
  semestre_temp INTEGER,
  FOREIGN KEY (turma_id) 
    REFERENCES turmas(id)
    ON DELETE RESTRICT,
  FOREIGN KEY (sala_id) 
    REFERENCES salas(id)
    ON DELETE RESTRICT
);