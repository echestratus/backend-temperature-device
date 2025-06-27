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
        const { id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic } = req.body;
        
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
        const allowedStatus = ['unknown', 'normal', 'abnormal'];
        if (!allowedStatus.includes(status)) {
            return next(createError(400, `Status must be one of the following: ${allowedStatus.join(', ')}`));
        }
        
        // Validate threshold_hum
        if (!threshold_hum) {
            return next(createError(400, 'threshold_hum is required'));
        }
        if (typeof threshold_hum !== 'number') {
            return next(createError(400, 'Invalid type for threshold_hum'));
        }
        
        // Validate threshold_temp
        if (!threshold_temp) {
            return next(createError(400, 'threshold_temp is required'));
        }
        if (typeof threshold_temp !== 'number') {
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
            threshold_hum: threshold_hum,
            threshold_temp: threshold_temp,
            mqtt_topic: mqtt_topic
        }

        await insertDevice(data);
        return response(res, "success", 200, "Device added successfully");
    } catch(err) {
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
        
        const {id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic} = req.body;

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
        if (threshold_hum !== undefined && typeof threshold_hum !== 'number') {
            return next(createError(400, 'threshold_hum must be a real number'));
        }
        if (threshold_temp !== undefined && typeof threshold_temp !== 'number') {
            return next(createError(400, 'threshold_temp must be a real number'));
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
            threshold_hum: threshold_hum ? threshold_hum : undefined,
            threshold_temp: threshold_temp ? threshold_temp : undefined,
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