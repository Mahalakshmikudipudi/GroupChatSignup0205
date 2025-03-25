const token = localStorage.getItem('token'); // Token from login

// Decode token to get logged-in username
function getUsernameFromToken(token) {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
    return payload.name;
}

const loggedInUser = getUsernameFromToken(token);
console.log("Logged in user:", loggedInUser);

// Load groups when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchGroups();
});

// Function to fetch and display groups
async function fetchGroups() {
    try {
        const response = await axios.get(`http://localhost:3000/chat/groups`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            displayGroups(response.data.groups);
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
}

// Display groups in sidebar
function displayGroups(groups) {
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '';

    groups.forEach(group => {
        const listItem = document.createElement('li');
        listItem.textContent = group.name;
        listItem.setAttribute('data-group-id', group.id);

        listItem.addEventListener('click', () => {
            selectGroup(group.id, group.name);
        });

        groupList.appendChild(listItem);
    });
}

// Function to create a group
async function createGroup() {
    const groupName = prompt("Enter group name:");
    if (!groupName) return;

    try {
        const response = await axios.post(`http://localhost:3000/chat/creategroup`, { name: groupName }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            alert("Group created successfully!");
            fetchGroups(); // Reload groups
        }
    } catch (error) {
        console.error('Error creating group:', error);
    }
}

// Variable to store selected group
let selectedGroupId = null;

// Function to select a group
function selectGroup(groupId, groupName) {
    selectedGroupId = groupId;
    document.getElementById('group-title').textContent = `Chat: ${groupName}`;
    loadMessagesFromLocalStorage();
    fetchNewMessages();
}

// Load messages for the selected group from local storage
function loadMessagesFromLocalStorage() {
    if (!selectedGroupId) return;

    const chatList = document.getElementById('messages-list');
    chatList.innerHTML = '';

    let messages = JSON.parse(localStorage.getItem(`chatMessages_${selectedGroupId}`)) || [];
    messages.forEach(chat => appendMessage(chat));
}

// Fetch new messages for the selected group
async function fetchNewMessages() {
    if (!selectedGroupId) return;

    try {
        let lastMessageId = localStorage.getItem(`lastMessageId_${selectedGroupId}`) || 0;

        const response = await axios.get(`http://localhost:3000/chat/all/${selectedGroupId}?lastMessageId=${lastMessageId}`, {
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

// Append message to the chat window
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
    let messages = JSON.parse(localStorage.getItem(`chatMessages_${selectedGroupId}`)) || [];

    messages = [...messages, ...newMessages];

    // Keep only the last 10 messages
    if (messages.length > 10) {
        messages = messages.slice(messages.length - 10);
    }

    localStorage.setItem(`chatMessages_${selectedGroupId}`, JSON.stringify(messages));

    // Update lastMessageId in local storage
    if (newMessages.length > 0) {
        localStorage.setItem(`lastMessageId_${selectedGroupId}`, newMessages[newMessages.length - 1].id);
    }
}

// Send message to the selected group
async function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value.trim();

    if (!message || !selectedGroupId) return;

    try {
        await axios.post(`http://localhost:3000/chat/send`, { message, groupId: selectedGroupId }, {
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
setTimeout(fetchNewMessages, 1000);

// Load user's groups on page load
document.addEventListener('DOMContentLoaded', fetchUserGroups);

// 🟢 Fetch the groups the user is part of
async function fetchUserGroups() {
    try {
        const response = await axios.get('http://localhost:3000/group/mygroups', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            displayGroups(response.data.groups);
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
}

// 🔹 Display groups in the sidebar
function displayGroups(groups) {
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '';

    groups.forEach(group => {
        const listItem = document.createElement('li');
        listItem.textContent = group.name;
        listItem.setAttribute('data-group-id', group.id);

        listItem.addEventListener('click', () => {
            selectGroup(group.id, group.name);
        });

        groupList.appendChild(listItem);
    });
}

// 🔹 Show Create Group Modal
function showCreateGroupModal() {
    document.getElementById('createGroupModal').style.display = 'block';
}

// 🔹 Close Modal
function closeModal() {
    document.getElementById('createGroupModal').style.display = 'none';
}

// 🟢 Create a new group
async function createGroup() {
    const groupName = document.getElementById('groupNameInput').value.trim();
    if (!groupName) return alert("Group name is required!");

    try {
        const response = await axios.post('http://localhost:3000/group/create', 
            { name: groupName },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
            alert("Group created successfully!");
            fetchUserGroups(); // Reload groups
            closeModal();
        }
    } catch (error) {
        console.error('Error creating group:', error);
    }
}

// 🟢 Invite a user to a group
async function inviteUser() {
    const email = document.getElementById('inviteEmailInput').value.trim();
    const groupId = selectedGroupId;

    if (!email || !groupId) return alert("Provide a valid email & select a group!");

    try {
        const response = await axios.post('http://localhost:3000/group/invite',
            { email, groupId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
            alert(`User invited successfully to ${response.data.groupName}`);
        }
    } catch (error) {
        console.error('Error inviting user:', error);
    }
}


// 🔹 Select a group & load messages
function selectGroup(groupId, groupName) {
    selectedGroupId = groupId;
    document.getElementById('group-title').textContent = `Chat: ${groupName}`;
    fetchMessages(); // Load messages for the selected group
}

// 🟢 Fetch messages for a selected group
async function fetchMessages() {
    if (!selectedGroupId) return;

    try {
        const response = await axios.get(`http://localhost:3000/group/messages/${selectedGroupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            displayMessages(response.data.messages);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// 🔹 Display messages in chat window
function displayMessages(messages) {
    const messageList = document.getElementById('messages-list');
    messageList.innerHTML = '';

    messages.forEach(msg => {
        const listItem = document.createElement('li');
        listItem.textContent = (msg.user.name === loggedInUser) 
            ? `You: ${msg.message}` 
            : `${msg.user.name}: ${msg.message}`;
        messageList.appendChild(listItem);
    });
}

// 🟢 Send a message to the group
async function sendMessage() {
    const messageInput = document.getElementById('chat-input');
    const message = messageInput.value.trim();

    if (!message || !selectedGroupId) return;

    try {
        await axios.post('http://localhost:3000/group/send',
            { message, groupId: selectedGroupId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        messageInput.value = '';
        fetchMessages(); // Refresh messages
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// 🔹 Auto-fetch new messages every 2 seconds
setTimeout(fetchMessages, 2000);


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
};


