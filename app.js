const path = require('path');

const express = require('express');
var cors = require('cors')


const sequelize = require('./util/database');
const User = require('./models/user');
const Chat = require('./models/chatapp')


const userRoutes = require('./routes/user');
const messageRoutes = require('./routes/chatapp');


const app = express();


app.use(
    cors({
        origin: "http://127.0.0.1:5500",
        
    })
);


app.use(express.json());

app.use('/user', userRoutes);
app.use('/chat', messageRoutes);

User.hasMany(Chat);
Chat.belongsTo(User);

sequelize.sync()
    .then(() => {
        app.listen(3000, () => {
            console.log(`Server running on localhost 3000`);
        });
    })
    .catch(err => {
        console.log(err);
    })
