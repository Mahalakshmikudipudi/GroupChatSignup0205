const path = require('path');

const express = require('express');
var cors = require('cors')


const sequelize = require('./util/database');
const User = require('./models/user');


const userRoutes = require('./routes/user');


const app = express();


app.use(
    cors({
        origin: "http://127.0.0.1:5500",
        methods: "PUT",
    })
);


app.use(express.json());

app.use('/user', userRoutes)

sequelize.sync()
    .then(() => {
        app.listen(3000, () => {
            console.log(`Server running on localhost 3000`);
        });
    })
    .catch(err => {
        console.log(err);
    })
