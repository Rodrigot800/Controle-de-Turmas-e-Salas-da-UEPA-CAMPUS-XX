# Agente de IA via terminal

O agente usa o `qwen2.5-coder:7b` no Ollama para interpretar pedidos em português e ferramentas controladas do backend para consultar e inserir dados no PostgreSQL.

O modelo **não recebe acesso a SQL livre**. Consultas, relatórios, inserções e atualizações passam por funções com parâmetros, validações e transações. Exclusões não estão disponíveis nesta versão. Toda escrita pede confirmação no terminal.

Datas em formato brasileiro são tratadas deterministicamente: `11/09` significa 11 de setembro e, sem ano explícito, usa o ano corrente (2026 neste momento). Pedidos de correção usam atualização do registro existente, sem criar uma segunda alocação.

Grades completas copiadas de PDF, Word ou planilhas também podem ser importadas, inclusive com uma única disciplina. O agente organiza códigos, disciplinas, cargas horárias, docentes, lotações, intervalos e observações; apresenta uma prévia legível; e grava todo o lote em uma transação. O código da disciplina é opcional: quando não estiver na fonte, o agente procura pelo nome e não inventa um valor. Disciplinas e docentes ausentes são criados e vinculados ao curso da turma. Sala e docente podem permanecer pendentes quando não constarem da fonte. O texto original é preservado para auditoria.

O comando `:pdf` aceita planejamentos com diagramações diferentes, desde que tragam as mesmas informações acadêmicas. Primeiro ele tenta reconhecer cabeçalhos e colunas dinamicamente. Quando o layout não é reconhecido, usa o Ollama como extrator estruturado, página por página. Valores extraídos pela IA precisam ter evidência no texto da página e, depois disso, ainda passam pelo mesmo cruzamento de curso, turma, disciplina, professor, carga horária, datas e sala. O parâmetro `--usar-ia` permite forçar esse segundo extrator para testar um novo layout.

A regra operacional é aplicada pelo intervalo completo: até um mês é `MODULAR`; acima de um mês é exibido como `REGULAR` e armazenado como `SEMANAL`, que é o valor existente no banco. Linhas incompletas, divergências de carga/código, docentes ambíguos, salas ausentes e conflitos de sala são mostrados antes da gravação. O lote de todas as turmas é atômico: se uma delas falhar, nenhuma é gravada.

No formato `Engenharia de Software — 2026.1`, o cabeçalho é tratado como curso, nunca como disciplina. Se ainda não existir uma turma de ingresso para 2026.1, o agente pode propor a criação da nova turma junto com a grade na mesma transação.

Pedidos completos de alocação em texto livre também são processados deterministicamente. O agente resolve primeiro a turma e seu curso e, em seguida, limita a disciplina e o professor a esse curso. Escritas com disciplina ou professor sem o vínculo correto, turno incompatível ou uma oferta exatamente duplicada são bloqueadas. O relatório `auditoria_integridade` permite localizar duplicidades e relacionamentos antigos incoerentes sem alterá-los automaticamente.

## Pré-requisitos

No host, inicie o Ollama e confirme o modelo:

```bash
ollama serve
ollama pull qwen2.5-coder:7b
```

Se o Ollama já estiver ativo como serviço, não execute `ollama serve` novamente.

## Executar com Docker (recomendado neste projeto)

Reconstrua o backend uma vez após instalar este módulo:

```bash
docker compose build ai
docker compose run --rm ai npm run ai:check
docker compose run --rm ai
```

O serviço auxiliar `ai` usa a rede do host no Linux. Assim ele acessa tanto o PostgreSQL publicado na porta `5433` quanto um Ollama que esteja escutando somente em `127.0.0.1`. Esse serviço pertence ao perfil `tools` e não é iniciado por `docker compose up`.

Para importar PDFs, copie o arquivo para `Backend/imports/`. A pasta aparece como `/imports` dentro do terminal do agente. Também é possível apontar diretamente para outra pasta do host:

```bash
AI_IMPORTS_DIR=/caminho/dos/pdfs docker compose run --rm ai
```

Primeiro execute apenas a pré-validação, que não altera o banco:

```text
:pdf "/imports/Horario 2026.1.pdf"
```

Para forçar a interpretação flexível de um documento com diagramação nova:

```text
:pdf "/imports/Horario 2026.1.pdf" --usar-ia
```

Depois informe uma sala para cada período usando o número ou o nome cadastrado:

```text
:pdf "/imports/Horario 2026.1.pdf" --salas 1=6,3=7,5=8,6=9,8=10
```

Se o documento contiver linhas incompletas, `--ignorar-pendentes` permite inserir somente as linhas integralmente validadas. As linhas ignoradas continuam listadas na prévia e não são gravadas silenciosamente.

## Executar diretamente

Se Node.js 20+ e as dependências do backend estiverem instalados no host:

```bash
cd Backend
npm install
npm run ai:check
npm run ai
```

## Exemplos

```text
Quantos cursos, salas, professores e turmas estão cadastrados?
Liste as disciplinas do curso de Engenharia de Software.
Mostre a grade da turma ADS 2026; procure a turma pelo nome primeiro.
Cadastre a sala Lab 4, capacidade 35, piso térreo, tipo laboratório.
Crie o curso Ciência de Dados com 40 vagas, 8 semestres e as disciplinas Estatística (60h, 1º semestre) e Python (80h, 1º semestre).
Corrija a alocação ID 2: o período correto é de 11/09 a 12/10 deste ano.
Altere a capacidade da sala 6 para 45 pessoas.
Importe a grade abaixo para a turma BES 2026, semestre 2026.1. Organize os dados, mostre as ambiguidades e peça confirmação antes de inserir: [cole a tabela].
```

Comandos da conversa:

- `:ajuda`: mostra exemplos;
- `:pdf`: extrai, pré-valida e importa um planejamento acadêmico em PDF;
- `:limpar`: apaga o contexto da conversa;
- `:sair`: encerra.

## Configuração

Variáveis opcionais:

- `OLLAMA_HOST`: padrão `http://127.0.0.1:11434` fora do Docker;
- `OLLAMA_MODEL`: padrão `qwen2.5-coder:7b`;
- `AI_ALLOW_WRITES=false`: desativa todas as inserções;
- `AI_TEMPERATURE`: padrão `0.1`;
- `AI_CONTEXT_SIZE`: padrão `16384`;
- `AI_MAX_TOOL_ROUNDS`: padrão `12`.
- `AI_CURRENT_YEAR`: substitui o ano corrente usado para datas sem ano;

Para testes automatizados conscientes, `npm run ai -- --yes` dispensa confirmações. Não use essa opção em operação normal.

Se a porta publicada do PostgreSQL tiver sido alterada, execute com `AI_DB_PORT`, por exemplo: `AI_DB_PORT=5434 docker compose run --rm ai`.
