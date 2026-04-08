const express = require("express");
const router = express.Router();

// Listar salas
router.get("/", (req, res) => {
  res.json([
    { id: 1, nome: "BES", semestre: "2", capacidade: 30, piso: "Térreo" },
    
  ]);
});

module.exports = router;
