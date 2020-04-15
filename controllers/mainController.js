const VkAPI = require('vksdk');
const Faker = require("faker");
const User = require('../models/User');
const PaymentOut = require('../models/PaymentsOut');
const Lvl = require('../models/Lvl');
const MD5 = require("md5");
const BASE64 = require('base-64');
const process = require("process");
const view = require('../views/view');
const {MODE, VK_SERVICE_KEY, VK_GROUP_ID, VK_API_TOKEN, VK_APP_ID, VK_APP_SICRET, VK_ID_ADMIN} = process.env;
const VK = new VkAPI({
   'appId'     : VK_APP_ID,
   'appSecret' : VK_APP_SICRET,
   'language'  : 'ru',
   'secure'    :  true,
   'version'   : '5.103'
});
VK.setToken(VK_API_TOKEN);


exports.upd_code = async function () {
  // let users = await User.find({vk_id: VK_ID_ADMIN}, 'ref_code');
  let users = await User.find();

  users.forEach(async user => {
    user.money_job = 0;
    user.lvl.n = 1;
    user.lvl.next_lvl_exp = 100;
    user.lvl.exp = 0;
    user.lvl.limit_out = 0;
    user.lvl.ref_bonus_add = 5;
    user.lvl.proc_ref = 2;
    user.lvl.bonus_mnoj = 1;

    user.save();
    console.log('ok');
  });
};

exports.get_payments_out_list = async function (cmd) {
  let paym_d = [];
  let arr_data = cmd.replace('/pay_list', ''); //   /pay_list1
  let count = 5;
  let skip = Number(arr_data) * count;
  skip = Number(skip);
  let payments = await PaymentOut.find()
                           .where({status: 'pending'})
                           .sort('-date.start')
                           .skip(skip)
                           .limit(count);
  let count_payments = await PaymentOut.find()
                           .where({status: 'pending'})
                           .countDocuments();
  let skip_r = 0;
  if (skip != 0) {
    skip_r = Number(count_payments) - (Number(skip) + count);
  } else {
    skip_r = Number(count_payments) - count;
  }

  if (payments != undefined) {
    payments.forEach(p => {
      paym_d.push({np: p.np, sum: p.amount, comm: p.paymentRequisites, user: p.vk_id});
    });
  }
  view.outmoney_list(VK_ID_ADMIN, paym_d, skip_r);
};

exports.payments_out_error = async function (cmd) {
  let data_arr = cmd.replace('/pay_error', ''); //   /pay_error1149|Минимальная сумма для вывода на карту 100 рублей.
  data_arr = data_arr.split('|'); // 1149|Минимальная сумма для вывода на карту 100 рублей.
  let id_payment_out = data_arr[0];
  console.log(id_payment_out);
  id_payment_out = Number(id_payment_out);
  let msg = data_arr[1];

  let payment_out = await PaymentOut.findOne().where({np: id_payment_out});
  if (payment_out != undefined) {
    let vk_id = payment_out.vk_id;
    let summ = Number(payment_out.amount);
    let user = await User.findOne().where({vk_id: vk_id});
    if (user != undefined) {
      console.log(summ);
      console.log(user.money_out);
      user.money_out += summ;
      console.log(user.money_out);
      await user.save();
      view.outmoney_error_user(vk_id, id_payment_out, msg);
    }
    payment_out.msg = msg;
    payment_out.date.end = Date.now();
    payment_out.status = 'canceled';
    await payment_out.save();
    view.outmoney_error_admin(VK_ID_ADMIN, id_payment_out);
  }
};
exports.payments_out_complite = async function (cmd) {
  let id_payment_out = cmd.replace('/pay_ok', '');
  id_payment_out = Number(id_payment_out);

  let payment_out = await PaymentOut.findOne().where({np: id_payment_out});
  if (payment_out != undefined) {
    let vk_id = payment_out.vk_id;
    let summ = Number(payment_out.amount);

    payment_out.date.end = Date.now();
    payment_out.status = 'success';
    await payment_out.save();
    view.outmoney_success_user(vk_id, id_payment_out);
    view.outmoney_success_admin(VK_ID_ADMIN, id_payment_out);
  }
};

