
document.getElementById("group-title").innerText = `Chat App`;

// Establish WebSocket connection with authentication token
const socket = io("http://localhost:3000", {
    auth: { token: localStorage.getItem("token") } //  Send token
});

function getUserIdFromToken() {
    const token = localStorage.getItem("token"); // Retrieve stored token
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode payload
        return payload.userId; // Extract userId
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};


// Handle connection errors (e.g., invalid token)
socket.on("connect_error", (err) => {
    console.error("Connection failed:", err.message);
});

document.addEventListener("DOMContentLoaded", () => {
    const savedGroupId = localStorage.getItem("openGroupId");
    const savedGroupName = localStorage.getItem("openGroupName");

    if (savedGroupId && savedGroupName) {
        openChat(savedGroupId, savedGroupName);
    }
    socket.emit("get-all-groups"); // Request groups via WebSocket
    loadGroupMembers();
});

socket.on("all-groups", (groups) => {
    displayGroups(groups); // Display all groups received
});

// Listen for new groups
socket.on("new-group", (group) => {
    displayGroups([group]);
    openChat(group.id, group.name);
    displaySystemMessage(`You created ${groupname}`);
});



// Listen for chat opening after group creation
socket.on("open-chat", ({ groupId, groupname, message }) => {
    openChat(groupId, groupname);
    displaySystemMessage(`You created ${groupname}`);
});


// Create Group
document.getElementById("createGroupBtn").addEventListener("click", async() => {
    const groupName = prompt("Enter group name:");
    if (groupName) {
        socket.emit("create-group", { name: groupName });
    }
})

// Add group to UI
function displayGroups(groups) {
    const groupList = document.getElementById("group-list");
    groupList.innerHTML = "";
    groups.forEach(group => {
        const li = document.createElement("li");
        li.textContent = `${group.name} (Created by: ${group.createdBy})`;
        li.dataset.groupId = group.id;
        li.onclick = () => openChat(group.id, group.name);
        li.classList.add("group-item");
        groupList.appendChild(li);
    });
}

// Open chat window
function openChat(groupId, groupName) {
    document.getElementById("group-title").innerText = `Chat - ${groupName}`;
    socket.emit("join-group", { groupId });
    socket.emit("get-group-members", { groupId });
    localStorage.setItem("openGroupId", groupId);
    localStorage.setItem("openGroupName", groupName);
    document.getElementById("groupmessages-list").innerHTML = ""; // Clear old messages
    document.getElementById("back-to-groups").style.display = "block";
    document.getElementById("search-bar").style.display = "block";
    document.getElementById("group-sidebar").style.display = "none";
    document.getElementById("sidebar-group").style.display = "block";
    document.getElementById("groupchat-input-container").style.display = "block";
    document.getElementById("groupchat-box").style.display = "block";
    loadGroupMembers();
    loadGroupMessages();
};

function displaySystemMessage(message) {
    const systemMsg = document.createElement("div");
    systemMsg.classList.add("system-message");
    systemMsg.textContent = message;
    document.getElementById("groupmessages-list").appendChild(systemMsg);
}

// Search Users by Name, Email, or Phone
document.getElementById("searchBtn").addEventListener("click", function () {
    const searchQuery = document.getElementById("search-user-input").value.trim();
    if (searchQuery === "") {
        console.log("Empty search query. No request sent.");
        return;
    }

    
    socket.emit("search-users", { query: searchQuery });
});

//  Display Search Results
socket.on("search-results", (users) => {
    const resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = ""; // Clear old results

    users.forEach(user => {
        const userElement = document.createElement("div");
        userElement.classList.add("search-result");
        userElement.innerHTML = `
            <span>${user.name} (${user.email})</span>
            <button onclick="addUser(${user.id})">Add</button>
        `;
        resultsDiv.appendChild(userElement);
        document.getElementById("search-user-input").value = ""; // Clear input after searching
    });
});

// Add User to Group (Admin Only)
function addUser(userId) {
    const groupId = localStorage.getItem("openGroupId");
    if (!groupId) { 
         console.error("No group selected. Cannot add user.");
          return;
     }
    socket.emit("add-user", { groupId, userId });
};

// Notify Users When Someone is Added
socket.on("user-added", ({ groupId, message }) => {
    alert(message);
    
    // Check if we are currently in this group, then refresh members
    if (groupId === localStorage.getItem("openGroupId")) {
        loadGroupMembers();
    }
});


// Notify Added User Personally
socket.on("added-to-group", ({ userId, groupId, name, message }) => {
    if(userId) {
        alert(message);
    }

    // If the logged-in user is in the group, refresh members list
    if (groupId === localStorage.getItem("openGroupId")) {
        loadGroupMembers();
    }
});

// Promote User to Admin
function promoteUser(userId) {
    const groupId = getCurrentGroupId();
    socket.emit("make-admin", { groupId, userId });
}

//  Notify Promotion in Group
socket.on("admin-promoted", ({ userId, message }) => {
    alert(message);
    loadGroupMembers();
});

//  Remove User from Group
function removeUser(userId) {
    const groupId = localStorage.getItem("openGroupId");
    if (!groupId) {
        console.error("No group selected. Cannot remove user.");
        return;
    }
    socket.emit("remove-user", { groupId, userId });
}

