const token = localStorage.getItem('token');  // Token from login

// Decode token to get logged-in username
function getUsernameFromToken(token) {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1])); // Decoding JWT payload
    return payload.name; 
}

const loggedInUser = getUsernameFromToken(token);  // Get logged-in user's name

console.log("Logged in user:", loggedInUser);

// Function to fetch chat messages
async function loadMessages() {
    try {
        const response = await axios.get(`http://localhost:3000/chat/all`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';

        const chatList = document.getElementById('chat-list');
        chatList.innerHTML = '';

        response.data.chats.forEach(chat => {
            const li = document.createElement('li');
            if (chat.user.name === loggedInUser) {
                li.textContent = `You: ${chat.message}`;
                chatList.appendChild(li);
            } else {
                li.textContent = `${chat.user.name}: ${chat.message}`;
                messagesList.appendChild(li);
            }

            
        });
        chatList.scrollTop = chatList.scrollHeight;
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
        await axios.post(`http://localhost:3000/chat/send`, { message }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        messageInput.value = '';  // Clear input
        loadMessages();  // Refresh chat
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

document.getElementById("chat-input").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

setInterval(loadMessages, 1000); // Fetch new messages every 3 seconds


async function logout() {
    try {
        const response = await axios.post(
            'http://localhost:3000/user/logout',
            {},
            { headers: { "Authorization": `Bearer ${token}` } }
        );

        alert(response.data.message || 'Logged out successfully!');
        localStorage.removeItem('token'); // Clear the token from storage
        window.location.href = "../html/login.html"; // Redirect to login page
    } catch (error) {
        console.error("Logout failed:", error.response ? error.response.data.message : error.message);
        document.body.innerHTML += `<div style="color:red;">${error.response ? error.response.data.message : error.message}</div>`;
    }
}
