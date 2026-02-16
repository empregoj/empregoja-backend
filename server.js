const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste para ver se está vivo
app.get('/teste', (req, res) => {
    res.json({ mensagem: 'Servidor funcionando!' });
});

// Configurar OpenAI (se tiver chave)
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Configurar SendGrid (se tiver chave)
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Rota principal
app.post('/analisar', upload.single('foto'), async (req, res) => {
    try {
        // Resposta temporária enquanto testamos
        res.json({
            sucesso: true,
            area: "Tecnologia",
            resumo: "Profissional dedicado com experiência em atendimento",
            melhorias: ["Adicionar cursos", "Incluir objetivos"],
            palavras_chave: ["#emprego", "#tecnologia"],
            cursos: ["Excel básico", "Comunicação"]
        });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
});