//  Notify Group When a User is Removed
socket.on("user-removed", ({ userId, message }) => {
    alert(message);
    loadGroupMembers();
});


//  Load Group Members
function loadGroupMembers() {
    const groupId = localStorage.getItem("openGroupId");
    socket.emit("get-group-members", { groupId });
}

socket.on("update-group-members", ({ groupId, members }) => {
    if (groupId === localStorage.getItem("openGroupId")) {
        displayGroupMembers(members);
    }
});

function displayGroupMembers(members) {
    const membersList = document.getElementById("group-members");
    membersList.innerHTML = "";

    members.forEach(member => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            ${member.user?.name || "Unknown User"} 
            ${member.isAdmin ? '<span class="admin-badge">(Admin)</span>' : ""}
            <div>
                ${!member.isAdmin ? `<button onclick="promoteUser('${member.userId}')">Promote</button>` : ""}
                <button onclick="removeUser('${member.userId}')">Remove</button>
            </div>
        `;
        membersList.appendChild(listItem);
    });
};

document.getElementById("groupchat-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Prevent newline in input
        sendGroupMessage(); // Call function
    }
});

function sendGroupMessage() {
    const messageInput = document.getElementById("groupchat-input");
    const message = messageInput.value.trim();
    const groupId = localStorage.getItem("openGroupId");

    if (!message) return;

    socket.emit("send-group-message", { groupId, message });
    messageInput.value = ""; // Clear input after sending
};

socket.off('receive-group-message').on("receive-group-message", (data) => {
    displayFile(data); // Display message when received
});




function loadGroupMessages() {
    const groupId = localStorage.getItem("openGroupId");
    socket.emit("get-group-messages", { groupId });
}


socket.on("load-group-messages", (data) => {
    const chatBox = document.getElementById("groupmessages-list");
    chatBox.innerHTML = ""; // Clear chat before loading

    let isArchived = true;

    data.messages.forEach((message, index) => {
        if (index === data.messages.length - 50) { // Assuming last 50 are recent messages
            const divider = document.createElement("div");
            divider.classList.add("chat-divider");
            divider.innerText = "Recent Messages Below";
            chatBox.appendChild(divider);
            isArchived = false;
        }
        displayFile(message, isArchived);
    });
});





function backToGroupList() {
    document.getElementById("group-title").textContent = "ChatApp";

    localStorage.removeItem("openGroupId");
    localStorage.removeItem("openGroupName");
    document.getElementById("back-to-groups").style.display = "none";
    document.getElementById("group-sidebar").style.display = "block";
    document.getElementById("sidebar-group").style.display = "none";
    document.getElementById("search-bar").style.display = "none";
    document.getElementById("groupchat-input-container").style.display = "none";
    document.getElementById("groupchat-box").style.display = "none";
}

document.getElementById("send-button").addEventListener("click", () => {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    const selectedGroupId = localStorage.getItem("openGroupId");
    const currentUserId = getUserIdFromToken(); // Get the logged-in user's ID
    if (!selectedGroupId) return alert("No group selected!");   


    if (!file) return alert("Please select a file!");

    const reader = new FileReader();
    reader.readAsDataURL(file); // Convert file to Base64
    reader.onload = function () {
        socket.emit("send-file", {
            groupId: selectedGroupId,
            fileData: reader.result, // Base64 data
            senderId: currentUserId,
            fileName: file.name,
            fileType: file.type
        });
    };
});

// Listen for file messages from WebSocket
socket.on("receive-file", (data) => {
    displayFile(data);
});

function displayFile(data) {
    const chatBox = document.getElementById("groupmessages-list");
    const div = document.createElement("div");
    div.classList.add("message");

    const loggedInUserId = getUserIdFromToken(); // Extract user ID from token
    const senderId = data.userId; // Extract sender's ID
    const senderName = (String(senderId) === String(loggedInUserId)) ? "You" : (data.user ? data.user.name : "Unknown");
    
    console.log("Received file data:", data); // Debugging log

    div.innerHTML = `
        <div class="message-header">
            <strong>${senderName}:</strong>
            <span class="timestamp">${new Date(data.createdAt).toLocaleTimeString()}</span>
        </div>
    `;

    if (data.messageType === "text") {
        // Display normal text message
        div.innerHTML += `<p class="chat-text">${data.message}</p>`;
    } else if (data.messageType === "file") {
        // Display image, video, or downloadable file
        if (data.fileType.startsWith("image/")) {
            div.innerHTML += `<img src="${data.fileUrl}" class="chat-image" alt="Image">`;
        } else if (data.fileType.startsWith("video/")) {
            div.innerHTML += `<video controls class="chat-video"><source src="${data.fileUrl}" type="${data.fileType}"></video>`;
        } else {
            div.innerHTML += `<a href="${data.fileUrl}" download="${data.fileName}" class="chat-file">
                                📁 Download ${data.fileName}
                              </a>`;
        }
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
}


// Logout button
document.getElementById('logoutBtn').addEventListener('click', () => {
    // Send logout signal to backend
    socket.emit('userLogout', { userId: 'USER_ID' }); // Pass appropriate user details

    // Optionally, clear the user token and other session data
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');

    // Redirect to login page
    window.location.href = '../html/login.html';
});
