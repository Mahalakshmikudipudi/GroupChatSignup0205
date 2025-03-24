const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

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
        return res.status(401).json({err: "Bad parameters, Something is missing"})
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
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

};

const generateAccessToken = (id, name, ispremiumuser) => {
    return jwt.sign({ userId : id, name: name, ispremiumuser } ,'secretkey');
}


const login = async (req, res) => {
    try{
    const { email, password } = req.body;
    if(isstringinvalid(email) || isstringinvalid(password)){
        return res.status(400).json({message: 'Email id or password is missing ', success: false})
    }
    //console.log(password);
    const user  = await User.findAll({ where : { email }})
        if(user.length > 0){
           bcrypt.compare(password, user[0].password, (err, result) => {
           if(err){
            throw new Error('Something went wrong')
           }
            if(result === true){
                return res.status(200).json({success: true, message: "User logged in successfully", 
                    token: generateAccessToken(user[0].id, user[0].name, user[0].ispremiumuser)})
            }
            else{
            return res.status(401).json({success: false, message: 'Password is incorrect'})
           }
        })
        } else {
            return res.status(404).json({success: false, message: 'User Doesnot exitst'})
        }
    }catch(err){
        res.status(500).json({message: err, success: false})
    }
};

const logoutUser = async(req, res) => {
    try {
        
        // If using sessions, destroy it
        if (req.session) {
            req.session.destroy(err => {
                if (err) {
                    return res.status(500).json({ message: 'Logout failed. Try again!' });
                }
                res.status(200).json({ message: 'Logged out successfully!' });
            });
        } else {
            res.status(200).json({ message: 'Logged out successfully!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong!' });
    }
};

module.exports = {
    signup,
    login,
    generateAccessToken,
    logoutUser
}