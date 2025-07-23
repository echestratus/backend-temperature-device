const mqtt = require('mqtt');
const { pool } = require('../configs/db'); // Adjust relative path accordingly
const { v4: uuidv4 } = require('uuid');
const {sendWhatsAppAlert} = require('./twilioService');
const {sendEmailAlert} = require('./gmailService');
const {sendTelegramAlert} = require('./telegramService');
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

  const COOLDOWN_PERIOD_MS = 2 * 60 * 1000; // 2 minutes cooldown
  const alertState = {};
  const lastMessageTimes = {};

  // List of phone numbers to send alerts
  const alertRecipients = [
    {
      toEmail: "farhanchn13@gmail.com",
      toNumber: "+6282119151861",
      toTelegramChatId: "1074521468"
    },
    {
      toEmail: "tubagus.dylanr@gmail.com",
      toNumber: "+6281213644007",
      toTelegramChatId: "5372153323"
    }, 
    {
      toEmail: "",
      toNumber: "",
      toTelegramChatId: "6223965001"
    }
  ]; // Add new email(s) or number(s) here

  const OFFLINE_THRESHOLD_MS = 60 * 1000; // 1 minute

  setInterval(async () => {
    const now = Date.now();

    // For each device last seen, check how long ago it sent data
    for (const deviceId in lastMessageTimes) {
      if (now - lastMessageTimes[deviceId] > OFFLINE_THRESHOLD_MS) {
        try {
          // Update device status to offline if it is not offline yet
          const res = await pool.query("SELECT status FROM device WHERE id = $1", [deviceId]);
          const currentStatus = res.rowCount > 0 ? res.rows[0].status : null;

          if (currentStatus && currentStatus !== "offline") {
            await pool.query("UPDATE device SET status = $1 WHERE id = $2", ["offline", deviceId]);
            console.log(`Device ${deviceId} status set to offline due to inactivity.`);
          }

          // Optionally, remove it from tracking? Or keep to check again later
          // delete lastMessageTimes[deviceId];
        } catch (err) {
          console.error(`Failed to update status to offline for device ${deviceId}:`, err);
        }
      }
    }
  }, 30 * 1000); // Check every 30 seconds


  clientMqtt.on("message", async (topic, message) => {
    try {
      const msgString = message.toString();

      const topicParts = topic.split("/");
      const deviceId = topicParts[1];

      if (topicParts[2] === "data") {
        const payload = JSON.parse(msgString);
        const { timestamp, humidity, temperature } = payload;

        //Update lastMessageTimes timestamp every time receive a message for a device
        lastMessageTimes[deviceId] = Date.now();

        // Insert device data into device_data table


        // const id = uuidv4();

        //ID from timestamp
        // const now = new Date();
        // now.setMilliseconds(0); // Remove milisecond
        // const timestampStr = now.toISOString().replace(/[:.T]/g, "-").replace(/[Z]/g, "");

        // Split the date and time
        const [datePart, timePart] = timestamp.split(" ");

        // Extract day, month, and year
        const [day, month, year] = datePart.split("/").map(Number);

        // Extract hours, minutes, and seconds
        const [hours, minutes, seconds] = timePart.split(":").map(Number);

        // Create a UTC Date object
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

        // Convert to ISO string (already UTC)
        const isoString = date.toISOString();

        const timestampStr = isoString.replace(/[:.T]/g, "-").replace(/[Z]/g, "");

        

        const id = `${deviceId}_${timestampStr}`;

        const insertQuery = "INSERT INTO device_data (id, device_id, data_hum, data_temp, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING";
        await pool.query(insertQuery, [id, deviceId, humidity, temperature, isoString]);

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
          const nowAlertMsg = Date.now();
      
          for (const recipient of alertRecipients) {
            const alertKey = `${deviceId}_${recipient.toNumber}`; // Unique cooldown key per device per number
      
            if (!alertState[alertKey] || (nowAlertMsg - alertState[alertKey] > COOLDOWN_PERIOD_MS)) {
              alertState[alertKey] = nowAlertMsg;
              try {
                if (recipient.toNumber) {
                  await sendWhatsAppAlert(recipient.toNumber, `Alert from ${deviceId}: ${alertMsg}`);
                }
                if (recipient.toEmail) {
                  await sendEmailAlert(recipient.toEmail, `Alert from ${deviceId}`, alertMsg);
                }
                if (recipient.toTelegramChatId) {
                  await sendTelegramAlert(recipient.toTelegramChatId, `Alert from ${deviceId}: ${alertMsg}`);
                }
              } catch (err) {
                console.error(`Failed to send alert to ${recipient.toNumber} ${recipient.toEmail} ${recipient.toTelegramChatId}:`, err);
              }
            } else {
              console.log(`Alert to ${recipient.toNumber} for device ${deviceId} suppressed due to cooldown.`);
            }
          }
        } else {
          // Reset alert states if conditions back to normal
          for (const recipient of alertRecipients) {
            const alertKey = `${deviceId}_${recipient.toNumber}`;
            if (alertState[alertKey]) {
              delete alertState[alertKey];
            }
          }
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

