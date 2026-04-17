const express = require('express')
const cors = require('cors')

const app = express()

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

app.use("/salas", salasRoutes);
app.use("/cursos", cursosRoutes);
app.use("/alocacoes", alocacoesRoutes);
app.use("/turmas", turmasRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

<<<<<<< Updated upstream
app.listen(3001, "0.0.0.0", () => {
  console.log("Server is running on port 3001");
=======
const PORT = 3001

app.listen(3001, "0.0.0.0", () => {
  console.log("Server running on port 3001");
>>>>>>> Stashed changes
});