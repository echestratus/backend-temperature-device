const mqtt = require('mqtt');
const { pool } = require('../configs/db'); // Adjust relative path accordingly
const { v4: uuidv4 } = require('uuid');

function startMqttService() {
  const client = mqtt.connect('mqtts://broker.emqx.io:8883/mqtt'); // Your MQTT broker URL

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('vilert/+/data', (err) => {
      if (err) {
        console.error('Subscription error:', err);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const deviceId = topic.split('/')[1]; // Extract deviceId from topic e.g., device/{deviceId}/data
      const { humidity, temperature } = payload;

      // If device exists, insert the data into device_data table
      const id = uuidv4();
      const insertQuery = 'INSERT INTO device_data (id, device_id, data_hum, data_temp) VALUES ($1, $2, $3, $4)';
      await pool.query(insertQuery, [id, deviceId, humidity, temperature]);

      console.log(`Inserted data for device ${deviceId}: Humidity=${humidity}, Temp=${temperature}`);

    } catch (error) {
      if (error.status && error.status === 404) {
        // This is a known error for non-existing device - handle/log accordingly
        console.error('Validation error:', error.message);
      } else {
        console.error('Error processing MQTT message:', error);
      }
    }
  });

  client.on('error', (error) => {
    console.error('MQTT client error:', error);
  });
}

module.exports = { startMqttService };
