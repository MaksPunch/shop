const jwt = require("jsonwebtoken");
const path = require('path')
const jf = require('jsonfile');

const file = path.join('./models/userToken.json')

const UserToken = jf.readFileSync(file);

const generateTokens = async (user) => {
    try {
        const payload = { id: user.id, roles: user.roles, email: user.email };
        const accessToken = jwt.sign(
            payload,
            process.env.ACCESS_TOKEN_PRIVATE_KEY,
            { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_PRIVATE_KEY,
            { expiresIn: "30d" }
        );
        const foundUserToken = await UserToken.userToken.find(el => el.userId == user.id);
        if (foundUserToken) await UserToken.userToken.splice(UserToken.userToken.findIndex(el => el.userId == user.id), 1)
        
        await UserToken.userToken.push({ userId: user.id, token: refreshToken });
        jf.writeFile(file, UserToken, {spaces: 2}, (err) => {if (err) throw err})
        return Promise.resolve({ accessToken, refreshToken });
    } catch (err) {
        return Promise.reject(err);
    }
};

module.exports = generateTokens;