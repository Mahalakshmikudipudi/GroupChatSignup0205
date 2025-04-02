const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require("http");
const { AWS } = require("aws-sdk");

const sequelize = require('./util/database');
const User = require('./models/user');
const Group = require('./models/group');
const GroupMember = require('./models/groupMember');
const Message = require('./models/groupMessages');
const ArchivedChat = require('./models/archivedChats');
const { createGroup } = require("./controller/group");
const { getAllGroupsForUser } = require("./controller/group");
const { searchUsers } = require("./controller/group");
const { addUserToGroup } = require("./controller/group");
const { makeAdmin } = require("./controller/group");
const { removeUserFromGroup } = require("./controller/group");
const { getGroupMembers } = require("./controller/group");
const { sendMessage } = require("./controller/group");
const { getGroupMessages } = require("./controller/group");
const { signUp } = require("./controller/user");
const { login } = require("./controller/user");
const { handleFileUpload } = require("./controller/group");

const app = express();
const server = http.createServer(app); // Attach Express to an HTTP server
const io = require("socket.io")(server, {
    cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/html/home.html"));
});


// Define model relationships
User.hasMany(Group, { foreignKey: 'createdBy', as: 'createdGroups' });
Group.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'userId', as: 'userGroups' });

GroupMember.belongsTo(Group, { foreignKey: "groupId", as: "group" });
GroupMember.belongsTo(User, { foreignKey: 'userId' });

Group.hasMany(GroupMember, { foreignKey: "groupId" });
User.hasMany(GroupMember, { foreignKey: "userId" });

User.hasMany(Message, { foreignKey: "userId" });
Group.hasMany(Message, { foreignKey: "groupId" });

Message.belongsTo(User, { foreignKey: "userId" });
Message.belongsTo(Group, { foreignKey: "groupId" });

//  ArchivedChat Table Association (Fix)
ArchivedChat.belongsTo(User, { foreignKey: "userId" });
User.hasMany(ArchivedChat, { foreignKey: "userId" });


// Sync database and start the server
sequelize.sync()
    .then(() => {
        server.listen(3000, () => { // Use `server.listen` instead of `app.listen`
            console.log(`Server running on localhost 3000`);
        });
    })
    .catch(err => {
        console.log(err);
    });





//  Attach WebSocket to the same server
io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    //  Signup & Login do NOT require authentication
    socket.on("signup", async (data) => {
        await signUp(io, socket, data);
    });

    socket.on("login", async (data) => {
        await login(io, socket, data);
    });

    // Apply authentication ONLY for protected routes
    socket.use(async ([event, ...args], next) => {
        if (event === "signup" || event === "login") {
            return next(); // Skip authentication for signup & login
        }

        require("./middleware/auth2").authenticateSocket(socket, async (err) => {
            if (err) {
                console.log("Authentication failed:", err.message);
                socket.emit("auth-error", { message: "Authentication required" });
                return next(new Error("Authentication failed"));
            }

            if (!socket.user) {
                console.log(" Authentication failed: No user attached to socket");
                return next(new Error("No user attached to socket"));
            }

            console.log(" Authentication successful:", socket.user.name);
            next(); // Proceed with the request
        });
    });

    // Logout functionality
    socket.on("userLogout", async (data) => {
        // You may want to clean up any session data for the user here
        console.log(`User ${socket.id} logged out.`);

        // Optionally, broadcast to other clients that the user logged out
        socket.broadcast.emit("user-left", socket.id); // Notify others the user has left

        // Disconnect the user
        socket.disconnect(true);  // Immediately disconnect socket

        // Optionally, remove the user from the active users list if you're keeping track of it
    });

    // Handle file upload event
    socket.on("send-file", (fileData) => {
        handleFileUpload(io, socket, fileData); // Call controller method
    });

    //  PROTECTED EVENTS (Require Authentication)
    socket.on("join-group", ({ groupId }) => {
        socket.join(groupId);
        console.log(`User ${socket.id} joined group ${groupId}`);
    });

    socket.on("create-group", (data) => createGroup(io, socket, data));
    socket.on("get-all-groups", () => getAllGroupsForUser(io, socket));
    socket.on("get-group-members", (data) => getGroupMembers(io, socket, data));
    socket.on("search-users", (data) => searchUsers(io, socket, data));
    socket.on("add-user", (data) => addUserToGroup(io, socket, data));
    socket.on("make-admin", (data) => makeAdmin(io, socket, data));
    socket.on("remove-user", (data) => removeUserFromGroup(io, socket, data));
    socket.on("send-group-message", (data) => sendMessage(io, socket, data));
    socket.on("get-group-messages", (data) => getGroupMessages(io, socket, data));
    

    socket.on("leave-group", ({ groupId }) => {
        socket.leave(groupId);
        console.log(`User ${socket.id} left group ${groupId}`);
    });

    socket.on("disconnect", () => {
        console.log(" User disconnected:", socket.id);
    });
});
