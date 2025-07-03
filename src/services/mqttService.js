const mqtt = require('mqtt');
const { pool } = require('../configs/db'); // Adjust relative path accordingly
const { v4: uuidv4 } = require('uuid');
const {sendWhatsAppAlert} = require('./twilioService')
require('dotenv').config();


function startMqttService() {
  const clientMqtt = mqtt.connect(process.env.MQTT_BROKER);
  
  
  clientMqtt.on('connect', () => {
    console.log('Connected to MQTT broker');
    clientMqtt.subscribe('vilert/+/data', {qos: 0}, (err) => {
      if (err) {
        console.error('Subscription error:', err);
      }
    });
    // Subscribe to device status topic if needed for status update
    // clientMqtt.subscribe('vilert/+/status');
  });


  clientMqtt.on("message", async (topic, message) => {
    try {
      const msgString = message.toString();

      const topicParts = topic.split("/");
      const deviceId = topicParts[1];

      if (topicParts[2] === "data") {
        const payload = JSON.parse(msgString);
        const { humidity, temperature } = payload;

        // Insert device data into device_data table
        // const id = uuidv4();
        const now = new Date();
        now.setMilliseconds(0); // Remove milisecond
        const timestampStr = now.toISOString().replace(/[:.T]/g, "-").replace(/[Z]/g, "");
        const id = `${deviceId}_${timestampStr}`;

        const insertQuery = "INSERT INTO device_data (id, device_id, data_hum, data_temp) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING";
        await pool.query(insertQuery, [id, deviceId, humidity, temperature]);

        console.log(`Inserted data for device ${deviceId}: Humidity=${humidity}, Temp=${temperature}`);

        // Fetch thresholds for this device
        const thresholdQuery = "SELECT hum_min, hum_max, temp_min, temp_max, status FROM device WHERE id = $1";
        const thresholdResult = await pool.query(thresholdQuery, [deviceId]);
        if (thresholdResult.rowCount === 0) {
          console.warn(`Device ${deviceId} not found in device table for threshold check`);
          return;
        }
        const { hum_min, hum_max, temp_min, temp_max, status } = thresholdResult.rows[0];

        // Update device status to 'online'
        if (status !== "online") {
          const updateStatusQuery = "UPDATE device SET status = $1 WHERE id = $2";
          await pool.query(updateStatusQuery, ["online", deviceId]);
        }

        // Check if humidity or temperature exceed thresholds
        let alertMsg = "";
        if (hum_min !== null && humidity < hum_min) {
          alertMsg += `Humidity (${humidity}) is below minimum (${hum_min}).\n`;
        }
        if (hum_max !== null && humidity > hum_max) {
          alertMsg += `Humidity (${humidity}) exceeds maximum (${hum_max}).\n`;
        }
        if (temp_min !== null && temperature < temp_min) {
          alertMsg += `Temperature (${temperature}) is below minimum (${temp_min}).\n`;
        }
        if (temp_max !== null && temperature > temp_max) {
          alertMsg += `Temperature (${temperature}) exceeds maximum (${temp_max}).\n`;
        }

        if (alertMsg) {
          alertMsg = `Alert for device ${deviceId}:\n` + alertMsg;
          // Send WhatsApp alert
          await sendWhatsAppAlert("+6282119151861", alertMsg);
        }
      }

      // You can add code here to handle status topic if you implement device status updates by LWT or manual publishing
    } catch (error) {
      console.error("Error processing MQTT message:", error);
    }
  });

  clientMqtt.on('error', (error) => {
    console.error('MQTT client error:', error);
  });
}

module.exports = { startMqttService };

