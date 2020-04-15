const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

var ConfigSchema = new Schema({
  sys_name: String,
  name: String,
  value: String
});











let Config = Mongoose.model('Config', ConfigSchema);
module.exports = Config;
