const express = require('express');
const router = express.Router();
const controller = require('../controllers/itemController');

router.post('/', controller.addItem);
router.get('/', controller.getItems);
router.put('/:id', controller.updateItem);
router.delete('/:id', controller.deleteItem);
router.get('/suggestions', controller.getSuggestions);

module.exports = router;
