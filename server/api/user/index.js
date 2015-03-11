'use strict';

var express = require('express');
var controller = require('./user.controller');

var router = express.Router();

// router.get('/', controller.index);
// router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

router.get('/me', controller.me);
router.post('/requestRoommate', controller.requestRoommate);
router.post('/acceptRoommate', controller.acceptRoommate);
router.post('/denyRoommate', controller.denyRoommate);
router.post('/updateColleges', controller.updateColleges);
router.post('/updateRooms', controller.updateRooms);

module.exports = router;