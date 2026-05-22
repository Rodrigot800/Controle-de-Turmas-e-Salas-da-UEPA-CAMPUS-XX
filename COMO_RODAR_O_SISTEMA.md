# 🚀 Guia de Execução: UniGestão (Docker)

Bem-vindo ao guia oficial de execução do **UniGestão**. Este documento detalha como iniciar todo o ambiente do projeto (Banco de Dados, API Backend e Frontend) de forma totalmente automatizada utilizando o **Docker**.

---

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas no seu sistema operativo:

- **[Docker](https://docs.docker.com/get-docker/)**: O motor responsável por gerenciar os contêineres.
- **[Docker Compose](https://docs.docker.com/compose/install/)**: Utilitário para orquestrar múltiplos contêineres simultaneamente (geralmente incluído com o Docker Desktop no Windows/Mac, e em pacotes mais recentes do Linux).

> **Atenção (Usuários Linux):** O erro `docker: comando não encontrado` significa que você precisa instalar o Docker. Em distribuições baseadas em Debian/Ubuntu, você pode instalar usando `sudo apt install docker.io docker-compose-v2`.

---

## 🚀 1. Iniciando o Sistema (Primeira Execução)

O projeto possui um arquivo `docker-compose.yml` pré-configurado na raiz, que cuida de toda a configuração de rede, persistência de dados e injeção do schema do banco.

1. Abra o terminal (ou Prompt de Comando/PowerShell).
2. Navegue até a **pasta raiz do projeto** (onde este arquivo está localizado).
3. Execute o comando abaixo:

```bash
docker compose up -d --build
```

**O que este comando faz?**
- `-d` (Detached mode): Libera o seu terminal, executando o sistema em segundo plano.
- `--build`: Constrói as imagens locais (Frontend e Backend) com as configurações mais recentes.
- O Banco de Dados PostgreSQL é baixado e **configurado automaticamente**, incluindo a criação das tabelas e a inserção dos dados padrão.

---

## 🌐 2. Acessando as Aplicações

Assim que os contêineres terminarem de inicializar, o sistema estará pronto para uso. Acesse as seguintes URLs no seu navegador:

| Componente | URL Local | Descrição |
|---|---|---|
| **🎨 Frontend (App Web)** | [https://192.168.10.231](https://192.168.10.231) | Interface gráfica para gestão acadêmica. |
| **⚙️ Backend (API)** | [http://192.168.10.231:3001](http://192.168.10.231:3001) | Motor do sistema (rotas e regras de negócio). |
| **🗄️ Banco de Dados** | `192.168.10.231:5432` | Acesso direto ao PostgreSQL (útil para DBeaver/PgAdmin). |

---

## 📱 3. Como Instalar o Aplicativo (PWA)
Como o sistema roda em um IP local (`192.168.10.231`), nós usamos um certificado de segurança "autoassinado" para permitir o HTTPS. No entanto, navegadores como Google Chrome e Edge **bloqueiam a instalação de PWAs** se o certificado não for de uma entidade reconhecida mundialmente.

Para fazer o botão de instalação aparecer, precisamos dizer ao navegador que esse IP é confiável.

### Passo a passo para liberar a instalação:
1. Abra uma nova aba no seu navegador (Chrome ou Edge).
2. Na barra de endereços, digite o seguinte comando e aperte Enter:
   - Se for Chrome: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
   - Se for Edge: `edge://flags/#unsafely-treat-insecure-origin-as-secure`
3. Você verá uma caixa de texto amarela. Digite exatamente: `https://192.168.10.231`
4. Mude o botão ao lado de "Disabled" para **"Enabled"**.
5. Clique no botão azul **"Relaunch"** (Reiniciar) que aparecerá no canto inferior da tela.

### Instalando de Fato:
6. Após o navegador reiniciar, acesse o sistema normalmente em: `https://192.168.10.231`
7. Vá em "Avançado" e depois em "Ir para 192.168.10.231 (inseguro)".
8. Agora sim, na barra superior de endereços, clique no ícone de **"Instalar Aplicativo"** (ou "Adicionar à Tela Inicial" no celular).
9. O UniGestão abrirá como um programa nativo do sistema!

---

## 🔍 3. Monitorando a Execução (Logs)

Se a página do frontend não carregar imediatamente, ou se você quiser investigar algum erro, visualizar os logs do Docker é o melhor caminho:

- **Ver o log de todos os componentes de uma vez:**
  ```bash
  docker compose logs -f
  ```
- **Ver o log apenas do Frontend:**
  ```bash
  docker compose logs -f frontend
  ```
- **Ver o log apenas da API (Backend):**
  ```bash
  docker compose logs -f backend
  ```
- **Ver o log do Banco de Dados:**
  ```bash
  docker compose logs -f db
  ```
*(Pressione `Ctrl + C` para sair do modo de logs)*

---

## 🛑 4. Parando e Reiniciando o Sistema

### Parar temporariamente (Mantendo os Dados)
Quando terminar de usar e quiser parar o sistema para não consumir recursos do PC, utilize:
```bash
docker compose down
```
> **Nota:** Seus dados e registros feitos no sistema **NÃO serão perdidos**. Eles estão salvos de forma segura em um volume oculto chamado `pgdata`.

### Parar e APAGAR tudo (Reset Completo)
Se você bagunçou os dados e quer iniciar o sistema "do zero", parando e destruindo o banco de dados atual, adicione a flag `-v`:
```bash
docker compose down -v
```
> **Aviso:** Isso apagará todos os cadastros e dados criados durante o uso do sistema, retornando-o ao estado original na próxima vez que executar `up`.

---

## 💡 Dicas e Soluções de Problemas

1. **"A porta já está em uso" (Port already allocated)**
   Se o Docker reclamar que a porta `5173`, `3001` ou `5432` está em uso, verifique se você não tem outro projeto ou o próprio Postgres local rodando fora do Docker e pare esses serviços.
   
2. **"O Backend não está conectando no banco"**
   Normalmente, o banco de dados demora alguns segundos para subir e inicializar os scripts. Verifique os logs usando `docker compose logs -f backend`. O contêiner de backend foi configurado para reiniciar caso caia inicialmente.
   
3. **Modifiquei o código do Frontend/Backend. Como atualizo no Docker?**
   Rode novamente o comando: `docker compose up -d --build`. A flag `--build` forçará a atualização com base no seu código fonte atualizado.
