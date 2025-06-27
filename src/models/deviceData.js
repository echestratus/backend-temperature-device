const {pool} = require('../configs/db');
const createError = require('http-errors');

/**
 * Fetch device data with optional time range filter and sort order.
 * @param {string} deviceId - The device ID to fetch data for.
 * @param {string} [startTime] - ISO string or timestamp to filter data from (inclusive).
 * @param {string} [endTime] - ISO string or timestamp to filter data up to (inclusive).
 * @param {'asc'|'desc'} [sortOrder='desc'] - Sort order by timestamp, default desc.
 * @returns {Promise<Array>} - Array of device_data rows matching the criteria.
 */
const fetchDeviceData = (deviceId, startTime, endTime, sortOrder = 'desc', limit, offset) => {
    // Validate sort order input
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  
    // Construct base query and parameters array
    let query = `SELECT id, device_id, data_hum, data_temp, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at 
                 FROM device_data 
                 WHERE device_id = $1`;
    const params = [deviceId];
    let paramIndex = 2;
  
    // Add time range filtering if given
    if (startTime) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startTime);
    }
    if (endTime) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endTime);
    }
  
    // Add order by clause
    query += ` ORDER BY created_at ${order}`;

    if (limit !== undefined) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }
    if (offset !== undefined) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }
  
    try {
      return pool.query(query, params);
    } catch (error) {
      console.error('Error to fetch device data: ', error);
    }
  }

  const totalDeviceData = (deviceId) => {
    return pool.query("SELECT COUNT(*) FROM device_data WHERE device_id=$1", [deviceId]);
}
  
  module.exports = {
    fetchDeviceData,
    totalDeviceData
  };