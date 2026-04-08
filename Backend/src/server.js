const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
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

const PORT = 3001

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})