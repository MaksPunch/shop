const app = require('../app.js')
const request = require('supertest')
const expect = require('expect').default
const jf = require('jsonfile')
var cookies;
var cookiesAdmin;

let filePath = './models/goods.json'
const file = jf.readFileSync(filePath)

describe('AUTH required', () => {
    it('login', () => {
        return request(app).post('/api/login')
            .send({
                "email": "example@gmail.com",
                "password": "123456"
            })
            .expect(200)
            .then(res => {
                cookies = res.headers['set-cookie'].pop().split(';')[0];
            })
    })
    it('manager', () => {
        return request(app).post('/api/login')
            .send({
                "email": "example2@gmail.com",
                "password": "123456"
            })
            .expect(200)
            .then(res => {
                cookiesAdmin = res.headers['set-cookie'].pop().split(';')[0];
            })
    })
})

describe('GET /good', function() {
    it('get all goods', function(done) {
      request(app).get('/api/good')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          done();
        });
    });
    it('get good with id 1', function(done) {
        request(app).get('/api/good/1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            if (err) throw err;
            done();
          });
      });
});

describe('POST /good', () => {
    /* it('should return error because access denided', (done) => {
        request(app)
            .post('/api/good')
            .expect(403)
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    }) */
    it('should post a new good', (done) => {
        let good = {
            id: file.goods.length,
            name: "carrot",
            img: "carrot.png",
            price: "2999",
            description: "Морковь свежая"
        }
        request(app)
            .post('/api/good')
            .send(good)
            .set('cookie', cookies)
            .expect(200)
            .expect((res) => {
                expect(res.body.good.id).toStrictEqual(good.id)
                jf.readFile('./models/goods.json', (err, obj) => {
                    if (err) throw err;
                    const fileObj = obj;
                    fileObj.goods.splice(fileObj.goods.findIndex(el => el.id == good.id), 1)
                    jf.writeFile('./models/goods.json', fileObj, {spaces: 2}, (err) => {if (err) throw err})
                })
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
})

describe('PUT /good/:id', () => {
    it('should return error 403', (done) => {
        request(app)
            .put('/api/good/1')
            .expect(403)
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
    it('should update a good', (done) => {
        let good = {
            id: 1,
            name: "carrot",
            img: "carrot.png",
            price: "2999",
            description: "Морковь свежая"
        }
        request(app)
            .put('/api/good/1')
            .send(good)
            .set('cookie', cookies)
            .expect(200)
            .expect((res) => {
                expect(res.body.good).toStrictEqual(good)
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
})

describe('DELETE /good/:id', () => {
    it('should return error that user is not authorized', (done) => {
        request(app)
            .delete('/api/good/1')
            .expect(403)
            .expect(res => {
                expect(res.text).toStrictEqual('Not Authorized.')
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
    it('should return error that user is not admin', (done) => {
        request(app)
            .delete('/api/good/1')
            .set('cookie', cookies)
            .expect(403)
            .expect(res => {
                expect(res.text).toStrictEqual('Not Admin.')
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
    it('should delete a good', (done) => {
        request(app)
            .delete('/api/good/1')
            .set('cookie', cookiesAdmin)
            .expect(200)
            .expect((res) => {
                expect(res.body.good).toStrictEqual(file.goods.find(el => el.id == 1))
                jf.writeFile(filePath, file, {spaces: 2}, (err) => {
                    if (err) throw err
                })
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
})

describe('POST Auth', () => {
    it('should create valid refreshToken for logged user', (done) => {
        let user = {
            email: "example@gmail.com",
            password: "123456"
        }
        request(app)
            .post('/api/login')
            .send(user)
            .expect(200)
            .expect((res) => {
                jf.readFile('./models/UserToken.json', (err, obj) => {
                    if (err) throw err
                    expect(res.body.refreshToken).toStrictEqual(obj.userToken.find(el => el.userId == res.body.userId).token)
                })
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    }),
    it('should create a new user', (done) => {
        let user = {
            email: "aaaaa@gmail.com",
            password: "123456"
        }
        request(app)
            .post('/api/signUp')
            .send(user)
            .expect(201)
            .expect((res) => {
                jf.readFile('./models/user.json', (err, obj) => {
                    if (err) throw err
                    const fileObj = obj;
                    fileObj.users.splice(fileObj.users.findIndex(el => el.username == "aaaaa"), 1)
                    jf.writeFile('./models/user.json', fileObj, {spaces: 2}, (err) => {if (err) throw err})
                })
                expect(res.body.message).toStrictEqual("Account created sucessfully")
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
            
    }),
    it('should return error if email is already taken', (done) => {
        let user = {
            email: "example@gmail.com",
            password: "123456"
        }
        request(app)
            .post('/api/signUp')
            .send(user)
            .expect(400)
            .expect((res) => {
                expect(res.body.message).toStrictEqual("User with given email already exist")
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
    it('should login successfully', (done) => {
        let user = {
            email: "example5@gmail.com",
            password: "123456"
        }
        request(app)
            .post('/api/login')
            .send(user)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).toStrictEqual("Logged in sucessfully")
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
})

describe('refreshToken routes', () => {
    it('should create new access token', (done) => {
        request(app).post('/api/refreshToken')
            .set('cookie', cookies)
            .expect(200)
            .expect((res) => {
                expect(res.body.message).toStrictEqual('Access token created successfully')
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    }) 
    it('should logout successfully WITH cookies', (done) => {
        request(app).delete('/api/logout')
            .set('cookie', cookies)
            .expect(200)
            .expect(res => {
                expect(res.body.message).toStrictEqual('Logged Out Sucessfully')
            })
            .end((err, res) => {
                if (err) return done(err)
                done()
            })
    })
})