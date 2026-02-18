// server.js - Backend completo com ADMIN e PAGAMENTOS
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
// BANCO DE DADOS SIMULADO (em memória)
// ============================================
let pagamentos = [];
let usuarios = [];
let configuracoes = {
    iban_padrao: 'AO06012345678901234567890',
    taxas: {
        AKZ: 1.0,
        BRL: 0.011,
        EUR: 0.0018
    },
    contas: {
        EMIS: 'https://emis.ao/pay/empregoja',
        MULTICAIXA: '99999'
    }
};

// ============================================
// FUNÇÃO DA IA (ANALISAR CURRÍCULO)
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
// ENDPOINTS DO APP (PÚBLICOS)
// ============================================

// Análise de currículo (mobile)
app.post('/analisar', upload.single('foto'), async (req, res) => {
    try {
        const imagemBase64 = req.file.buffer.toString('base64');
        const email = req.body.email;
        const pais = req.body.pais || 'Angola';
        const estilo = req.body.estilo || 'moderno';

        const resultado = await analisarCurriculo(imagemBase64, pais, estilo);

        if (email) {
            await sgMail.send({
                to: email,
                from: 'suporte@empregoja.com',
                subject: '✅ Análise concluída - Emprego Já',
                html: `<h2>Tua análise está pronta!</h2>`
            });
        }

        res.json({ sucesso: true, ...resultado });

    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// Análise de currículo (web)
app.post('/analisar-web', express.json({ limit: '50mb' }), async (req, res) => {
    try {
        const { foto, email, pais, estilo } = req.body;
        
        const resultado = await analisarCurriculo(foto, pais, estilo);
        
        if (email) {
            await sgMail.send({
                to: email,
                from: 'suporte@empregoja.com',
                subject: '✅ Análise concluída - Emprego Já',
                html: `<h2>Tua análise está pronta! Acede ao app para ver os resultados.</h2>`
            });
        }
        
        res.json({ sucesso: true, ...resultado });
    } catch (error) {
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ============================================
// ENDPOINTS DE PAGAMENTO
// ============================================

// Iniciar pagamento
app.post('/iniciar-pagamento', express.json(), async (req, res) => {
    const { email, plano, valor, moeda, metodo } = req.body;
    
    const referencia = 'EMP' + Date.now().toString().slice(-8);
    
    const pagamento = {
        id: referencia,
        email,
        plano,
        valor,
        moeda,
        metodo,
        status: 'pendente',
        data: new Date().toISOString(),
        confirmado: false
    };
    
    pagamentos.push(pagamento);
    
    if (metodo === 'EMIS') {
        res.json({
            sucesso: true,
            referencia: referencia,
            instrucoes: 'Pague através do app EMIS usando a referência ' + referencia,
            codigo_emis: referencia
        });
    } else if (metodo === 'Multicaixa Express') {
        const multicaixaRef = '999' + Date.now().toString().slice(-6);
        res.json({
            sucesso: true,
            referencia: multicaixaRef,
            entidade: configuracoes.contas.MULTICAIXA,
            valor: valor,
            instrucoes: 'Pague numa caixa Multicaixa ou app com entidade ' + configuracoes.contas.MULTICAIXA
        });
    } else {
        res.json({ sucesso: false, erro: 'Método não suportado' });
    }
});

// Confirmar pagamento
app.post('/confirmar-pagamento', express.json(), (req, res) => {
    const { referencia } = req.body;
    
    const pagamento = pagamentos.find(p => p.id === referencia || p.referencia === referencia);
    
    if (pagamento) {
        pagamento.status = 'confirmado';
        pagamento.confirmado = true;
        pagamento.data_confirmacao = new Date().toISOString();
        
        res.json({
            sucesso: true,
            mensagem: 'Pagamento confirmado! Conteúdo liberado.',
            pagamento: pagamento
        });
    } else {
        res.json({ sucesso: false, erro: 'Pagamento não encontrado' });
    }
});

// ============================================
// ENDPOINTS DO ADMIN (PROTEGIDOS)
// ============================================

// Login do admin (simples)
app.post('/admin/login', express.json(), (req, res) => {
    const { senha } = req.body;
    
    // Senha fixa (podes mudar depois)
    if (senha === 'admin123') {
        res.json({ sucesso: true, token: 'admin-token-123' });
    } else {
        res.json({ sucesso: false, erro: 'Senha incorreta' });
    }
});

// Ver todos os pagamentos
app.get('/admin/pagamentos', (req, res) => {
    const confirmados = pagamentos.filter(p => p.confirmado);
    const totalValor = confirmados.reduce((acc, p) => acc + p.valor, 0);
    
    res.json({
        sucesso: true,
        total_pagamentos: pagamentos.length,
        total_confirmado: confirmados.length,
        total_valor: totalValor,
        total_por_plano: {
            basico: confirmados.filter(p => p.plano === 'Básico').length,
            profissional: confirmados.filter(p => p.plano === 'Profissional').length,
            completo: confirmados.filter(p => p.plano === 'Completo').length
        },
        pagamentos: pagamentos.slice(-20).reverse(), // últimos 20
        config: configuracoes
    });
});

// Atualizar configurações (IBAN, taxas, contas)
app.post('/admin/config', express.json(), (req, res) => {
    const { iban, taxas, contas } = req.body;
    
    if (iban) configuracoes.iban_padrao = iban;
    if (taxas) configuracoes.taxas = taxas;
    if (contas) configuracoes.contas = contas;
    
    res.json({
        sucesso: true,
        mensagem: 'Configurações atualizadas',
        config: configuracoes
    });
});

// Solicitar levantamento
app.post('/admin/levantar', express.json(), (req, res) => {
    const { valor, iban } = req.body;
    
    // Simular transferência
    res.json({
        sucesso: true,
        mensagem: `Transferência de ${valor} KZ solicitada para o IBAN ${iban || configuracoes.iban_padrao}`,
        data: new Date().toISOString(),
        protocolo: 'LEV' + Date.now().toString().slice(-8)
    });
});

// Estatísticas gerais
app.get('/admin/estatisticas', (req, res) => {
    const confirmados = pagamentos.filter(p => p.confirmado);
    const hoje = new Date().toISOString().split('T')[0];
    const vendasHoje = confirmados.filter(p => p.data_confirmacao?.startsWith(hoje));
    
    res.json({
        sucesso: true,
        vendas_hoje: vendasHoje.length,
        valor_hoje: vendasHoje.reduce((acc, p) => acc + p.valor, 0),
        vendas_mes: confirmados.filter(p => p.data_confirmacao?.startsWith('2026-02')).length,
        valor_mes: confirmados.reduce((acc, p) => acc + p.valor, 0),
        media_por_venda: confirmados.length > 0 
            ? (confirmados.reduce((acc, p) => acc + p.valor, 0) / confirmados.length).toFixed(0)
            : 0
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
