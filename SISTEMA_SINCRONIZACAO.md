# Sistema de Sincronização de Dados - Sem LocalStorage

## Visão Geral

O sistema foi refatorado para **eliminar completamente o localStorage** e usar um modelo de **carregamento de dados da API** com **sincronização em tempo real** entre componentes.

## Como Funciona

### 1. Carregamento Inicial (App.jsx)

Quando a aplicação é iniciada, o componente `App` carrega todos os dados uma única vez da API:

```javascript
useEffect(() => {
  carregarDados();
}, []);

async function carregarDados() {
  try {
    const [salasRes, cursosRes, turmasRes, alocacoesRes] = await Promise.all([
      fetch("http://localhost:3001/salas"),
      fetch("http://localhost:3001/cursos"),
      fetch("http://localhost:3001/turmas"),
      fetch("http://localhost:3001/alocacoes"),
    ]);

    if (salasRes.ok) setSalas(await salasRes.json());
    if (cursosRes.ok) setCursos(await cursosRes.json());
    if (turmasRes.ok) setTurmas(await turmasRes.json());
    if (alocacoesRes.ok) setAlocacoes(await alocacoesRes.json());
  } catch (err) {
    console.error("Erro ao carregar dados iniciais:", err);
  }
}
```

### 2. Sincronização de Estado

Os dados são gerenciados no componente pai (`App.jsx`) e passados via **props** para os componentes filhos (modais).

- **Salas**: `salas`, `setSalas`
- **Cursos**: `cursos`, `setCursos`
- **Turmas**: `turmas`, `setTurmas`
- **Alocações**: `alocacoes`, `setAlocacoes`

### 3. Atualização de Dados (Modais)

Quando um usuário **adiciona, edita ou remove** dados em um modal:

1. A requisição é enviada para a API
2. A resposta é recebida com o objeto atualizado
3. O estado é atualizado usando o setter (ex: `setCursos`)
4. React renderiza automaticamente todos os componentes que dependem desse estado

**Exemplo - Adicionar Curso**:

```javascript
async function adicionarCurso() {
  try {
    const response = await fetch(`${API_BASE}/cursos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoCurso),
    });

    const cursoCriado = await response.json();
    setCursos((prev) => [...prev, cursoCriado]); // Atualiza estado
    success("Curso adicionado com sucesso!");
  } catch (err) {
    error("Erro ao adicionar curso: " + err.message);
  }
}
```

### 4. Sincronização de Alocações

Quando **salas** ou **turmas** são deletadas, o sistema remove automaticamente as alocações órfãs:

```javascript
useEffect(() => {
  const alocacoesValidas = alocacoes.filter((a) => {
    const turmaMantida = turmas.some((t) => t.id === a.turma_id);
    const salaMantida = salas.some((s) => s.id === a.sala_id);
    return turmaMantida && salaMantida;
  });

  if (alocacoesValidas.length !== alocacoes.length) {
    setAlocacoes(alocacoesValidas);
  }
}, [salas, turmas]);
```

## Benefícios

✅ **Sem dados duplicados**: Fonte única de verdade (API + estado do React)  
✅ **Sincronização automática**: Todos os componentes sempre refletem o estado atual  
✅ **Melhor performance**: Sem gravações contínuas em localStorage  
✅ **Mais confiável**: Dados sempre consistentes com o servidor  
✅ **Facilita collab**: Múltiplas abas/usuários veriam dados sincronizados (com websockets)

## Estrutura de Componentes

```
App.jsx (Estado Global)
├── ModalSalas (recebe salas, setSalas)
├── ModalCursos (recebe cursos, setCursos)
├── ModalTurmas (recebe turmas, setTurmas)
├── ModalAlocacoes (recebe alocacoes, setAlocacoes)
└── TabelaAlocacoes (recebe todos os dados - leitura)
```

## Fluxo de Dados

```
User Action (clica em "Adicionar Curso")
    ↓
Modal Component executa fetch() para API
    ↓
API responde com novo curso
    ↓
setCursos() atualiza estado em App
    ↓
React re-renderiza App e componentes que dependem de cursos
    ↓
TabelaAlocacoes e outros modais veem dados atualizados
```

## Próximos Passos (Opcional)

Para sincronização em tempo real entre múltiplos clientes:

1. **WebSockets**: Implementar conexão WebSocket com o servidor
2. **Context API ou Zustand**: Centralizar estado globalá sem prop drilling
3. **API em tempo real**: Hooks customizados para atualizar dados quando mudanças externas ocorrem

## Testando o Sistema

1. Abra a aplicação
2. Adicione um curso em um modal
3. Veja a tabela e outros modais atualizarem automaticamente
4. Recarregue a página → dados persistem (vêm da API)
5. Abra em outra aba → ambas mostram dados idênticos

---

**Desenvolvido em**: 14 de abril de 2026
