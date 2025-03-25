const path = require('path');

const express = require('express');
var cors = require('cors')


const sequelize = require('./util/database');
const User = require('./models/user');
const Chat = require('./models/chatapp');
const Group = require('./models/group');
const GroupMember = require('./models/group');
const Message = require('./models/group');


const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/chatapp');
const groupRoutes = require('./routes/group');


const app = express();


app.use(
    cors({
        origin: "http://127.0.0.1:5500",
        
    })
);


app.use(express.json());

app.use('/user', userRoutes);
app.use('/chat', messageRoutes);
app.use('/group', groupRoutes);

//  Define Relationships

// A User can have many chats
User.hasMany(Chat);
Chat.belongsTo(User);

User.hasMany(Group);
Group.belongsTo(User);

Group.hasMany(Message);
Message.belongsTo(Group);

User.hasMany(Message);
Message.belongsTo(User);

Group.belongsToMany(User);
User.belongsToMany(Group);

sequelize.sync()
    .then(() => {
        app.listen(3000, () => {
            console.log(`Server running on localhost 3000`);
        });
    })
    .catch(err => {
        console.log(err);
    })
