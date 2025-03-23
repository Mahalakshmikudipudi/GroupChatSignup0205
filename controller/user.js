const User = require('../models/user');
const bcrypt = require('bcrypt')

function isstringinvalid(string){
    if(string == undefined ||string.length === 0){
        return true
    } else {
        return false
    }
}

 const signup = async (req, res)=>{
    try{
    const { name, email, phonenumber, password } = req.body;
    
    //console.log('email', email)
    if(isstringinvalid(name) || isstringinvalid(email) || isstringinvalid(password) || isstringinvalid(phonenumber)){
        return res.status(400).json({err: "Bad parameters, Something is missing"})
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltrounds = 10;
    bcrypt.hash(password, saltrounds, async (err, hash) => {
        console.log(err)
        await User.create({ name, email, phonenumber, password: hash })
        res.status(201).json({success: true, message: 'Successfuly create new user'})
    })
    }catch(err) {
            res.status(500).json({success: false, message: 'Failed to create new user'});
        }

}

module.exports = {
    signup
}