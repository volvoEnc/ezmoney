const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

let PaymentSchema = new Schema({
  amount: Schema.Types.Decimal128,
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
  type: String,
  np: Number
});

let Payment = Mongoose.model('Payment', PaymentSchema);
module.exports = Payment;
