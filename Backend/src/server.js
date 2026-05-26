require('dotenv').config();
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
})

// Middleware para disponibilizar io em todas as requisições
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json())

const cursosRoutes = require("./routes/cursos.routes");
const alocacoesRoutes = require("./routes/alocacoes.routes");
const salasRoutes = require("./routes/salas.routes");
const turmasRoutes = require("./routes/turmas.routes");
const professoresRoutes = require("./routes/professores.routes");
const disciplinasRoutes = require("./routes/disciplinas.routes");
const cursoDisciplinasRoutes = require("./routes/curso_disciplinas.routes");
const alocacoesDisciplinasRoutes = require("./routes/alocacoesDisciplinas.routes");

app.use("/salas", salasRoutes);
app.use("/cursos", cursosRoutes);
app.use("/alocacoes", alocacoesRoutes);
app.use("/turmas", turmasRoutes);
app.use("/professores", professoresRoutes);
app.use("/disciplinas", disciplinasRoutes);
app.use("/curso-disciplinas", cursoDisciplinasRoutes);
app.use("/alocacoes-disciplinas", alocacoesDisciplinasRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
});