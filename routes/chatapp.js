const express = require('express');

const chatController = require('../controller/chatapp')
const userauthentication = require('../middleware/auth');



const router = express.Router();

router.post('/send', userauthentication.authenticate,   chatController.addMessages );

router.get('/all', userauthentication.authenticate,  chatController.getMessages );




module.exports = router;
