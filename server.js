// server.js - Backend completo com todas as funcionalidades
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Função principal da IA - Agora com todos os dados
const analisarCurriculo = async (imagemBase64, pais, estilo) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analise esta imagem de currículo de um jovem e retorne APENAS UM OBJETO JSON válido com:
                            {
                              "area": "área profissional identificada",
                              "resumo": "resumo profissional persuasivo (3 linhas)",
                              "melhorias": ["melhoria1", "melhoria2", "melhoria3"],
                              "palavras_chave": ["palavra1", "palavra2", "palavra3"],
                              "cursos": ["curso1", "curso2"],
                              "curriculo_organizado": "currículo completo reestruturado profissionalmente",
                              "biografia": "biografia profissional editável sobre a trajetória do jovem (5 linhas)",
                              "carta_recomendacao": "carta de recomendação personalizada com nome do jovem",
                              "linkedin_titulo": "título profissional otimizado",
                              "linkedin_resumo": "resumo curto para LinkedIn (3 linhas)"
                            }
                            
                            Adapte para o país: ${pais}. Estilo do currículo: ${estilo}.`
                        },
                        {
                            type: "image_url",
                            image_url: { url: `data:image/jpeg;base64,${imagemBase64}` }
                        }
                    ]
                }
            ]
        });

        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('Erro na IA:', error);
        return {
            area: "Não identificada",
            resumo: "Erro na análise",
            melhorias: ["Tente novamente com foto mais nítida"],
            palavras_chave: ["emprego", "carreira"],
            cursos: ["Procure cursos na sua área"],
            curriculo_organizado: "Erro ao gerar currículo",
            biografia: "Erro ao gerar biografia",
            carta_recomendacao: "Erro ao gerar carta",
            linkedin_titulo: "Profissional dedicado",
            linkedin_resumo: "Em busca de oportunidades"
        };
    }
};

// Endpoint principal
app.post('/analisar', upload.single('foto'), async (req, res) => {
    try {
        const imagemBase64 = req.file.buffer.toString('base64');
        const email = req.body.email;
        const pais = req.body.pais || 'Angola';
        const estilo = req.body.estilo || 'moderno';

        const resultado = await analisarCurriculo(imagemBase64, pais, estilo);

        // Envia email com resumo
        if (email) {
            await sgMail.send({
                to: email,
                from: 'suporte@empregoja.com',
                subject: '✅ Análise concluída - Emprego Já',
                html: `
                    <h2>Tua análise está pronta!</h2>
                    <p><strong>Área:</strong> ${resultado.area}</p>
                    <p><strong>Resumo:</strong> ${resultado.resumo}</p>
                    <p>Acessa o app para ver tudo: currículo organizado, biografia, carta e mais!</p>
                `
            });
        }

        res.json({ sucesso: true, ...resultado });

    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Endpoint para download de PDF (simulado)
app.post('/download/pdf', express.json(), (req, res) => {
    const { conteudo, tipo } = req.body;
    // Aqui gerarias o PDF real
    res.json({ url: 'https://exemplo.com/arquivo.pdf' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
