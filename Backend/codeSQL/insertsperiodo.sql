INSERT INTO alocacoes_periodo (sala_id, disciplina_id, professor_id, turma_id, turno, tipo_disciplina, data_inicio, data_fim, dia_semana)
VALUES 

-- Matemática Discreta (Prof. Gustavo Nogueira) - Modular
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Matemática Discreta' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'GUSTAVO NOGUEIRA DIAS' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'MODULAR', '2026-02-19', '2026-03-06', NULL
),

-- Linguagens Formais (Prof. Leno Martins) - Semanal (Segundas)
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Linguagens Formais' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'LENO RODRIGUES MARTINS' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'SEMANAL', '2026-03-23', '2026-06-15', 1 -- 1 = Segunda
),

-- Fundamentos de Sistemas Operacionais (Prof. Substituto) - Semanal (Terças)
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Fundamentos de Sistemas Operacionais' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'PROFESSOR SUBSTITUTO' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'SEMANAL', '2026-03-24', '2026-05-19', 2 -- 2 = Terça
),

-- Programação Estruturada (Prof. Jairo Fadul) - Semanal (Quartas)
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Programação Estruturada' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'JAIRO FADUL DE LIMA' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'SEMANAL', '2026-03-25', '2026-04-15', 3 -- 3 = Quarta
),

-- Programação Estruturada (Prof. Jairo Fadul) - Semanal (Sextas)
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Programação Estruturada' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'JAIRO FADUL DE LIMA' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'SEMANAL', '2026-03-20', '2026-05-29', 5 -- 5 = Sexta
),

-- Inglês Instrumental (Prof. Lucas Araújo) - Modular
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Inglês Instrumental' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'LUCAS ARAUJO DE OLIVEIRA' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'MODULAR', '2026-06-02', '2026-06-13', NULL
),

-- Fundamentos de Sistemas de Informação (Prof. Antonio Marcos) - Modular
(
  (SELECT sala_id FROM alocacoes WHERE turma_id = (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1) LIMIT 1),
  (SELECT id FROM disciplinas WHERE nome = 'Fundamentos de Sistemas de Informação' LIMIT 1),
  (SELECT id FROM professores WHERE nome = 'ANTONIO MARCOS CARDOSO SILVA' LIMIT 1),
  (SELECT id FROM turmas WHERE nome = 'BES' AND ano_inicio = 2026 LIMIT 1),
  'Tarde', 'MODULAR', '2026-06-17', '2026-06-26', NULL
);