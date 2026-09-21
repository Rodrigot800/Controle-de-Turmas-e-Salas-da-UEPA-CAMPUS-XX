# Agente de IA via terminal

O agente usa o `qwen2.5-coder:7b` no Ollama para interpretar pedidos em português e ferramentas controladas do backend para consultar e inserir dados no PostgreSQL.

O modelo **não recebe acesso a SQL livre**. Consultas, relatórios, inserções e atualizações passam por funções com parâmetros, validações e transações. Exclusões não estão disponíveis nesta versão. Toda escrita pede confirmação no terminal.

Datas em formato brasileiro são tratadas deterministicamente: `11/09` significa 11 de setembro e, sem ano explícito, usa o ano corrente (2026 neste momento). Pedidos de correção usam atualização do registro existente, sem criar uma segunda alocação.

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
```

Comandos da conversa:

- `:ajuda`: mostra exemplos;
- `:limpar`: apaga o contexto da conversa;
- `:sair`: encerra.

## Configuração

Variáveis opcionais:

- `OLLAMA_HOST`: padrão `http://127.0.0.1:11434` fora do Docker;
- `OLLAMA_MODEL`: padrão `qwen2.5-coder:7b`;
- `AI_ALLOW_WRITES=false`: desativa todas as inserções;
- `AI_TEMPERATURE`: padrão `0.1`;
- `AI_CONTEXT_SIZE`: padrão `8192`;
- `AI_MAX_TOOL_ROUNDS`: padrão `12`.
- `AI_CURRENT_YEAR`: substitui o ano corrente usado para datas sem ano;

Para testes automatizados conscientes, `npm run ai -- --yes` dispensa confirmações. Não use essa opção em operação normal.

Se a porta publicada do PostgreSQL tiver sido alterada, execute com `AI_DB_PORT`, por exemplo: `AI_DB_PORT=5434 docker compose run --rm ai`.
