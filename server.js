const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// ============================================
// BASE DE DADOS (em memória)
// ============================================
let pagamentos = [];
let configuracoes = {
    contas: { emis: '123456789', multicaixa: '99999', iban: 'AO06012345678901234567890' }
};

// ============================================
// ENDPOINT DE TESTE (sempre funciona)
// ============================================
app.get('/teste', (req, res) => {
    console.log('✅ Teste endpoint acedido');
    res.json({ 
        status: 'online', 
        timestamp: new Date().toISOString(),
        mensagem: 'Servidor funcionando perfeitamente'
    });
});

// ============================================
// ENDPOINT DE ANÁLISE (versão simulada para testar)
// ============================================
app.post('/analisar-web', express.json({ limit: '50mb' }), (req, res) => {
    try {
        console.log('📸 Análise recebida');
        
        // Resposta simulada (para testar sem IA)
        const resultado = {
            area: "Tecnologia da Informação",
            resumo: "Profissional dedicado com experiência em atendimento ao cliente e suporte técnico.",
            melhorias: [
                "Adicionar cursos de especialização",
                "Incluir objetivos profissionais claros",
                "Destacar conquistas mensuráveis"
            ],
            palavras_chave: ["TI", "Suporte Técnico", "Atendimento", "Informática"],
            cursos: ["Fundamentos de Redes", "Excel Avançado"],
            curriculo_organizado: "Currículo organizado profissionalmente...",
            biografia: "Biografia profissional gerada...",
            carta_recomendacao: "Carta de recomendação personalizada...",
            linkedin_titulo: "Profissional de TI",
            linkedin_resumo: "Resumo para LinkedIn..."
        };
        
        res.json({ sucesso: true, ...resultado });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// ============================================
// ENDPOINTS DE PAGAMENTO
// ============================================
app.post('/pagamento/criar', express.json(), (req, res) => {
    console.log('💰 Pagamento criado');
    const { email, plano, valor, moeda } = req.body;
    
    const pagamento = {
        id: 'PAG' + Date.now().toString().slice(-8),
        email, plano, valor, moeda,
        status: 'pendente',
        data: new Date().toISOString(),
        comprovativo: null
    };
    
    pagamentos.push(pagamento);
    res.json({ 
        sucesso: true, 
        pagamentoId: pagamento.id, 
        dadosBancarios: configuracoes.contas 
    });
});

app.post('/pagamento/comprovativo', express.json({ limit: '50mb' }), (req, res) => {
    console.log('📎 Comprovativo recebido');
    const { pagamentoId, comprovativoBase64, nomeArquivo } = req.body;
    
    const pagamento = pagamentos.find(p => p.id === pagamentoId);
    if (!pagamento) {
        return res.status(404).json({ erro: 'Pagamento não encontrado' });
    }
    
    pagamento.comprovativo = { 
        nome: nomeArquivo, 
        base64: comprovativoBase64, 
        data: new Date() 
    };
    res.json({ 
        sucesso: true, 
        mensagem: 'Comprovativo recebido. Aguarde aprovação.' 
    });
});

// ============================================
// ENDPOINTS ADMIN
// ============================================
app.post('/admin/login', express.json(), (req, res) => {
    const { senha } = req.body;
    res.json({ sucesso: senha === 'admin123' });
});

app.get('/admin/pagamentos', (req, res) => {
    const pendentes = pagamentos.filter(p => p.status === 'pendente');
    const aprovados = pagamentos.filter(p => p.status === 'aprovado');
    res.json({ pendentes, aprovados });
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

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor ESTÁVEL rodando na porta ${PORT}`);
    console.log(`📌 Endpoints disponíveis:`);
    console.log(`   - GET  /teste`);
    console.log(`   - POST /analisar-web`);
    console.log(`   - POST /pagamento/criar`);
    console.log(`   - POST /pagamento/comprovativo`);
    console.log(`   - POST /admin/login`);
    console.log(`   - GET  /admin/pagamentos`);
    console.log(`   - POST /admin/aprovar`);
});
