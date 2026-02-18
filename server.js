const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================
// BANCO DE DADOS SIMULADO
// ============================================
let pagamentos = []; // Guarda todos os pagamentos

// ============================================
// ENDPOINT DE TESTE
// ============================================
app.get('/teste', (req, res) => {
    res.json({ sucesso: true, mensagem: '🚀 Servidor funcionando!' });
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
                            text: `Analise esta imagem de currículo de um jovem e retorne APENAS UM OBJETO JSON válido. Adapte para o país: ${pais}. Estilo: ${estilo}.`
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
        return {
            area: "Não identificada",
            resumo: "Erro na análise",
            melhorias: ["Tente novamente"],
            palavras_chave: ["emprego"],
            cursos: ["Procure cursos"],
            curriculo_organizado: "Erro ao gerar",
            biografia: "Erro ao gerar",
            carta_recomendacao: "Erro ao gerar",
            linkedin_titulo: "Profissional",
            linkedin_resumo: "Em busca de oportunidades"
        };
    }
};

// ============================================
// ENDPOINT DE ANÁLISE
// ============================================
app.post('/analisar-web', express.json({ limit: '50mb' }), async (req, res) => {
    try {
        const { foto, email, pais, estilo } = req.body;
        if (!foto) return res.status(400).json({ sucesso: false, erro: 'Foto não enviada' });
        
        const resultado = await analisarCurriculo(foto, pais || 'Angola', estilo || 'moderno');
        res.json({ sucesso: true, ...resultado });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ============================================
// ENDPOINT DE PAGAMENTO (CRIAR)
// ============================================
app.post('/criar-pagamento', express.json(), (req, res) => {
    const { email, plano, valor, moeda } = req.body;
    
    const novoPagamento = {
        id: 'PAG' + Date.now().toString().slice(-8),
        email,
        plano,
        valor,
        moeda,
        status: 'pendente', // pendente, aprovado, rejeitado
        data: new Date().toISOString(),
        comprovativo: null
    };
    
    pagamentos.push(novoPagamento);
    
    res.json({
        sucesso: true,
        pagamentoId: novoPagamento.id,
        mensagem: 'Pagamento criado. Envie o comprovativo para aprovação.'
    });
});

// ============================================
// ENDPOINT PARA ENVIAR COMPROVATIVO
// ============================================
app.post('/enviar-comprovativo', express.json({ limit: '50mb' }), (req, res) => {
    const { pagamentoId, comprovativoBase64, nomeArquivo } = req.body;
    
    const pagamento = pagamentos.find(p => p.id === pagamentoId);
    if (!pagamento) {
        return res.status(404).json({ sucesso: false, erro: 'Pagamento não encontrado' });
    }
    
    pagamento.comprovativo = {
        nome: nomeArquivo,
        base64: comprovativoBase64,
        data: new Date().toISOString()
    };
    // Status continua pendente até admin aprovar
    
    res.json({ sucesso: true, mensagem: 'Comprovativo recebido. Aguarde aprovação.' });
});

// ============================================
// ENDPOINTS ADMIN
// ============================================
app.post('/admin/login', express.json(), (req, res) => {
    const { senha } = req.body;
    if (senha === 'admin123') {
        res.json({ sucesso: true, token: 'admin-token' });
    } else {
        res.json({ sucesso: false, erro: 'Senha incorreta' });
    }
});

// Admin ver pagamentos pendentes
app.get('/admin/pagamentos', (req, res) => {
    const pendentes = pagamentos.filter(p => p.status === 'pendente');
    const aprovados = pagamentos.filter(p => p.status === 'aprovado');
    
    res.json({
        sucesso: true,
        pendentes: pendentes,
        aprovados: aprovados,
        total_pendentes: pendentes.length,
        total_aprovados: aprovados.length
    });
});

// Admin aprovar pagamento
app.post('/admin/aprovar-pagamento', express.json(), (req, res) => {
    const { pagamentoId } = req.body;
    
    const pagamento = pagamentos.find(p => p.id === pagamentoId);
    if (!pagamento) {
        return res.status(404).json({ sucesso: false, erro: 'Pagamento não encontrado' });
    }
    
    pagamento.status = 'aprovado';
    pagamento.data_aprovacao = new Date().toISOString();
    
    res.json({ sucesso: true, mensagem: 'Pagamento aprovado! Conteúdo liberado.' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
