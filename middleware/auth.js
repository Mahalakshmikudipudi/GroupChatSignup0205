const jwt = require("jsonwebtoken");
const User = require("../models/users");

const authenticate = async (req, res, next) => {
    try {
        //console.log("Authorization Header:", req.header("Authorization"));
        let token = req.header("Authorization");
        
            
        //console.log("Token:", token);
        // Handle "Bearer <token>" format
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
        }

        // Extract actual token
        token = token.split(" ")[1];
        

        // Verify token
        const decoded = jwt.verify(token, "secretkey");
        
        // Find user
        const user = await User.findByPk(decoded.userId);
        //console.log("User:", user);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
        }

        req.user = user; // Attach user to request
        next();
    } catch (err) {
        console.error("Authentication Error:", err);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = { authenticate };
