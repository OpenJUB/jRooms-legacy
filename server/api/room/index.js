'use strict';

var express = require('express');
var controller = require('./room.controller');

var router = express.Router();

router.get('/get', controller.getRoom);
router.get('/getCollegeMap', controller.getCollegeMap);

module.exports = router;