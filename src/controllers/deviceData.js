const { fetchDeviceData, totalDeviceData } = require('../models/deviceData');
const { response } = require("../helper/response");
const createError = require('http-errors');

const getAllDeviceData = async (req, res, next) => {
  try {
    const deviceId = req.params.id;
    const { startTime, endTime, sort } = req.query;

    const limit = req.query.limit || undefined;
    const page = req.query.page || undefined;
    let offset = 0;
    if (limit !== undefined && page !== undefined) {
      offset = (page - 1) * limit;
    }
    const {rows} = await fetchDeviceData(deviceId, startTime, endTime, sort, limit, offset);

    // const totalData = parseInt((await totalDeviceData(deviceId)).rows[0].count);
    const totalData = rows.length;
    const totalPage = Math.ceil(totalData / limit);
    const pagination = {
      sort,
      sortBy: 'created_at',
      limit: limit ? limit : 'not set',
      page: page ? page : 'not set',
      offset: offset ? offset : 0,
      totalData,
      totalPage
    }
    response(res, 'success', 200, 'Data fetched successfully', rows, pagination);
  } catch (err) {
    console.error(err);
    return next(new createError.NotFound());
  }
};

module.exports = {
    getAllDeviceData,
}
