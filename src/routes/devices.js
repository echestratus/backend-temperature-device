const express = require('express');
const {protected} = require('../middlewares/auth');
const { getAllDevices, getDevice, registerDevice, adminEditDevice, deleteDeviceById } = require('../controllers/devices');
const routes = express.Router();

routes.get('/', getAllDevices);
routes.get('/:id', getDevice);
routes.post('/register', registerDevice);
routes.put('/edit-device/:id', protected, adminEditDevice);
routes.delete('/:id', protected, deleteDeviceById);

module.exports = {
    routes
}