exports.mailing = async function (cmd) {
  // let users = await User.find({vk_id: VK_ID_ADMIN}, 'vk_id subscriptions');
  let users = await User.find({}, 'vk_id subscriptions')
                        .where({start: false})
                        .where({"subscriptions.news": true})
                        .where({status: true});

  let mailing_text = cmd.replace('|||', '');
  mailing_text = mailing_text.replace(/\n/g, '<br>');

  users.forEach(user => {
    view.mailing(user.vk_id, mailing_text);
  });

};



exports.ref_otch = async (user, summ) => {
  if (user.invite_code != undefined) {
    let r_user = await User.findOne().where({ref_code: user.invite_code});
    if (r_user.report_balls == undefined) {
      r_user.report_balls = 0;
    }
    if (r_user.report_balls < 50 && r_user.vk_token != undefined && r_user.status == true) {
      let ref_prc = r_user.lvl.proc_ref;

      let add_m = summ / 100 * ref_prc;
      add_m = add_m.toFixed(2);
      add_m = Number(add_m);
      let vk_id_r = r_user.vk_id;
      let vk_id = user.vk_id;
      let referals_r = r_user.referals;
      referals_r.forEach(referal => {
        if (referal.vk_id == vk_id) {
          referal.income += add_m;
        }
      });
      r_user.money_job = r_user.money_job + add_m;
      await r_user.save();
      exports.calculation_money(vk_id_r);
      view.success_pay_r(vk_id_r, add_m, ref_prc);
    }
  }
};



exports.getHash = function () {
  return new Promise((resolve, reject) => {
    let random_string = String(process.hrtime.bigint() + "|" + Date.now());
    let hash = MD5(random_string);
    resolve(hash);
  })
}
exports.add_lvl_db = function (data) {
  let n = Number(data.n);
  let exp = Number(data.exp);
  let limit_out = Number(data.limit_out);
  let ref_bonus_add = Number(data.ref_bonus_add);
  let proc_ref = Number(data.proc_ref);
  let bonus_mnoj = Number(data.bonus_mnoj);
  return new Promise((resolve, reject) => {
    Lvl.create({n: n, exp: exp, limit_out: limit_out, ref_bonus_add: ref_bonus_add, proc_ref: proc_ref, bonus_mnoj: bonus_mnoj}, (err, lvl) => {
      if (err) throw err;

      resolve('Все ок');
    });
  });
}

exports.getUser = function (ctx) {
  let vk_id = ctx.message.from_id
  return new Promise((resolve, reject) => {
    User.findOne({vk_id: vk_id}, async (err, user) => {
      if (err) reject('ERR:001:Ошибка при поиске User по vk_id')

      if(user === null){
        let ref_code = await exports.getRefCode();
        console.log(ref_code);
        let new_user = new User({
          vk_id: vk_id,
          ref_code: ref_code
        });
        await new_user.save();
        resolve(new_user);
      }
      else {
        resolve(user)
      }
    })
  })
}

exports.calculation_money = function (vk_id) {
  return new Promise(async function (resolve, reject) {
    let user = await User.findOne({vk_id: vk_id});
    let money_job = user.money_job;
    let add_money_per_minute = money_job / 43200;
    add_money_per_minute = add_money_per_minute.toFixed(5);

    user.add_money_per_minute = add_money_per_minute;
    let res = await user.save();

    resolve();
  });
};
exports.calculation_exp = function (vk_id, add_exp) {
  return new Promise(async function (resolve, reject) {
    let user = await User.findOne({vk_id: vk_id});
    let exp = user.lvl.exp;
    let next_exp = user.lvl.next_lvl_exp;
    let lvl = user.lvl.n;
    let cpl_exp = Number(add_exp) + Number(exp);
    let new_lvl;
    let add_text = '';

    if (cpl_exp < next_exp) {
      user.lvl.exp = cpl_exp;
    } else {
      while (cpl_exp >= next_exp) {
        cpl_exp = cpl_exp - next_exp;
        lvl++;
        new_lvl = await Lvl.findOne({n: lvl});
        next_exp = new_lvl.exp;
      }
      if (lvl >= 3) {
        exports.adb_in_ref(user);
      }
      user.lvl.exp = cpl_exp;
      user.lvl.n = lvl;
      user.lvl.next_lvl_exp = next_exp;
      user.lvl.limit_out = new_lvl.limit_out;
      user.lvl.ref_bonus_add = new_lvl.ref_bonus_add;
      user.lvl.proc_ref = new_lvl.proc_ref;
      user.lvl.bonus_mnoj = new_lvl.bonus_mnoj;
      add_text = `🔱 Получен новый уровень! 🔱 <br><br>`;
    }
    let res = await user.save();

    resolve(add_text);
  });
};

