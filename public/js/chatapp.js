const token = localStorage.getItem('token');  // Token from login

// Decode token to get logged-in username
function getUsernameFromToken(token) {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    return payload.name; 
}

const loggedInUser = getUsernameFromToken(token);
console.log("Logged in user:", loggedInUser);

// Load messages from local storage and display them
function loadMessagesFromLocalStorage() {
    const chatList = document.getElementById('messages-list');
    chatList.innerHTML = '';

    let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.forEach(chat => appendMessage(chat));
}

// Fetch only new messages from the backend
async function fetchNewMessages() {
    try {
        let lastMessageId = localStorage.getItem('lastMessageId') || 0;

        const response = await axios.get(`http://localhost:3000/chat/all?lastMessageId=${lastMessageId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            const newMessages = response.data.chats;

            newMessages.forEach(chat => appendMessage(chat));

            // Update local storage
            updateLocalStorage(newMessages);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// Append a new message to the chat window
function appendMessage(chat) {
    const chatList = document.getElementById('messages-list');
    const listItem = document.createElement('li');

    listItem.textContent = (chat.user.name === loggedInUser) ? `You: ${chat.message}` : `${chat.user.name}: ${chat.message}`;
    chatList.appendChild(listItem);

    // Auto-scroll to the latest message
    chatList.scrollTop = chatList.scrollHeight;
}

// Update local storage with new messages (keeping only the last 10)
function updateLocalStorage(newMessages) {
    let messages = JSON.parse(localStorage.getItem('chatMessages')) || [];

    messages = [...messages, ...newMessages];

    // Keep only the last 10 messages
    if (messages.length > 10) {
        messages = messages.slice(messages.length - 10);
    }

    localStorage.setItem('chatMessages', JSON.stringify(messages));

    // Update lastMessageId in local storage
    if (newMessages.length > 0) {
        localStorage.setItem('lastMessageId', newMessages[newMessages.length - 1].id);
    }
}

// Send a new message
async function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value.trim();

    if (!message) return;

    try {
        await axios.post(`http://localhost:3000/chat/send`, { message }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        messageInput.value = ''; // Clear input field
        fetchNewMessages(); // Fetch only new messages
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Add event listener for "Enter" key
document.getElementById("chat-input").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Auto-fetch new messages every second
document.addEventListener('DOMContentLoaded', () => {
    loadMessagesFromLocalStorage();
    fetchNewMessages();
    setTimeout(fetchNewMessages, 1000);
});

// Logout function
async function logout() {
    try {
        const response = await axios.post(
            'http://localhost:3000/user/logout',
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        alert(response.data.message || 'Logged out successfully!');
        localStorage.removeItem('token');
        window.location.href = "../html/login.html"; // Redirect to login page
    } catch (error) {
        console.error("Logout failed:", error.response ? error.response.data.message : error.message);
        document.body.innerHTML += `<div style="color:red;">${error.response ? error.response.data.message : error.message}</div>`;
    }
}
