# Controle de Turmas e Salas da UEPA - Campus XX

Aplicação frontend desenvolvida em React + Vite para gerenciar cursos, turmas, salas e alocações acadêmicas. A interface consome uma API em Node.js/Express com PostgreSQL e centraliza o estado no `App.jsx`, mantendo a visualização sincronizada entre tabela e modais.

## O que o sistema faz

- Cadastro, edição e remoção de salas
- Cadastro, edição e remoção de cursos
- Cadastro, edição e remoção de turmas
- Cadastro, edição e remoção de alocações
- Controle de alocação por turno
- Suporte a alocação definitiva e temporária
- Busca por turma e por ano de início
- Filtro por ano e semestre para visualizar ocupação
- Cálculo de ocupação e vagas livres por sala/turno

## Arquitetura atual

O frontend concentra os dados principais em [App.jsx](/home/rodrigod/Documentos/GitHub/Controle-de-Turmas-e-Salas-da-UEPA-CAMPUS-XX/Frontend/src/App.jsx). Na inicialização, ele consulta:

- `/salas`
- `/cursos`
- `/turmas`
- `/alocacoes`

Depois disso, os modais atualizam o estado local logo após cada `POST`, `PUT` ou `DELETE`, evitando depender de `localStorage`.

### Componentes principais

- `ModalSalas`: gerencia nome, tipo, piso e capacidade das salas
- `ModalCursos`: gerencia nome, quantidade de vagas e duração em semestres
- `ModalTurmas`: gerencia vínculo com curso, turno e período de início
- `ModalAlocacao`: cria alocações definitivas e temporárias
- `TabelaAlocacoes`: exibe ocupação por sala, turno, semestre e pesquisa

## Requisitos

- Node.js 18+
- npm
- Backend do projeto em execução na porta `3001`

## Como rodar o frontend

```bash
npm install
npm run dev
```

Por padrão, o Vite sobe em ambiente local e o frontend passa a consumir a API definida em [api.js](/home/rodrigod/Documentos/GitHub/Controle-de-Turmas-e-Salas-da-UEPA-CAMPUS-XX/Frontend/src/config/api.js).

## Backend esperado

O frontend foi escrito para trabalhar com uma API REST com estas rotas:

- `GET|POST /salas`
- `PUT|DELETE /salas/:id`
- `GET|POST /cursos`
- `PUT|DELETE /cursos/:id`
- `GET|POST /turmas`
- `PUT|DELETE /turmas/:id`
- `GET|POST /alocacoes`
- `PUT|DELETE /alocacoes/:id`

## Regras de negócio encontradas no código

- Alocações temporárias valem apenas para um ano/semestre específico
- Alocações definitivas consideram todo o ciclo da turma com base na duração do curso
- O backend bloqueia conflitos de sala no mesmo turno e período
- O frontend remove do estado alocações órfãs quando turmas ou salas deixam de existir
- A tabela calcula o percentual de progresso da turma usando ano/semestre de início e duração do curso

## Pontos de atenção

- O arquivo [api.js](/home/rodrigod/Documentos/GitHub/Controle-de-Turmas-e-Salas-da-UEPA-CAMPUS-XX/Frontend/src/config/api.js) está com uma string inválida em `API_BASE`, o que hoje pode quebrar todas as requisições do frontend
- O título da aplicação e o nome do pacote estavam genéricos e foram alinhados com o nome do projeto
- Ainda não há scripts de teste automatizado no frontend

## Stack

- React 19
- Vite
- Bootstrap 5
- ESLint

## Estrutura resumida

```text
Frontend/
├── src/
│   ├── components/
│   ├── config/
│   ├── hooks/
│   ├── style/
│   ├── App.jsx
│   └── main.jsx
├── index.html
└── package.json
```
