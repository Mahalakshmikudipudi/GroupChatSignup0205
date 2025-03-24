const API_URL = 'http://localhost:3000/chat';
const token = localStorage.getItem('token');  // Token from login

// Function to fetch chat messages
async function loadMessages() {
    try {
        const response = await axios.get(`${API_URL}/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';

        response.data.chats.forEach(chat => {
            const li = document.createElement('li');
            li.textContent = `${chat.user.name}: ${chat.message}`;
            messagesList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Function to send a new chat message
async function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value.trim();

    if (!message) return;

    try {
        await axios.post(`${API_URL}/send`, { message }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        messageInput.value = '';  // Clear input
        loadMessages();  // Refresh chat
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Load messages on page load
window.onload = loadMessages;
