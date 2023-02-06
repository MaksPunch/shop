const { Router } = require("express");
require("dotenv").config();
const auth = require('../middleware/auth.js');
const authAdmin = require('../middleware/authAdmin.js')
const jf = require('jsonfile')
const path = './models/goods.json'
const file = jf.readFileSync(path)

const router = Router();

const findGoodById = (id) => {
    const goods = file.goods
    const goodFound = goods.filter((good) => {
        if (good.id === id) {
             return good
        }   
    });
    if (goodFound.length > 0) {
        return goodFound
    }
    return false
}

router.get('/', (req, res) => {
	return res.status(200).json({
    success: "true",
    message: "goods",
    goods: file.goods,
  });
})

router.get('/:id', (req, res) => {
	return res.status(200).json({
    success: "true",
    message: "goods",
    goods: file.goods[req.params.id]
  });
})

router.post('/', auth, (req, res) => {
	const good = {
		id: file.goods.length,
		name: req.body.name,
    img: req.body.img,
    price: req.body.price,
    description: req.body.description
	}
	jf.readFile(path, (err, obj) => {
        if (err) throw err;
        let fileObj = obj;
        fileObj.goods.push(good);
        jf.writeFile(path, fileObj, {spaces: 2},(err) => {
          if (err) throw err;
        })
    })
	return res.status(200).json({
	    success: "true",
	    message: "good added successfully",
	    good: good,
  	});
})

router.put('/:id', auth, (req, res) => {
	const id = parseInt(req.params.id, 10);
	const goodFound = findGoodById(id);
	if (!goodFound) {
	    return res.status(404).json({
	      success: 'false',
	      message: 'good not found',
	    });
  	}
  const good = {
    id: id,
		name: req.body.name || goodFound.name,
    img: req.body.img || goodFound.img,
    price: req.body.price || goodFound.price,
    description: req.body.description || goodFound.description
	}
  jf.readFile(path, (err, obj) => {
      if (err) throw err;
      let fileObj = obj;
      fileObj.goods[id] = good;
      jf.writeFile(path, fileObj, {spaces: 2}, (err) => {
        if (err) throw err;
      })
  })
  return res.status(200).json({
    success: "true",
    message: "good updated successfully",
    good: good,
  });
})

router.delete('/:id', auth, authAdmin, (req, res) => {
	const id = parseInt(req.params.id, 10);
	jf.readFile(path, (err, obj) => {
      if (err) throw err;
      let fileObj = obj;
      fileObj.goods.splice(id, 1);
      jf.writeFile(path, fileObj, {spaces: 2}, (err) => {
        if (err) throw err;
      })
  })
  return res.status(200).json({
    success: "true",
    message: "good deleted successfully",
    good: file.goods[id]
  });
})

module.exports = router;