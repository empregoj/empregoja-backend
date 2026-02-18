const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/teste', (req, res) => {
    res.json({ mensagem: 'Servidor mínimo funcionando!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
