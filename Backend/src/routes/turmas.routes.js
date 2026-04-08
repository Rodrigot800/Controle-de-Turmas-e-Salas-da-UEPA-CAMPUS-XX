const express = require("express");
const router = express.Router();

let turmas = [
  {
    id: 1,
    nome: "BES",
    cursoId: 1,
    semestreInicio: "2",
    anoInicio: 2023,
    turno: "matutino",
  },
];

// Listar turmas
router.get("/", (req, res) => {
  res.json(turmas);
});

// Criar turma
router.post("/", (req, res) => {
  const novaTurma = {
    id: turmas.length + 1,
    ...req.body,
  };

  turmas.push(novaTurma);

  res.status(201).json(novaTurma);
});

// Remover turma
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  turmas = turmas.filter((turma) => turma.id != id);

  res.json({ mensagem: "Turma removida" });
});

module.exports = router;
