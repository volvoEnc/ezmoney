const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

let UserSchema = new Schema({
  invite_code: String,
  ref_code: String,
  context: {
    expr: Number,
    val: String
  },
  status: {
    type: Boolean,
    default: true
  },
  vk_id:  String,
  vk_token: String,
  sicret_key_confirm: {
    key: String,
    tolife: Date
  },
  last_online: {
    type: Date,
    default: Date.now
  },
  start_msg: {
    profile: {type: Boolean, default: false},
    bonus: {type: Boolean, default: false},
    bonus_code: {type: Boolean, default: false},
    stats: {type: Boolean, default: false},
    tasks: {type: Boolean, default: false},
    refs: {type: Boolean, default: false},
    settings: {type: Boolean, default: false},
    add_money: {type: Boolean, default: false},
    out_money: {type: Boolean, default: false},
    games: {type: Boolean, default: false},
    achievements: {type: Boolean, default: false}
  },
  job_access: {
    type: Boolean,
    default: true
  },
  start: {
    type: Boolean,
    default: true
  },
  name: {
    f_name: String,
    l_name: String,
  },
  privelegies: {
    type: String,
    default: 'user'
  },
  money_out: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: v => Number(v),
    set: v => Number(v).toFixed(5)
  },
  add_money_per_minute: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: v => Number(v),
    set: v => Number(v).toFixed(5)
  },
  money_job: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: v => Number(v),
    set: v => Number(v).toFixed(5)
  },
  money_ref: {
    type: Schema.Types.Decimal128,
    default: 0,
    get: v => Number(v)
  },
  lvl: {
    n: {
      type: Number,
      default: 1
    },
    next_lvl_exp: {
      type: Number,
      default: 100
    },
    exp: {
      type: Number,
      default: 0,
      get: v => Number(v),
      set: v => Number(v)
    },
    limit_out: {
      type: Schema.Types.Decimal128,
      default: 0
    },
    ref_bonus_add: {
      type: Schema.Types.Decimal128,
      default: 5
    },
    proc_ref: {
      type: Schema.Types.Decimal128,
      default: 2,
      get: v => Number(v)
    },
    bonus_mnoj: {
      type: Schema.Types.Decimal128,
      default: 1
    }
  },
  ban_status: {
    type: Number,
    default: 0
  },
  report_balls: {
    type: Number,
    default: 0
  },
  accept_rules: {
    type: Boolean,
    default: false
  },
  date_reg: {
      type: Date,
      default: Date.now
  },
  referals: [
    {
      vk_id: String,
      income: {
        type: Schema.Types.Decimal128,
        get: v => Number(v),
        default: 0
      },
      procent: {
        type: Schema.Types.Decimal128,
        get: v => Number(v)
      },
      b_m: Number
    }
  ],
  bonus: {
    b_24: {
      upd: {
        type: Date,
        default: Date.now
      },
      accept: {
        type: Boolean,
        default: true
      },
      add_money: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      add_exp: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      add_money_sum: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      check_hash: String,
      note: {
        type: Boolean,
        default: false
      }
    },
    b_12: {
      upd: {
        type: Date,
        default: Date.now
      },
      accept: {
        type: Boolean,
        default: true
      },
      add_money: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      add_exp: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      add_money_sum: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      check_hash: String,
      note: {
        type: Boolean,
        default: false
      }
    },
    b_1: {
      upd: {
        type: Date,
        default: Date.now
      },
      accept: {
        type: Boolean,
        default: true
      },
      add_money: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      add_exp: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      add_money_sum: {
        type: Schema.Types.Decimal128,
        default: 0,
        get: v => Number(v)
      },
      check_hash: String,
      note: {
        type: Boolean,
        default: false
      }
    },
  },
  subscriptions: {
    news: {type: Boolean, default: true},
    alert: {type: Boolean, default: true},
    ads: {type: Boolean, default: false}
  },
  notifications: [Schema.Types.Mixed],
  likedPost: [
    {
      post_id: Number,
      add_money: {
        type: Schema.Types.Decimal128,
        get: v => Number(v)
      },
      count_check: {
        type: Number,
        default: 0
      },
      last_check: Date,
      future_check: Date,
      checked: {
        type: Boolean,
        default: true
      }
    }
  ],
  repostPost: [
    {
      post_id: Number,
      add_money: {
        type: Schema.Types.Decimal128,
        get: v => Number(v)
      },
      count_check: {
        type: Number,
        default: 0
      },
      last_check: Date,
      future_check: Date,
      checked: {
        type: Boolean,
        default: true
      }
    }
  ],
  payment_history: [
    {
      n_pay: Number,
      sum_pay: Number,
      commision: {
        type: Number,
        default: 0
      },
      instrument: String,
      status: {
        type: String,
        default: "created" // created, process, error, success, wait
      }
    }
  ]

});

UserSchema.virtual('contexts').get(function() {
  let date_now_s = Date.now() / 1000
  date_now_s = Number(date_now_s.toFixed(0))
  if(this.context.expr < date_now_s){
    return undefined;
  }
  else {
    return this.context.val
  }
});
UserSchema.virtual('repost_income').get(function() {
  let sum = 0;
  this.repostPost.forEach(value => {
    let fa = Number(value.add_money).toFixed(2);
    sum += Number(fa);
  });
  return Number(sum).toFixed(2);
});
UserSchema.virtual('liked_income').get(function() {
  let sum = 0;

  this.likedPost.forEach(value => {
    let fa = Number(value.add_money).toFixed(2);
    sum += Number(fa);
  });

  return Number(sum).toFixed(2);
});
UserSchema.virtual('referals_income').get(function() {
  let sum = 0;
  this.referals.forEach(value => {
    let fa = Number(value.income).toFixed(2);
    sum += Number(fa);
  });
  return Number(sum).toFixed(2);
});
UserSchema.virtual('referals_bm').get(function() {
  let sum = 0;
  this.referals.forEach(value => {
    sum += Number(value.b_m);
  });
  return Number(sum).toFixed(2);
});

UserSchema.methods.add_money = function (add_money) {
  return;
};





let User = Mongoose.model('User', UserSchema);
module.exports = User;
