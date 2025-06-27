const {pool} = require('../configs/db');
const createError = require('http-errors');

const selectAllDevices = (orderBy, order, limit, offset, search) => {
    return pool.query(`SELECT * FROM device WHERE (device.id ILIKE '%' || COALESCE(NULLIF($1, ''), '') || '%') ORDER BY ${orderBy} ${order} LIMIT $2 OFFSET $3`, [search, limit, offset]);
}

const insertDevice = ({id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic}) => {
    try {
        return pool.query("INSERT INTO device (id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic) VALUES($1, $2, $3, $4, $5, $6, $7)", [id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic]);
    } catch (err) {
        return next(err);
    }
}

const updateDevice = ({deviceId, id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic}) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (id !== undefined) {
        fields.push(`id=$${idx++}`);
        values.push(id); 
    }
    if (longitude !== undefined) {
        fields.push(`longitude=$${idx++}`);
        values.push(longitude);
    }
    if (latitude !== undefined) {
        fields.push(`latitude=$${idx++}`);
        values.push(latitude);
    }
    if (status !== undefined) {
        fields.push(`status=$${idx++}`);
        values.push(status);
    }
    if (threshold_hum !== undefined) {
        fields.push(`threshold_hum=$${idx++}`);
        values.push(threshold_hum);    
    }
    if (threshold_temp !== undefined) {
        fields.push(`threshold_temp=$${idx++}`);
        values.push(threshold_temp);
    }
    if (mqtt_topic !== undefined) {
        fields.push(`mqtt_topic=$${idx++}`);
        values.push(mqtt_topic);
    }

    if (fields.length === 0) {
        return next(createError(400, 'No fields to update'));
    }

    values.push(deviceId);

    const query = `UPDATE device SET ${fields.join(', ')}, updated_at=CURRENT_TIMESTAMP WHERE id=$${idx} RETURNING id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic, created_at, updated_at`;

    return pool.query(query, values); 
}

const selectDeviceById = (id) => {
    return pool.query(`SELECT * FROM device WHERE id=$1`, [id]);
}

const deleteDevice = (id) => {
    return pool.query(`DELETE FROM device WHERE id=$1 RETURNING id, longitude, latitude, status, threshold_hum, threshold_temp, mqtt_topic, created_at, updated_at`, [id]);
}

const totalDevice = () => {
    return pool.query("SELECT COUNT(*) FROM device");
}

module.exports = {
    selectAllDevices,
    insertDevice,
    updateDevice,
    selectDeviceById,
    deleteDevice,
    totalDevice
}