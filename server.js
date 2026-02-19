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
// BASE DE DADOS (em memória)
// ============================================
let pagamentos = [];
let usuarios = [];
let configuracoes = {
    taxas: { AKZ: 1.0, BRL: 0.011, EUR: 0.0018 },
    contas: { emis: '123456789', multicaixa: '99999', iban: 'AO06012345678901234567890' }
};

// ============================================
// FUNÇÃO DA IA
// ============================================
async function analisarCurriculo(imagemBase64, pais, estilo) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analise esta imagem de currículo e retorne UM OBJETO JSON válido com:
                            {
                                "area": "área profissional",
                                "resumo": "resumo profissional",
                                "melhorias": ["melhoria1", "melhoria2"],
                                "palavras_chave": ["palavra1", "palavra2"],
                                "cursos": ["curso1", "curso2"],
                                "curriculo_organizado": "currículo completo",
                                "biografia": "biografia profissional",
                                "carta_recomendacao": "carta personalizada",
                                "linkedin_titulo": "título otimizado",
                                "linkedin_resumo": "resumo LinkedIn"
                            }
                            Adapte para o país: ${pais}. Estilo: ${estilo}.`
                        },
                        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imagemBase64}` } }
                    ]
                }
            ]
        });
        return JSON.parse(response.choices[0].message.content);
    } catch (error) {
        console.error('Erro IA:', error);
        return {
            area: "Não identificada",
            resumo: "Erro na análise",
            melhorias: ["Tente novamente"],
            palavras_chave: ["emprego"],
            cursos: ["Procure cursos"],
            curriculo_organizado: "Erro ao gerar currículo",
            biografia: "Erro ao gerar biografia",
            carta_recomendacao: "Erro ao gerar carta",
            linkedin_titulo: "Profissional",
            linkedin_resumo: "Em busca de oportunidades"
        };
    }
}

// ============================================
// ENDPOINTS PÚBLICOS
// ============================================
app.get('/teste', (req, res) => res.json({ status: 'online', timestamp: new Date() }));

app.post('/analisar-web', express.json({ limit: '50mb' }), async (req, res) => {
    try {
        const { foto, email, pais, estilo } = req.body;
        if (!foto) return res.status(400).json({ erro: 'Foto obrigatória' });
        
        const resultado = await analisarCurriculo(foto, pais || 'Angola', estilo || 'moderno');
        
        if (email) usuarios.push({ email, data: new Date(), resultado });
        
        res.json({ sucesso: true, ...resultado });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ============================================
// ENDPOINTS DE PAGAMENTO
// ============================================
app.post('/pagamento/criar', express.json(), (req, res) => {
    const { email, plano, valor, moeda } = req.body;
    
    const pagamento = {
        id: 'PAG' + Date.now().toString().slice(-8),
        email, plano, valor, moeda,
        status: 'pendente',
        data: new Date().toISOString(),
        comprovativo: null
    };
    
    pagamentos.push(pagamento);
    res.json({ sucesso: true, pagamentoId: pagamento.id, dadosBancarios: configuracoes.contas });
});

app.post('/pagamento/comprovativo', express.json({ limit: '50mb' }), (req, res) => {
    const { pagamentoId, comprovativoBase64, nomeArquivo } = req.body;
    
    const pagamento = pagamentos.find(p => p.id === pagamentoId);
    if (!pagamento) return res.status(404).json({ erro: 'Pagamento não encontrado' });
    
    pagamento.comprovativo = { nome: nomeArquivo, base64: comprovativoBase64, data: new Date() };
    res.json({ sucesso: true, mensagem: 'Comprovativo recebido. Aguarde aprovação.' });
});

// ============================================
// ENDPOINTS ADMIN
// ============================================
app.post('/admin/login', express.json(), (req, res) => {
    const { senha } = req.body;
    res.json({ sucesso: senha === 'admin123', token: 'admin-token' });
});

app.get('/admin/pagamentos', (req, res) => {
    const pendentes = pagamentos.filter(p => p.status === 'pendente');
    const aprovados = pagamentos.filter(p => p.status === 'aprovado');
    res.json({
        pendentes,
        aprovados,
        stats: {
            total_pendentes: pendentes.length,
            total_aprovados: aprovados.length,
            valor_total: aprovados.reduce((acc, p) => acc + p.valor, 0)
        }
    });
});

app.post('/admin/aprovar', express.json(), (req, res) => {
    const { pagamentoId } = req.body;
    const pagamento = pagamentos.find(p => p.id === pagamentoId);
    if (pagamento) {
        pagamento.status = 'aprovado';
        pagamento.dataAprovacao = new Date();
        res.json({ sucesso: true });
    } else {
        res.status(404).json({ erro: 'Pagamento não encontrado' });
    }
});

app.listen(PORT, () => console.log(`🚀 Servidor profissional rodando na porta ${PORT}`));
