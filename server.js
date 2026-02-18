const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================
// ENDPOINT DE TESTE (para ver se está vivo)
// ============================================
app.get('/teste', (req, res) => {
    res.json({ 
        sucesso: true, 
        mensagem: '🚀 Servidor funcionando!',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// FUNÇÃO DA IA
// ============================================
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

// ============================================
// ENDPOINT PARA WEB (base64)
// ============================================
app.post('/analisar-web', express.json({ limit: '50mb' }), async (req, res) => {
    try {
        const { foto, email, pais, estilo } = req.body;
        
        if (!foto) {
            return res.status(400).json({ sucesso: false, erro: 'Foto não enviada' });
        }
        
        const resultado = await analisarCurriculo(foto, pais || 'Angola', estilo || 'moderno');
        
        if (email) {
            try {
                await sgMail.send({
                    to: email,
                    from: 'suporte@empregoja.com',
                    subject: '✅ Análise concluída - Emprego Já',
                    html: `<h2>Tua análise está pronta!</h2><p>Acede ao app para ver os resultados.</p>`
                });
            } catch (emailError) {
                console.log('Erro ao enviar email (ignorado):', emailError);
            }
        }
        
        res.json({ sucesso: true, ...resultado });
        
    } catch (error) {
        console.error('Erro no endpoint:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ============================================
// ENDPOINTS DE PAGAMENTO (simplificados)
// ============================================
app.post('/iniciar-pagamento', express.json(), (req, res) => {
    const { plano, valor, moeda } = req.body;
    
    res.json({
        sucesso: true,
        referencia: 'PAG' + Date.now().toString().slice(-8),
        instrucoes: `Pague ${valor} ${moeda} para o plano ${plano} usando EMIS ou Multicaixa.`
    });
});

// ============================================
// ENDPOINT ADMIN (simplificado)
// ============================================
app.post('/admin/login', express.json(), (req, res) => {
    const { senha } = req.body;
    
    if (senha === 'admin123') {
        res.json({ sucesso: true, token: 'admin-token' });
    } else {
        res.json({ sucesso: false, erro: 'Senha incorreta' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📌 Endpoint de teste: /teste`);
    console.log(`📌 Endpoint de análise: /analisar-web`);
});
