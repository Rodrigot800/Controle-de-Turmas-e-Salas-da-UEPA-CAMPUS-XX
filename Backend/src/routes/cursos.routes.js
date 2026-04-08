const express = require("express");
const router = express.Router();

// Lista de cursos (temporário - depois vem do banco)
let cursos = [
  {
    id: 1,
    nome: "ADS",
    vagas: 40,
    semestres: 6,
  },
];

// Listar cursos
router.get("/", (req, res) => {
  res.json(cursos);
});

// Criar curso
router.post("/", (req, res) => {
  const novoCurso = {
    id: cursos.length + 1,
    ...req.body,
  };

  cursos.push(novoCurso);

  res.status(201).json(novoCurso);
});

// Deletar curso
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  cursos = cursos.filter((curso) => curso.id != id);

  res.json({ mensagem: "Curso removido" });
});

module.exports = router;