exports.adb_in_ref = async (user) => {
  if (user.invite_code != undefined) {
    let user_inviter = await User.findOne({ref_code: user.invite_code});
    if (user_inviter != undefined) {
      if (user_inviter.status == true && user_inviter.report_balls < 75) {
        let add_m = 0;
        user_inviter.referals.forEach(referal => {
          if (referal.vk_id == user.vk_id && referal.b_m > 0) {
            add_m = Number(referal.b_m);
            user_inviter.money_job += add_m;
            referal.b_m = 0;
            referal.income += add_m;
          }
        });
        await user_inviter.save();
      }
    }
  }
};

exports.getAccepted = function (ctx, user) {
  return new Promise((resolve, reject) => {
    if(user.accept_rules == true){
      resolve(true);
    } else {
      resolve(false);
    }
  })
}
exports.getBonusLink = function (vk_id, hash, type) {
  return new Promise(function(resolve, reject) {
    let ads_host;
    let handler_link = BASE64.encode(`http://ezbot.site/bonus/${type}/${vk_id}/${hash}`); //type/vk_id/hash
    let handler_link_o = `ezbot.site/bonus/${type}/${vk_id}/${hash}`;
    let go_link_pre;
    let go_link;
    if (type == 'b_24') {
      // ads_host = 'http://adf.ly/22412773/banner';
      // go_link_pre = BASE64.encode(`${ads_host}/${handler_link_o}`);
      // go_link = `http://ezbot.site/redirect/${go_link_pre}`;
      ads_host = 'http://sh.st/st/aee9070825741f463153cd5d2266b34f';
      go_link_pre = BASE64.encode(`${ads_host}/${handler_link_o}`);
      go_link = `http://ezbot.site/redirect/${go_link_pre}`;
    }
    else if(type == 'b_12') {
      ads_host = 'http://catcut.net/go.php';
      let handler_num = 3729;
      go_link_pre = BASE64.encode(`${ads_host}?h_i=${handler_num}&h_u=${handler_link}&h_a=${hash}&s=1`);
      go_link = `http://ezbot.site/redirect/${go_link_pre}`;
    }
    else {
      ads_host = 'http://catcut.net/go.php';
      let handler_num = 3729;
      go_link_pre = BASE64.encode(`${ads_host}?h_i=${handler_num}&h_u=${handler_link}&h_a=${hash}&s=1`);
      go_link = `http://ezbot.site/redirect/${go_link_pre}`;
    }

    resolve(go_link);
  });
}

exports.getRefCode = function () {
  return new Promise(async (resolve, reject) => {
    let hash = await exports.getHash();
    let code = hash.substr(1, 10);
    code = code.toUpperCase();
    resolve(code);
  });
};

exports.setContext = function (ctx, new_context, expr) {
  let vk_id = ctx.message.from_id
  let exp = expr || (15 * 60)
  let date_now_s = Date.now() / 1000
  date_now_s = Number(date_now_s.toFixed(0))
  let newdns = date_now_s + exp
  return new Promise((resolve, reject) => {
    User.updateOne({vk_id: vk_id}, {'context.val': new_context, 'context.expr': newdns}, (err, res) => {
      if (err) reject('ERR:004:Ошибка при обновлении контекста сообщения в User по vk_id')

      resolve(res);
    })
  })
}
exports.deleteContext = function (ctx) {
  let vk_id = ctx.message.from_id;
  return new Promise((resolve, reject) => {
    User.updateOne({vk_id: vk_id}, {'context.val': undefined, 'context.expr': 0}, (err, res) => {
      if (err) reject('ERR:004:Ошибка при удалении контекста сообщения в User по vk_id');

      resolve(res);
    })
  })
}

exports.getCommand = function (ctx) {
  let vk_id = ctx.message.from_id;
  return new Promise((resolve, reject) => {
    let command_bot;
    if(ctx.message.payload != null) {
      try {
        let jsn = JSON.parse(ctx.message.payload);
        command_bot = jsn.command;
      } catch (e) {
        reject('ERR:003:Не удалось разобрать сообщение');
      }
    }
    else {
      command_bot = ctx.message.text;
    }
    let cmd_obj = {
      cmd: command_bot.toLowerCase(),
      org_cmd: command_bot
    }
    resolve(cmd_obj);
  })
}
