const { Router } = require("express");
const bcrypt = require("bcrypt");
const generateTokens = require("../utils/generateTokens.js");
require("dotenv").config();
const auth = require('../middleware/auth.js')
const authAdmin = require('../middleware/authAdmin.js')

const router = Router();
const path = './models/user.json'
const jf = require('jsonfile');
const connection = require('../models/db.js')

const User = jf.readFileSync(path);

function emailValidate(email) {
    return email.toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}

// signup
router.post("/signUp", async (req, res) => {
    try {
        if (!req.body.email) return res.status(401).json({ error: true, message: "email is required" })
        if (!req.body.password) return res.status(401).json({ error: true, message: "password is required" })
        if (!emailValidate(req.body.email)) return res.status(401).json({ error: true, message: "email is not valid" })
        connection.query('select email from users', async (err, result) => {
            if (err) throw err;
            const userEmail = result.find(el => el == req.body.email)
            if (userEmail)
                return res
                    .status(400)
                    .json({ error: true, message: "User with given email already exist" });

            const salt = await bcrypt.genSalt(Number(process.env.SALT));
            const hashPassword = await bcrypt.hash(req.body.password, salt);

            const newUser = {
                id: User.users[User.users.length - 1].id + 1,
                email: req.body.email,
                password: hashPassword,
                roles: 'buyer'
            }
            connection.query('insert into users (email, password, roles) values (?, ?, ?)', 
            [req.body.email, hashPassword, 'buyer'], (err) => {if (err) throw err})

            res
                .status(201)
                .json({ error: false, message: "Account created sucessfully", user: newUser });
            })
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// login
router.post("/logIn", async (req, res) => {
    try {
        const user = await User.users.find(el => el.email == req.body.email);
        if (!user)
            return res
                .status(401)
                .json({ error: true, message: "Invalid email" });

        const verifiedPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );
        if (!verifiedPassword)
            return res
                .status(401)
                .json({ error: true, message: "Invalid Password" });
        if (user.deleted) 
            return res
                .status(401)
                .json({ error: true, message: "User is deleted" })
        const { accessToken, refreshToken } = await generateTokens(user); 
        req.session['refreshToken'] = refreshToken;
        res.status(200).json({
            error: false,
            accessToken,
            refreshToken,
            message: "Logged in sucessfully"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

router.get('/profile', auth, (req, res) => {
    try {
            return res.status(200).json({
                success: 'true',
                user: {
                    email: req.user.email,
                    uid: req.user.id,
                    roles: req.user.roles
                } 
            })
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})

router.put("/updateUser", auth, async (req, res) => {
    try {
        const user = User.users.find(el => el.id === req.user.id);
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        const updatedUser = {
            id: req.user.id,
            name: req.body.name || user.name,
            email: req.body.email || user.email,
            phone: req.body.phone || user.phone,
            password: hashPassword || user.password,
            roles: req.user.roles
        }
        jf.readFile(path, (err, obj) => {
            if (err) throw err
            const fileObj = obj;
            fileObj.users[user.id - 1] = updatedUser
            jf.writeFile(path, fileObj, {spaces: 2}, (err) => {
                if (err) throw err;
              })
          })
          return res.status(200).json({
            success: "true",
            message: "user updated successfully",
            user: updatedUser,
          });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
})

router.delete('/deleteUser/:id', auth, authAdmin, (req, res) => {
    const id = req.params.id
    try {
        jf.readFile(path, (err, obj) => {
            if (err) throw err;
            const fileObj = err;
            fileObj.users.splice(i, 1);
            jf.writeFile(path, fileObj, {spaces: 2}, err => {if (err) throw err})
        })
        return res.status(200).json({
            success: "true",
            message: "user deleted successfully",
            user: User.users[id]
        });
    } catch (err) {
        console.log(err)
        res.status(500).json({error: true, message: "Internal Server Error"})
    }
})

// logout
router.delete("/logout", auth, async (req, res) => {
    try {
        jf.readFile('./models/UserToken.json', (err, obj) => {
            if (err) throw err;
            const fileObj = obj;
            const userToken = fileObj.userToken.find(el => el.token == req.session.refreshToken);
            if (!userToken)
                return res
                    .status(200)
                    .json({ error: false, message: "Not Logged In" });
            fileObj.userToken.splice(obj.userToken.findIndex(el => el.token == req.session.refreshToken), 1);
            jf.writeFile('./models/UserToken.json', fileObj, {spaces: 2}, (err) => { if (err) throw err })
            req.session.destroy();
            res.clearCookie('123')
            res.status(200).json({ error: false, message: "Logged Out Sucessfully" });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});


module.exports = router;