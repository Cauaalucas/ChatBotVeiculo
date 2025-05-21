// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Erro: GEMINI_API_KEY não encontrada no .env");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Servidor do Chatbot de Carros está rodando!');
});

app.post('/get-specs', async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Mensagem não fornecida.' });
    }

    // Monta contexto com histórico, se existir
    let contexto = "";
    if (history && Array.isArray(history) && history.length > 0) {
        contexto = history.map(msg =>
            `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`
        ).join("\n");
    }

    // Prompt para IA: respostas curtas, tópicos, links de compra e uso de contexto
    const prompt = `
Você é um assistente automotivo inteligente, sucinto e objetivo.
- Use o contexto da conversa para evitar repetir informações e manter a resposta relevante.
- Responda a seguinte consulta: "${message}"
- Organize em tópicos claros (máximo 5).
- Não ser limitado em apenas carros 0 KM, pense sempre no usuario pobre.
- Se a dúvida for sobre recomendações, liste de 3 a 5 veículos, com nome do modelo/ano e um motivo rápido.
- Para perguntas sobre veículos específicos, dê só os dados principais e objetivos (motor, consumo, velocidade máxima, 0 a 100, etc.).
- No final caso a pergunta seja relacionada a valor, ou a adquirir um veiculo, inclua links para compra na OLX, Webmotors e Mercado Livre, buscando pelo nome do carro/ano se disponível.
- Formate os links em Markdown assim:
[OLX](https://www.olx.com.br/autos-e-pecas?q=MODELO)
[Webmotors](https://www.webmotors.com.br/carros/estoque?q=MODELO)
[Mercado Livre](https://lista.mercadolivre.com.br/MODELO)
- Responda em português e sem enrolação.
- Se precisar de mais detalhes, peça de forma educada.
${contexto ? `\nHistórico da conversa:\n${contexto}\n` : ''}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        const errorMessage = error.response?.data?.error?.message || error.message || "Erro desconhecido.";
        res.status(500).json({ error: `Erro ao processar a solicitação. Detalhes: ${errorMessage}` });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse http://localhost:${port}`);
});
