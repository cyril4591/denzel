'use  strict';
const mongodbConfig= require('./config.json').MONGODB;
const actor= require('./actorsID.json');
module.exports.mongodbConfig = mongodbConfig;
module.exports.actorsID=actor;

