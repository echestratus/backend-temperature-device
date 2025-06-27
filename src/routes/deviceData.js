const express = require('express');
// const {protected} = require('../middlewares/auth');
const {getAllDeviceData} = require('../controllers/deviceData');
const routes = express.Router();

routes.get('/:id', getAllDeviceData);

module.exports = {
    routes
}