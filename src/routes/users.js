const express = require('express');
const { getAllUsers, registerUser, loginUser, editUserProfile, adminEditUserProfile, getUser, deleteUserbyId } = require('../controllers/users');
const {protected} = require('../middlewares/auth');
const {requestToken} = require('../helper/cookies')
const routes = express.Router();

routes.get('/', protected, getAllUsers);
routes.get('/:id', protected, getUser);
routes.post('/register', registerUser);
routes.post('/login', loginUser);
routes.get('/get-token', requestToken);
routes.put('/edit-profile', protected, editUserProfile);
routes.put('/edit-profile/:id', protected, adminEditUserProfile);
routes.delete('/:id', protected, deleteUserbyId);

module.exports = {
    routes
}