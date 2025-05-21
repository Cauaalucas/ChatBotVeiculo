// script.js
const chatbox = document.getElementById('chatbox');
const carModelInput = document.getElementById('carModelInput');
const sendButton = document.getElementById('sendButton');

// URL do backend (ajuste se necessário)
const backendUrl = 'http://localhost:3000/get-specs';

// Histórico de conversa
let chatHistory = [];

// Função para adicionar mensagens ao chatbox
function addMessage(message, sender) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = message.replace(/\n/g, '<br>');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    if (sender === 'error') {
        messageElement.classList.remove('ai-message');
        messageElement.classList.add('error-message');
    } else if (sender === 'loading') {
        messageElement.classList.remove('ai-message');
        messageElement.classList.add('loading-message');
    }
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
    return messageElement;
}

// Função para transformar links brutos em links clicáveis (Markdown)
function convertLinks(text) {
    return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}

// Função para enviar a mensagem para o backend
async function sendMessage() {
    const userMessage = carModelInput.value.trim();

    if (!userMessage) return;

    // Exibe a mensagem do usuário
    addMessage(userMessage, 'user');
    chatHistory.push({ role: "user", content: userMessage });
    carModelInput.value = '';
    sendButton.disabled = true;

    // Mensagem de carregando
    const loadingMessageElement = addMessage("Buscando informações...", 'loading');

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, history: chatHistory }),
        });

        // Remove "carregando"
        if (loadingMessageElement) chatbox.removeChild(loadingMessageElement);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}: ${response.statusText}` }));
            throw new Error(errorData.error || 'Erro desconhecido do servidor');
        }

        const data = await response.json();

        // Converter links markdown para HTML
        const formattedReply = convertLinks(data.reply);

        // Exibe resposta da IA (já formatada)
        addMessage(formattedReply, 'ai');
        chatHistory.push({ role: "assistant", content: data.reply });

    } catch (error) {
        if (loadingMessageElement && chatbox.contains(loadingMessageElement)) {
            chatbox.removeChild(loadingMessageElement);
        }
        addMessage(`Erro: ${error.message}`, 'error');
    } finally {
        sendButton.disabled = false;
        carModelInput.focus();
    }
}

// Listeners
sendButton.addEventListener('click', sendMessage);
carModelInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') sendMessage();
});
