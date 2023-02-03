const jwt = require("jsonwebtoken");
const jf = require('jsonfile')

const verifyRefreshToken = (refreshToken) => {
    const privateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY;
    return new Promise((resolve, reject) => {
        jf.readFile('./models/UserToken.json', (err, obj) => {
            if (err) throw err;
            const UserToken = obj.userToken;
            const foundUserToken = UserToken.find(el => el.token == refreshToken);
            if (!foundUserToken)
                return reject({ error: true, message: "Invalid refresh token" });
        });
        
        jwt.verify(refreshToken, privateKey, (err, tokenDetails) => {
            if (err)
                return reject({ error: true, message: "Invalid refresh token" });
            resolve({
                tokenDetails,
                error: false,
                message: "Valid refresh token",
            });
        });
    });
};

module.exports = verifyRefreshToken;