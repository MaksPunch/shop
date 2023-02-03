const jf = require('jsonfile');
const path = require('path')

const file = path.join('./models/userToken.json')

const UserToken = jf.readFileSync(file).userToken;
const jwt = require("jsonwebtoken");

const verifyRefreshToken = (refreshToken) => {
    const privateKey = process.env.REFRESH_TOKEN_PRIVATE_KEY;

    return new Promise((resolve, reject) => {
        if (UserToken.find(el => el.token == refreshToken)) {
            jwt.verify(refreshToken, privateKey, (err, tokenDetails) => {
                if (err)
                    return reject({ error: true, message: "Invalid refresh token" });
                resolve({
                    tokenDetails,
                    error: false,
                    message: "Valid refresh token"
                });
            });
        }
        else {
            return reject({ error: true, message: "Invalid refresh token" });
        }
    })
}

module.exports = verifyRefreshToken;