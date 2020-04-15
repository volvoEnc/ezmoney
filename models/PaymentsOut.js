const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

let PaymentOutSchema = new Schema({
  amount: {
    type: Schema.Types.Decimal128,
    get: v => Number(v),
    set: v => {
      let am = Number(v).toFixed(2);
      return Number(am);
    }
  },
  vk_id: String,
  date: {
    start: {
      type: Date,
      default: Date.now
    },
    end: Date
  },
  status: {
    type: String,
    default: 'pending'
  },
  paymentRequisites: String,
  np: Number,
  msg: String
});

let PaymentOut = Mongoose.model('PaymentOut', PaymentOutSchema);
module.exports = PaymentOut;
