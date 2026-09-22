-- Acrescenta ao nome da turma os dois últimos dígitos de ano_inicio.
-- Exemplos:
--   BES, ano_inicio 2023       -> BES 23
--   BES 2023, ano_inicio 2023  -> BES 23
--   BES 26, ano_inicio 2026    -> BES 26 (sem duplicação)
--
-- O script é idempotente: executá-lo novamente não acrescenta outro ano.
-- Para apenas simular, troque COMMIT por ROLLBACK no final.

BEGIN;

CREATE TEMP TABLE nomes_turmas_atualizados ON COMMIT DROP AS
SELECT
  id,
  curso_id,
  ano_inicio,
  semestre_inicio,
  turno,
  nome AS nome_anterior,
  CONCAT(
    REGEXP_REPLACE(
      BTRIM(nome),
      '[[:space:]]+([0-9]{2}|[0-9]{4})$',
      ''
    ),
    ' ',
    RIGHT(ano_inicio::text, 2)
  ) AS nome_novo
FROM turmas
WHERE ano_inicio IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM nomes_turmas_atualizados
    WHERE BTRIM(nome_novo) = ''
  ) THEN
    RAISE EXCEPTION 'Existe turma cujo novo nome ficaria vazio.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM nomes_turmas_atualizados
    WHERE CHAR_LENGTH(nome_novo) > 50
  ) THEN
    RAISE EXCEPTION 'Existe nome de turma que ultrapassaria o limite de 50 caracteres.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM nomes_turmas_atualizados
    GROUP BY
      curso_id,
      ano_inicio,
      semestre_inicio,
      LOWER(BTRIM(turno)),
      LOWER(BTRIM(nome_novo))
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'A atualização produziria turmas duplicadas no mesmo curso, período e turno.';
  END IF;
END
$$;

-- Prévia exibida pelo psql antes da atualização.
SELECT
  id,
  ano_inicio,
  nome_anterior,
  nome_novo
FROM nomes_turmas_atualizados
WHERE nome_anterior IS DISTINCT FROM nome_novo
ORDER BY ano_inicio, id;

UPDATE turmas AS t
SET nome = n.nome_novo
FROM nomes_turmas_atualizados AS n
WHERE t.id = n.id
  AND t.nome IS DISTINCT FROM n.nome_novo;

COMMIT;
