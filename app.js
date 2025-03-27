const path = require('path');

const express = require('express');
var cors = require('cors')


const sequelize = require('./util/database');
const User = require('./models/user');
const Chat = require('./models/chatapp');
const Group = require('./models/group');
const GroupMember = require('./models/groupMember');
const Message = require('./models/groupMessages')



const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/chatapp');
const groupRoutes = require('./routes/group');


const app = express();


app.use(cors());


app.use(express.json());

app.use('/user', userRoutes);
app.use('/chat', messageRoutes);
app.use('/group', groupRoutes);


User.hasMany(Chat);
Chat.belongsTo(User);

User.hasMany(Group, { foreignKey: 'createdBy', as: 'createdGroups' });
Group.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Group.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });
User.belongsToMany(Group, { through: GroupMember, foreignKey: 'userId', as: 'userGroups' });

GroupMember.belongsTo(Group, { foreignKey: "groupId", as: "group" });
GroupMember.belongsTo(User, { foreignKey: 'userId' });

Group.hasMany(GroupMember, { foreignKey: "groupId" });

User.hasMany(Message, { foreignKey: "userId" });
Group.hasMany(Message, { foreignKey: "groupId" });

Message.belongsTo(User, { foreignKey: "userId" });
Message.belongsTo(Group, { foreignKey: "groupId" });

sequelize.sync()    
    .then(() => {
        app.listen(3000, () => {
            console.log(`Server running on localhost 3000`);
        });
    })
    .catch(err => {
        console.log(err);
    })
