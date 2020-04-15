const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

var LvlSchema = new Schema({
  n: Number,
  exp: Number,
  limit_out: Schema.Types.Decimal128,
  ref_bonus_add: Schema.Types.Decimal128,
  proc_ref: Schema.Types.Decimal128,
  bonus_mnoj: Schema.Types.Decimal128
});

let Lvl = Mongoose.model('Lvl', LvlSchema);

module.exports = Lvl;
