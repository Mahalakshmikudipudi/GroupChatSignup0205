const Sequelize = require('sequelize')


const sequelize = new Sequelize('group-chat', 'root', 'Kiyansh@020508' ,{
    dialect: 'mysql',
    host: 'localhost'
})

module.exports = sequelize;