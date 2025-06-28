const express = require('express');
const bodyParser = require('body-parser');
const {routes:usersRoutes} = require('./src/routes/users');
const {routes:devicesRoutes} = require('./src/routes/devices');
const {routes:deviceDataRoutes} = require('./src/routes/deviceData');
require('dotenv').config();
const cors = require('cors');
const { response } = require('./src/helper/response');
const morgan = require('morgan')
const cookieParser = require('cookie-parser');
const { startMqttService } = require('./src/services/mqttService');
const {sendWhatsAppAlert} = require('./src/services/twilioService')

const app = express();
const PORT = process.env.PORT;
// const IP_ADDR = process.env.IP_ADDR;
const corsOptions = {
    // origin: "*",
    origin: function (origin, callback) {
        callback(null, origin); // Reflect the request origin
      },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
    credentials: true
  }

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cookieParser());

app.use('/test', async (req, res, next) => {
  await sendWhatsAppAlert('+6289690757403', 'Hello World!');
  res.send("HELLO WORLD");
})

app.use('/users', usersRoutes);
app.use('/devices', devicesRoutes);
app.use('/device-data', deviceDataRoutes);

app.use((err, req, res, next) => {
    const errorMessage = err.message;
    const errorStatus = err.statusCode || 500;
    const status = "Failed";
    return response(res, status, errorStatus, errorMessage);
});

app.listen(PORT, () => {
    console.log(`backend running on PORT ${PORT}`);
    startMqttService();
});