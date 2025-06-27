const { response } = require("../helper/response");
const createError = require('http-errors');
const { totalDevice, selectAllDevices, selectDeviceById, insertDevice, updateDevice, deleteDevice } = require("../models/devices");

const getAllDevices = async (req, res, next) => {
    try {
        const orderBy = req.query.orderBy || 'created_at';
        const order = req.query.order || 'DESC';
        const limit = req.query.limit || 2;
        const page = req.query.page || 1;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const totalData = parseInt((await totalDevice()).rows[0].count);
        const totalPage = Math.ceil(totalData / limit);
        const {rows} = await selectAllDevices(orderBy, order, limit, offset, search);
        const pagination = {
            orderBy,
            order,
            limit,
            page,
            offset,
            search,
            totalData,
            totalPage
        }
        return response(res, "success", 200, "Data fetched Successfully", rows, pagination);
    } catch (err) {
        console.error('Error to fetch devices: ', err);
        return next(createError.InternalServerError());
    }
}

const getDevice = async (req, res, next) => {
    try {
        const id = req.params.id;
        const {rows:[device]} = await selectDeviceById(id);
        return response(res, "success", 200, "Data fetched successfully", device)
    } catch (err) {
        console.error('Error to fetch devices: ', err);
        return next(createError.InternalServerError());
    }
}

const registerDevice = async (req, res, next) => {
    try {    
        const { id, longitude, latitude, status, hum_min, hum_max, temp_min, temp_max, mqtt_topic } = req.body;
        
        const adminRole = req.decoded.data.role; // From auth middleware
        if (adminRole !== 'admin' || adminRole !== 'engineer') {
            return next(new createError.Unauthorized());
        }

        // Validate id
        if (!id) {
            return next(createError(400, 'id is required'));
        }
        if (typeof id !== 'string' || id.length < 5 || id.length > 128) {
            return next(createError(400, 'ID must be a string between 5 and 128 characters'));
        }
        
        // Validate longitude
        if (!longitude) {
            return next(createError(400, 'Longitude is required'));
        }
        if (typeof longitude !== 'number') {
            return next(createError(400, 'Invalid type for longitude'));
        }

        // Validate latitude
        if (!latitude) {
            return next(createError(400, 'Longitude is required'));
        }
        if (typeof latitude !== 'number') {
            return next(createError(400, 'Invalid type for latitude'));
        }

        // Validate status
        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }
        const allowedStatus = ['offline', 'online'];
        if (!allowedStatus.includes(status)) {
            return next(createError(400, `Status must be one of the following: ${allowedStatus.join(', ')}`));
        }
        
        // Validate hum_min
        if (!hum_min) {
            return next(createError(400, 'hum_min is required'));
        }
        if (typeof hum_min !== 'number') {
            return next(createError(400, 'Invalid type for hum_min'));
        }

        // Validate hum_max
        if (!hum_max) {
            return next(createError(400, 'hum_max is required'));
        }
        if (typeof hum_max !== 'number') {
            return next(createError(400, 'Invalid type for hum_max'));
        }
        
        // Validate temp_min
        if (!temp_min) {
            return next(createError(400, 'temp_min is required'));
        }
        if (typeof temp_min !== 'number') {
            return next(createError(400, 'Invalid type for temp_min'));
        }
        
        // Validate temp_max
        if (!temp_max) {
            return next(createError(400, 'temp_max is required'));
        }
        if (typeof temp_max !== 'number') {
            return next(createError(400, 'Invalid type for threshold_temp'));
        }

        // Validate mqtt_topic
        if (!mqtt_topic) {
            return next(createError(400, 'mqtt_topic is required'));
        }
        if (typeof mqtt_topic !== 'string') {
            return next(createError(400, 'Invalid type for mqtt_topic'));
        }
        
        const data = {
            id: id,
            longitude: longitude,
            latitude: latitude,
            status: status,
            hum_min: hum_min,
            hum_max: hum_max,
            temp_min: temp_min,
            temp_max: temp_max,
            mqtt_topic: mqtt_topic
        }

        await insertDevice(data);
        return response(res, "success", 200, "Device added successfully");
    } catch(err) {
        console.error('Cannot register device: ', err);
        return next(new createError.InternalServerError());
    }

}

const adminEditDevice = async (req, res, next) => {
    try {
        const adminRole = req.decoded.data.role; // From auth middleware
        if (adminRole !== 'admin') {
            return next(new createError.Unauthorized());
        }

        const deviceId = req.params.id;
        
        const {id, longitude, latitude, status, hum_min, hum_max, temp_min, temp_max, mqtt_topic} = req.body;

        // Basic validation
        if (id !== undefined && (typeof id !== 'string' || id.trim() === '')) {
            return next(createError(400, 'id must be a non-empty string if provided.'));
        }
        if (longitude !== undefined && typeof longitude !== 'number') {
            return next(createError(400, 'longitude must be a real number'));
        }
        if (latitude !== undefined && typeof latitude !== 'number') {
            return next(createError(400, 'latitude must be a real number'));
        }
        const allowedStatus = ['online', 'offline'];
        if (status !== undefined && !allowedStatus.includes(status)) {
            return next(createError(400, `status must be one of the following: ${allowedStatus.join(', ')}`));
        }
        if (hum_min !== undefined && typeof hum_min !== 'number') {
            return next(createError(400, 'hum_min must be a real number'));
        }
        if (hum_max !== undefined && typeof hum_max !== 'number') {
            return next(createError(400, 'hum_max must be a real number'));
        }
        if (temp_min !== undefined && typeof temp_min !== 'number') {
            return next(createError(400, 'temp_min must be a real number'));
        }
        if (temp_max !== undefined && typeof temp_max !== 'number') {
            return next(createError(400, 'temp_max must be a real number'));
        }
        if (mqtt_topic !== undefined && typeof mqtt_topic !== 'string') {
            return next(createError(400, 'mqtt_topic must be a string.'));
        }
    
        const updateData = {
            deviceId: deviceId,
            id: id,
            longitude: longitude ? longitude : undefined,
            latitude: latitude ? latitude : undefined,
            status: status ? status.trim() : undefined,
            hum_min: hum_min ? hum_min : undefined,
            hum_max: hum_max ? hum_max : undefined,
            temp_min: temp_min ? temp_min : undefined,
            temp_max: temp_max ? temp_max : undefined,
            mqtt_topic: mqtt_topic ? mqtt_topic.trim() : undefined
        };
    
        const updatedDevice = await updateDevice(updateData);
    
        if (!updatedDevice) {
          return res.status(404).json({ message: 'Device Not Found.' });
        }
    
        return res.status(200).json({
          message: 'Device updated successfully.',
          device: updatedDevice.rows[0],
        });
      } catch (error) {
        console.error('Error updating device:', error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
      }
}

const deleteDeviceById = async(req, res, next) => {
    try {
        const adminRole = req.decoded.data.role;
        if (adminRole !== 'admin') {
            return next(new createError.Unauthorized());
        }
        const deviceId = req.params.id;

        const deletedDevice = await deleteDevice(deviceId);

        if (!deletedDevice) {
            return next(createError.NotFound('Device Not Found'));
        }
      
          return res.status(200).json({
            message: 'Device deleted successfully',
            device: deletedDevice,
          });

    } catch (err) {
        console.error('Error deleting device:', err);
        return next(createError.NotFound());
    }
}

module.exports = {
    getAllDevices,
    getDevice,
    registerDevice,
    adminEditDevice,
    deleteDeviceById
}