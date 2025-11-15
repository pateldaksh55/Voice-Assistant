// backend/src/routes/parseRoutes.js
const express = require('express');
const router = express.Router();
const { parseCommand } = require('../controllers/parseController');

router.post('/', parseCommand);

module.exports = router;
