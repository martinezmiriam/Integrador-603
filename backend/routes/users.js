const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get("/:id", userController.getUserById);

router.patch("/:id", userController.updateUser);

module.exports = router;
