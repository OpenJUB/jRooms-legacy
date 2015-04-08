'use strict';

var express = require('express');
var controller = require('./room.controller');

var router = express.Router();

router.get('/get', controller.getRoom);

module.exports = router;