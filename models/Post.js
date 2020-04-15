const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

var PostSchema = new Schema({
  post_id: String,
  like: {
    check: {
      type: Boolean,
      default: false
    },
    money: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: v => Number(v).toFixed(2),
      set: v => Number(v).toFixed(2)
    },
    expr: {
      type: Number,
      default: 0,
      get: v => Number(v),
      set: v => Number(v)
    }
  },
  repost: {
    check: {
      type: Boolean,
      default: false
    },
    money: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: v => Number(v).toFixed(2),
      set: v => Number(v).toFixed(2)
    },
    expr: {
      type: Number,
      default: 0,
      get: v => Number(v),
      set: v => Number(v)
    }
  },
  life_time: Date,
  next_check: {
    type: Date,
    default: Date.now
  }
});

let Post = Mongoose.model('Post', PostSchema);

module.exports = Post;
