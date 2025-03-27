const token = localStorage.getItem('token');  // Token from login
document.getElementById("group-title").innerText = `Chat App`;

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
};

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
};

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
};


async function fetchNewGroups() {
    try {

        const response = await axios.get(`http://localhost:3000/group/allgroups`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Response is", response.data);
        if (response.status === 200) {
            const newGroups = response.data.groups;

            console.log("New Groups:", newGroups);

            newGroups.forEach(group => appendGroup(group));

        }
    } catch (error) {
        console.error('Error fetching groups:', error);
    }
};

function appendGroup(group) {
    const groupList = document.getElementById('group-list');
    const listItem = document.createElement('li');

    listItem.textContent = group.name;
    listItem.onclick = () => openGroup(group.id, group.name);
    groupList.appendChild(listItem);

    // Auto-scroll to the latest group
    groupList.scrollTop = groupList.scrollHeight;
};

document.getElementById("createGroupBtn").addEventListener("click", async () => {
    try {
        const groupName = prompt("Enter group name:");

        const response = await axios.post('http://localhost:3000/group/creategroup',
            { name: groupName },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log(response.data);
        if(response.status === 201) {
            alert("Group Created Successfully");
            fetchNewGroups();
        }
        
    }catch(err) {
        console.log("Error Created Group:", err);
    }
    
});

async function fetchGroupMembers(groupId) {
    try {
        const response = await axios.get(`http://localhost:3000/group/members?groupId=${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const membersList = document.getElementById("group-members");
        membersList.innerHTML = ""; // Clear previous list

        response.data.members.forEach(member => {
            const li = document.createElement("li");
            li.textContent = `${member.name} ${member.isAdmin ? "(Admin)" : ""}`;

            // If the logged-in user is an admin, show action buttons
            if (response.data.isAdmin && !member.isAdmin) {
                const makeAdminBtn = document.createElement("button");
                makeAdminBtn.textContent = "Make Admin";
                makeAdminBtn.onclick = () => makeUserAdmin(member.id, groupId);

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Remove";
                removeBtn.onclick = () => removeUserFromGroup(member.id, groupId);

                li.appendChild(makeAdminBtn);
                li.appendChild(removeBtn);
            }

            membersList.appendChild(li);
        });

    } catch (error) {
        console.error("Error fetching members:", error);
    }
}



function openGroup(groupId, groupName) {

    localStorage.setItem("selectedGroupId", groupId); // ✅ Save groupId in local storage
    localStorage.setItem("selectedGroupName", groupName);
    // Redirect to chat page with group ID and name in the URL
    window.location.href = "../html/chatapp.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const groupId = localStorage.getItem("selectedGroupId");
    const groupName = localStorage.getItem("selectedGroupName");
    if (groupName) {
        document.getElementById("group-sidebar").style.display = "none"; // Hide groups sidebar
        document.getElementById("chat-input-container").style.display = "none";
        document.getElementById("chat-box").style.display = "none";
        document.getElementById("group-title").innerText = `Chatting in ${groupName}`; // Update title
        document.getElementById("back-to-groups").style.display = "block"; // Hide back button
        document.getElementById("invite-container").style.display = "block";
        document.getElementById("sidebar-group").style.display = "block";
        document.getElementById("groupchat-input-container").style.display = "block";
        document.getElementById("groupchat-box").style.display = "block";

    }

    //Fetch previous messages for this group
    fetchMessages(groupId);
});

document.getElementById("groupchat-input").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendGroupMessage();
    }
});

async function searchUsers() {
    const query = document.getElementById("search-user-input").value.trim();
    if (!query) return;

    try {
        const response = await axios.get(`http://localhost:3000/group/search?query=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const searchResults = document.getElementById("search-results");
        searchResults.innerHTML = ""; // Clear previous results

        response.data.users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = `${user.name} (${user.email})`;

            const addUserBtn = document.createElement("button");
            addUserBtn.textContent = "Add to Group";
            addUserBtn.onclick = () => addUserToGroup(user.id);

            li.appendChild(addUserBtn);
            searchResults.appendChild(li);
        });

    } catch (error) {
        console.error("Error searching users:", error);
    }
}

async function addUserToGroup(userId) {
    const groupId = localStorage.getItem("selectedGroupId");

    try {
        await axios.post(`http://localhost:3000/group/addUser`, { groupId, userId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("User added successfully!");
        fetchGroupMembers(groupId); // Refresh group members list

    } catch (error) {
        console.error("Error adding user:", error);
    }
}

async function makeUserAdmin(userId, groupId) {
    try {
        await axios.post(`http://localhost:3000/group/makeAdmin`, { groupId, userId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("User is now an Admin!");
        fetchGroupMembers(groupId);

    } catch (error) {
        console.error("Error promoting user:", error);
    }
}

async function removeUserFromGroup(userId, groupId) {
    try {
        await axios.delete(`http://localhost:3000/group/removeUser`, { groupId, userId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("User removed from group!");
        fetchGroupMembers(groupId);

    } catch (error) {
        console.error("Error removing user:", error);
    }
}


async function fetchMessages(groupId) {
    console.log("Group Id is:", groupId);
    try {
        const response = await axios.get(`http://localhost:3000/group/getMessages?groupId=${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const groupMessagesList = document.getElementById("groupmessages-list");
        groupMessagesList.innerHTML = ""; // Clear messages before appending

        response.data.messages.forEach((message) => {
            const li = document.createElement("li");
            if (message.user.name === loggedInUser) {
                li.classList.add("my-message"); // CSS for logged-in user's messages
                li.textContent = `You: ${message.message}`;
            } else {
                li.classList.add("other-message"); // CSS for other users' messages
                li.textContent = `${message.user.name}: ${message.message}`;
            }
            groupMessagesList.appendChild(li);
        });
    } catch (error) {
        console.error("Error fetching messages:", error.response?.data || error.message);
    }
}

async function sendGroupMessage() {
    const groupmessageInput = document.getElementById("groupchat-input");
    const message = groupmessageInput.value.trim();
    const groupId = localStorage.getItem('selectedGroupId');

    console.log("TEXT is:", message);

    if (!message) return alert("Message cannot be empty");

    try {
        const response = await axios.post(
            `http://localhost:3000/group/sendMessage`,
            { message, groupId },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        //console.log("Response is:", response.data);

        groupmessageInput.value = ""; // Clear input field

        console.log("Group Id is", groupId);

        fetchMessages(groupId); // Reload messages
    } catch (error) {
        console.error("Error sending message:", error.response?.data || error.message);
    }
}


async function inviteUser() {
    const userId = document.getElementById("invite-user-id").value;
    const groupId = localStorage.getItem('selectedGroupId');
    const token = localStorage.getItem("token"); // Retrieve token

    //console.log("Group and User IDS", groupId, userId);

    try {
        const response = await axios.post("http://localhost:3000/group/inviteUser", { groupId, userId }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert(response.data.message);
    } catch (error) {
        console.error("Error inviting user:", error);
        alert(error.response?.data?.error || "Failed to invite user.");
    }
};

function backToGroupList() {
    document.getElementById("group-sidebar").style.display = "block"; // Show group list
    document.getElementById("groupchat-box").style.display = "none"; // Hide chat box
    document.getElementById("back-to-groups").style.display = "none"; // Hide back button
    document.getElementById("invite-container").style.display = "none";
    document.getElementById("chat-box").style.display = "block";
    document.getElementById("chat-input-container").style.display = "block";
    document.getElementById("sidebar-group").style.display = "none";
    document.getElementById("group-title").innerText = `Chat App`;
    localStorage.removeItem("selectedGroupId"); // Clear selected group
    localStorage.removeItem("selectedGroupName");
};




