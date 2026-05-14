TRUNCATE TABLE alocacoes, turmas, cursos, salas 
RESTART IDENTITY CASCADE;

INSERT INTO salas (nome, capacidade, tipo_sala, piso)
VALUES 
('Sala 1', 30, 'comum', '1'),
('Sala 2', 30, 'comum', '1'),
('Sala 3', 30, 'comum', '1'),
('Sala 4A', 30, 'comum', '1'),
('Sala 4B', 30, 'comum', '1'),
('Sala 5', 30, 'comum', '1'),
('Sala 6', 30, 'comum', '1'),
('Sala 7', 30, 'comum', '1'),
('Sala 8', 30, 'comum', '1'),
('Sala 9', 30, 'comum', '1'),
('Sala 10', 30, 'comum', '1'),

('Sala 11', 30, 'comum', '2'),
('Sala 12', 30, 'comum', '2'),
('Sala 13', 30, 'comum', '2'),
('Sala 14', 30, 'comum', '2'),
('Sala 15', 30, 'comum', '2'),
('Sala 16', 30, 'comum', '2'),
('Sala 17', 30, 'comum', '2'),
('Sala 18', 30, 'comum', '2'),
('Sala 19', 30, 'comum', '2'),
('Sala 20', 30, 'comum', '2'),

('Sala 21', 30, 'comum', 'térreo'),
('Sala 22', 30, 'comum', 'térreo'),
('Sala 23', 30, 'comum', 'térreo'),
('Sala 24', 30, 'comum', 'térreo');

INSERT INTO cursos (nome, vagas, semestres) VALUES
('Engenharia Florestal', 40, 10),
('Engenharia de Produção', 40, 10),
('Engenharia Ambiental e Sanitária', 40, 10),
('Engenharia de Software', 30, 8),
('Física', 30, 8),
('Geografia', 30, 8),
('Tecnologia de Alimentos', 30, 7);

INSERT INTO turmas (nome, curso_id, semestre_inicio, ano_inicio, turno) VALUES
('EAS', 3, 1, 2021, 'Tarde'),
('EAS', 3, 1, 2022, 'Manhã'),
('EAS', 3, 1, 2023, 'Tarde'),
('EAS', 3, 1, 2024, 'Manhã'),
('EAS', 3, 1, 2025, 'Tarde'),

('EF', 1, 1, 2021, 'Manhã'),
('EF', 1, 1, 2022, 'Tarde'),
('EF', 1, 1, 2023, 'Manhã'),
('EF', 1, 1, 2024, 'Tarde'),
('EF', 1, 1, 2025, 'Manhã'),

('EP', 2, 1, 2021, 'Tarde'),
('EP', 2, 1, 2022, 'Manhã'),
('EP', 2, 1, 2023, 'Tarde'),
('EP', 2, 1, 2024, 'Manhã'),
('EP', 2, 1, 2025, 'Tarde'),

('BES', 4, 1, 2022, 'Tarde'),
('BES', 4, 1, 2023, 'Manhã'),
('BES', 4, 1, 2024, 'Tarde'),
('BES', 4, 1, 2025, 'Manhã'),

('FISICA', 5, 1, 2023, 'Manhã'),
('FISICA', 5, 1, 2024, 'Tarde'),
('FISICA', 5, 1, 2025, 'Manhã'),

('GEOGRAFIA', 6, 1, 2022, 'Tarde'),
('GEOGRAFIA', 6, 1, 2024, 'Manhã'),
('GEOGRAFIA', 6, 1, 2025, 'Tarde'),

('TA', 7, 1, 2023, 'Manhã'),
('TA', 7, 1, 2024, 'Tarde'),
('TA', 7, 1, 2025, 'Manhã');

INSERT INTO alocacoes (turma_id, sala_id, turno, time_alocacao, ano_temp, semestre_temp)
VALUES

-- Sala 1
(10, 1, 'Manhã', 'definitivo', NULL, NULL), -- EF 2025
(5, 1, 'Tarde', 'definitivo', NULL, NULL),  -- EAS 2026

-- Sala 2
(11, 2, 'Manhã', 'definitivo', NULL, NULL), -- EP 2022
(12, 2, 'Tarde', 'definitivo', NULL, NULL), -- EP 2023

-- Sala 3
(2, 3, 'Manhã', 'definitivo', NULL, NULL),  -- EAS 2022
(7, 3, 'Tarde', 'definitivo', NULL, NULL),  -- EF 2022

-- Sala 4A
(26, 4, 'Manhã', 'definitivo', NULL, NULL), -- TA 2023
(28, 4, 'Tarde', 'definitivo', NULL, NULL), -- TA 2026

-- Sala 4B
(27, 5, 'Manhã', 'definitivo', NULL, NULL), -- TA 2025
(26, 5, 'Tarde', 'definitivo', NULL, NULL), -- TA 2024

-- Sala 5
(19, 6, 'Manhã', 'definitivo', NULL, NULL), -- BES 2025
(18, 6, 'Tarde', 'definitivo', NULL, NULL), -- BES 2024

-- Sala 6
(17, 7, 'Manhã', 'definitivo', NULL, NULL), -- BES 2023
(16, 7, 'Tarde', 'definitivo', NULL, NULL), -- BES 2022

-- Sala 7
(21, 8, 'Manhã', 'definitivo', NULL, NULL), -- FISICA 2023
(22, 8, 'Tarde', 'definitivo', NULL, NULL), -- FISICA 2024

-- Sala 8
(4, 9, 'Manhã', 'definitivo', NULL, NULL),  -- EAS 2024
(9, 9, 'Tarde', 'definitivo', NULL, NULL),  -- EF 2024

-- Sala 9
(24, 10, 'Manhã', 'definitivo', NULL, NULL), -- GEOGRAFIA 2024
(25, 10, 'Tarde', 'definitivo', NULL, NULL), -- GEOGRAFIA 2025

-- Sala 10
(14, 11, 'Manhã', 'definitivo', NULL, NULL), -- EP 2024
(5, 11, 'Tarde', 'definitivo', NULL, NULL),  -- EAS 2025

-- Sala 11
(19, 12, 'Tarde', 'definitivo', NULL, NULL), -- BES 2026

-- Sala 17
(15, 18, 'Manhã', 'definitivo', NULL, NULL), -- EP 2026
(10, 18, 'Tarde', 'definitivo', NULL, NULL), -- EF 2026

-- Sala 18
(8, 19, 'Manhã', 'definitivo', NULL, NULL),  -- EF 2023
(22, 19, 'Tarde', 'definitivo', NULL, NULL), -- FISICA 2026

-- Sala 22
(25, 23, 'Manhã', 'definitivo', NULL, NULL), -- GEOGRAFIA 2026
(15, 23, 'Tarde', 'definitivo', NULL, NULL), -- EP 2025

-- Sala 23
(22, 24, 'Manhã', 'definitivo', NULL, NULL), -- FISICA 2025
(3, 24, 'Tarde', 'definitivo', NULL, NULL);  -- EAS 2023


