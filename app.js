const express = require("express");
const app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())

const session = require('express-session')

const auth = require('./routes/auth');
const refreshTokenRoutes = require("./routes/refreshToken.js");
const shopRouter = require('./routes/shopRouter.js')

app.use(session({
  name : '123',
  secret : 'corgi',
  resave : true,
  saveUninitialized: false,
  cookie : {
          maxAge:(1000 * 60 * 60 * 24 * 30)
  },
  refreshToken : ''
  
}));

app.use(express.json());
app.use('/api', auth);
app.use('/api/refreshToken', refreshTokenRoutes)
app.use('/api/good', shopRouter)

let server = app.listen(3000, () => {
	console.log("server listen to port 3000")
})

module.exports = server;