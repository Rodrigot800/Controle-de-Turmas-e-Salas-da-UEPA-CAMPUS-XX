const express = require("express");
const router = express.Router();

let alocacoes = [];

// Listar alocações
router.get("/", (req, res) => {
  res.json(alocacoes);
});

// Criar alocação
router.post("/", (req, res) => {
  const novaAlocacao = {
    id: alocacoes.length + 1,
    ...req.body,
  };

  alocacoes.push(novaAlocacao);

  res.status(201).json(novaAlocacao);
});

// Remover alocação
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  alocacoes = alocacoes.filter((a) => a.id != id);

  res.json({ mensagem: "Alocação removida" });
});

module.exports = router;
