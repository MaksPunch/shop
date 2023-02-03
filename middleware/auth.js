const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.session['refreshToken'];
        if (!token) return res.status(403).send("Not Authorized.");

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_PRIVATE_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.log(error)
        res.status(400).send("Invalid token");
    }
}