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
router.post('/requestRoommate', controller.add_roommate);
router.post('/acceptRoommate', controller.confirm_roommate);
router.post('/denyRoommate', controller.deny_roommate);
router.post('/updateColleges', controller.updateColleges);
//router.post('/updateRooms', controller.updateRooms);

module.exports = router;