'use strict';

var express = require('express');
var controller = require('./admin.controller');

var router = express.Router();

router.get('/resetUsers', controller.reset_users);
router.get('/deleteUsers', controller.delete_users);

// Stubs
router.get('/importUsers', controller.importUsers);
router.get('/currentSettings', controller.currentSettings);
router.post('/updateSettings', controller.updateSettings);

module.exports = router;