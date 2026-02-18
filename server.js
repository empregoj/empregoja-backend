const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// ============================================
// ENDPOINT DE TESTE
// ============================================
app.get('/teste', (req, res) => {
    res.json({ 
        sucesso: true, 
        mensagem: '🚀 Servidor funcionando!',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ENDPOINT PARA WEB (versão simplificada sem IA)
// ============================================
app.post('/analisar-web', express.json({ limit: '50mb' }), (req, res) => {
    try {
        const { foto, email, pais, estilo } = req.body;
        
        if (!foto) {
            return res.status(400).json({ sucesso: false, erro: 'Foto não enviada' });
        }
        
        // Resposta simulada (para testar sem IA)
        const resultado = {
            area: "Tecnologia da Informação",
            resumo: "Profissional dedicado com experiência em atendimento ao cliente e suporte técnico. Busca oportunidade para aplicar habilidades de comunicação e resolução de problemas.",
            melhorias: [
                "Adicionar cursos de especialização",
                "Incluir objetivos profissionais claros",
                "Destacar conquistas mensuráveis"
            ],
            palavras_chave: ["TI", "Suporte Técnico", "Atendimento", "Informática", "Redes"],
            cursos: ["Fundamentos de Redes", "Excel Avançado", "Atendimento ao Cliente"],
            curriculo_organizado: "João Silva\nEmail: joao@email.com\nTel: 923 456 789\n\nExperiência Profissional:\n- Estágio em Suporte Técnico (2024)\n- Atendimento ao Cliente (2023)\n\nFormação:\n- Técnico de Informática\n- Ensino Médio Completo",
            biografia: "João é um jovem profissional angolano, natural de Luanda, com paixão por tecnologia e resolução de problemas. Desde cedo demonstrou interesse por computadores e sistemas, tendo concluído o curso Técnico de Informática com aproveitamento. Durante o estágio, destacou-se pela proatividade e capacidade de aprender rapidamente. Busca agora oportunidades para crescer na área de TI e contribuir para o desenvolvimento tecnológico do país.",
            carta_recomendacao: "Luanda, 18 de Fevereiro de 2026\n\nAo Departamento de Recursos Humanos,\n\nVenho por meio desta recomendar o João Silva, que trabalhou connosco como estagiário de Suporte Técnico durante 6 meses. Durante este período, João demonstrou grande capacidade de aprendizagem, responsabilidade e excelente relacionamento com a equipa e clientes.\n\nDestaco a sua habilidade para resolver problemas de forma criativa e a sua dedicação em aprender novas tecnologias. Sem dúvida, será uma mais-valia para qualquer organização.\n\nAtenciosamente,\nEng. Pedro Santos\nSupervisor de TI",
            linkedin_titulo: "Técnico de Informática | Suporte Técnico | Atendimento ao Cliente",
            linkedin_resumo: "Profissional de TI com formação técnica e experiência em suporte ao cliente. Hábil na resolução de problemas e com forte capacidade de comunicação. Busca oportunidade para crescer na área de tecnologia."
        };
        
        res.json({ sucesso: true, ...resultado });
        
    } catch (error) {
        console.error('Erro no endpoint:', error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
});

// ============================================
// ENDPOINTS DE PAGAMENTO
// ============================================
app.post('/iniciar-pagamento', express.json(), (req, res) => {
    const { plano, valor, moeda } = req.body;
    
    res.json({
        sucesso: true,
        referencia: 'PAG' + Date.now().toString().slice(-8),
        instrucoes: `Pague ${valor} ${moeda} para o plano ${plano} usando EMIS ou Multicaixa.`,
        dados_bancarios: {
            emis: 'EMIS: 123 456 789',
            multicaixa: 'Entidade: 99999 | Referência: ' + Date.now().toString().slice(-8)
        }
    });
});

// ============================================
// ENDPOINT ADMIN
// ============================================
app.post('/admin/login', express.json(), (req, res) => {
    const { senha } = req.body;
    
    if (senha === 'admin123') {
        res.json({ sucesso: true, token: 'admin-token-' + Date.now() });
    } else {
        res.json({ sucesso: false, erro: 'Senha incorreta' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📌 Endpoints disponíveis:`);
    console.log(`   - GET  /teste`);
    console.log(`   - POST /analisar-web`);
    console.log(`   - POST /iniciar-pagamento`);
    console.log(`   - POST /admin/login`);
});
