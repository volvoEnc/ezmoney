const Moment = require('moment');
const VkAPI = require('vksdk');
const Faker = require("faker");
const VkBot = require('../lib/vkbotLib');
const Queue = require('../lib/queue');
const Lvl = require('../models/Lvl');
const User = require('../models/User');
const Payment = require('../models/Payment');
const PaymentOut = require('../models/PaymentsOut');
const Post = require('../models/Post');
const Stock = require('../models/Stock');
const MD5 = require("md5");
const random = require('random');
const mainController = require('../controllers/mainController');
const vkapiController = require('../controllers/vkapiController');
const notificationsController = require('../controllers/notificationsController');

const view = require('../views/view');
const {MODE, VK_SERVICE_KEY, VK_GROUP_ID, VK_API_TOKEN, VK_APP_ID, VK_APP_SICRET, R_PASS_DEMO1, R_PASS_DEMO2, R_PASS1, R_PASS2, VK_ID_ADMIN} = process.env;
const Bot = new VkBot();
const VK = new VkAPI({
   'appId'     : VK_APP_ID,
   'appSecret' : VK_APP_SICRET,
   'language'  : 'ru',
   'secure'    :  true,
   'version'   : '5.103'
});
VK.setToken(VK_API_TOKEN);


const actia_1 = false;
const actia_2 = false;
const actia_3 = false;
const actia_4 = false;

exports.job_access_true = async function () {
  let users = await User.find({}, 'job_access')
                        .where('vk_token').exists(true)
                        .where({status: true});

  users.forEach(async user => {
    user.job_access = true;
    await user.save();
    console.log('Работа разрешена');
  });
};
exports.noti__task_activate = async function () {
  //let users = await User.find({vk_id: VK_ID_ADMIN}, 'vk_id start_msg');
  let users = await User.find({}, 'vk_id start_msg')
                        .where('vk_token').exists(true)
                        .where({status: true});

  users.forEach(async user => {
    if (user.start_msg != undefined){
      user.start_msg = undefined;
      await user.save();
    }
    view.noti__task_activate(user.vk_id);
  });
};



exports.loginUser = function (ctx) {
  let vk_id = ctx.message.from_id
  return new Promise((resolve, reject) => {
    User.findOne({vk_id: vk_id}, 'report_balls accept_rules start', (err, user) => {
      if (err) reject('ERR:001:Ошибка при поиске User по vk_id');

      if(user.start == true){
        User.updateOne({vk_id: vk_id}, {'start': false}, (err, res) => {
          if (err) reject('ERR:006:Ошибка при обновлении статуса старта в User по vk_id');
        });
        //ctx.reply('Добро пожаловать!') // view.start()
        resolve('Добро пожаловать!<br><br>');
      }
      else if(user.report_balls >= 75) {
        //view.ban('ball')
        let rep_text = 'Ваш аккаунт заблокирован, т.к. у Вас превышен лимит штрафных баллов!';
        rep_text += `Штрафных баллов на аккаунте: ${user.report_balls} шт.<br><br>`;
        resolve(rep_text);
      }
      else {
        resolve();
      }
    });
  });
}

exports.setAcceptedRules = function (ctx, user) {
  let vk_id = user.vk_id
  return new Promise((resolve, reject) => {
    User.updateOne({vk_id: vk_id}, {'accept_rules': true}, (err, res) => {
      if (err) reject('ERR:004:Ошибка при обновлении согласия с правилами в User по vk_id');

      mainController.deleteContext(ctx).then(res => {
        let r_text = "✅ Вы согласились с правилами сервиса.<br><br>";
        r_text += "⏳ Перехожу в Ваш профиль...";

        Queue.setTask(vk_id, 'message.send', {message: r_text});
        //ctx.reply(r_text);
        resolve(res);
        setTimeout(() => {
          exports.getProfile(ctx, user);
        }, 2000);
      })
    })
  })
}

exports.setConfirmUser = function (ctx, user) {
  let vk_id = user.vk_id
  return new Promise((resolve, reject) => {

    User.findOne({vk_id: vk_id}, 'vk_token sicret_key_confirm', (err, res) => {
      if (err) reject('ERR:010:Ошибка при получении токена в User по vk_id');

      if(res.vk_token === undefined && (res.sicret_key_confirm.tolife < Date.now() || res.sicret_key_confirm.tolife === undefined)) {
        mainController.getHash().then(hash => {
          let sicret_key_confirm = {
            key: hash,
            tolife: Date.now() + (1000 * 60 * 15) // 15 мин
          };
          let state = vk_id + "|" + sicret_key_confirm.key;

          User.updateOne({vk_id: vk_id}, {'sicret_key_confirm': sicret_key_confirm}, (err, res) => {
            if (err) reject('ERR:007:Ошибка при обновлении ключа подтверждения при формировании ссылки в User по vk_id');

            let link = `https://oauth.vk.com/authorize?`;
                link += `client_id=7180672&`;
                link += `redirect_uri=https://ezbot.site/confirm&`;
                link += `display=page&`;
                link += `response_type=code&`;
                link += `scope=‭+328704&`;
                link += `state=${state}`;

            vkapiController.getVKCClink(link).then(short_link => view.confirmUser(ctx, short_link, 'success'))

          });
        });
      } else {
        let next_req = Moment(Date.now()).to(res.sicret_key_confirm.tolife);
        view.confirmUser(ctx, 'null', next_req);
      }
    });
  })
}

exports.addTokenUser = function (token, data) {
  let vk_token = token;
  let cfd_data = data;
  try {
    cfd_data = cfd_data.split('|');
  } catch (e) {
    view.custom_error(vk_id, 'Ошибка при подтверждении акканута. Скоро все исправим ...');
    view.custom_error(VK_ID_ADMIN, `Пользователь https://vk.com/id${vk_id} не смог подтвердить акканут.`);
  }

  let vk_id = cfd_data[0];
  let sicret_key_confirm = cfd_data[1];

  return new Promise((resolve, reject) => {

    User.findOne({vk_id: vk_id}, 'sicret_key_confirm', (err, user) => {
      if (err) reject('ERR:008:Ошибка при получении ключа подтверждения после формировании ссылки в User по vk_id');

      if(user.sicret_key_confirm.key == sicret_key_confirm) {

        VK.requestServerToken(async function (res) {
          user.vk_token = res.access_token;
          user.job_access = true;
          user.sicret_key_confirm = undefined;
          await user.save();

          view.successConfirmUser(vk_id);
          resolve();
        }, vk_token, 'https://ezbot.site/confirm');
      }
    });
  });
}

exports.noAcceptedRules = function (ctx, user) {
  let vk_id = user.vk_id;
  return new Promise((resolve, reject) => {
    let r_text = "❗ Для продолжентя работы с нашим сервисом, необходимо согласиться с правилами!<br>";
    r_text += "Повторите запрос, введя команду Начать.";
    mainController.deleteContext(ctx).then(res => {
      Queue.setTask(vk_id, 'message.send', {message: r_text});
      resolve();
    })
  })
}

exports.ping = function (ctx, user, d_tm) {
  let vk_id = user.vk_id;
  let diff = Date.now() - d_tm;
  view.ping(vk_id, diff);
}

exports.payment_add = async function () {
  let users = await User.find({status: true, accept_rules: true, add_money_per_minute: {$gt: 0}, report_balls: {$lt: 50}}, 'add_money_per_minute money_out');

  users.forEach(async user => {
    user.money_out = user.money_out + (user.add_money_per_minute * 5);
    await user.save();
  });
};








exports.addInviteCode = async (ctx, user, code) => {
  let vk_id = user.vk_id;
  let u_code = code.toUpperCase();
  if (user.invite_code != undefined) {
    view.refCode__error(vk_id, 'overflow_code');
    return;
  }
  else if (u_code == user.ref_code) {
    view.refCode__error(vk_id, 'overflow_user');
    return;
  }
  else if (u_code.length > 10 || u_code.length < 10) {
    view.refCode__error(vk_id, 'bad_code');
    return;
  }
  let inv_user = await User.findOne().where({ref_code: u_code});

  if (inv_user == undefined) {
    view.refCode__error(vk_id, 'bad_code');
    return;
  }

  let referals = inv_user.referals;
  let error = false;

  referals.forEach(referal => {
    if (referal.vk_id == vk_id) {
      error = true;
    }
  });

  if (error == false) {
    user.money_job += 5;
    user.invite_code = u_code;
    await user.save();
    await mainController.calculation_money(vk_id);

    let new_ref = {
      vk_id: vk_id,
      procent: inv_user.lvl.proc_ref,
      b_m: inv_user.lvl.ref_bonus_add
    };

    inv_user.referals.push(new_ref);
    let vk_id_inv = inv_user.vk_id;
    inv_user.save();

    view.refCode__success(vk_id, 5);
    view.refCode__success_inv(vk_id_inv, inv_user.lvl.ref_bonus_add, vk_id);
    await mainController.deleteContext(ctx);
  } else {
    view.refCode__error(vk_id, 'overflow_code');
  }
};

exports.goInviteCode = async (ctx, user) => {
  let start = false;
  if (user.start_msg.bonus_code == false || user.start_msg.bonus_code == undefined) {
    start = true;
    user.start_msg.bonus_code = true;
    await user.save();
  }
  let vk_id = user.vk_id;
  await mainController.setContext(ctx, 'ref_code');
  view.refCode__go(vk_id, start);
};
exports.referals = async (ctx, user) => {
  let vk_id = user.vk_id;
  let code = user.ref_code;
  let start = false;
  let data = {
    count: user.referals.length,
    income: user.referals_income,
    income_bm: user.referals_bm,
    code: code,
    add_b_r: user.lvl.ref_bonus_add,
    add_p_r: user.lvl.proc_ref
  };

  if (user.start_msg.refs == false || user.start_msg.refs == undefined) {
    start = true;
    user.start_msg.refs = true;
    await user.save();
  }

  view.referals(vk_id, data, start);
};




















exports.getTasks = async function (ctx, user) {
  let start = false;
  if (user.start_msg.tasks == false || user.start_msg.tasks == undefined) {
    start = true;
    user.start_msg.tasks = true;
    await user.save();
  }
  let vk_id = user.vk_id;
  let inline_kb = false;
  if(ctx.client_info.inline_keyboard == true){
    inline_kb = true;
  }
  await view.tasks(vk_id, inline_kb, start);
}
exports.repost_task = async function (ctx, user) {
  let vk_id = user.vk_id;
  let user_posts = user.repostPost;
  let posts = await Post.find()
                        .where({'repost.check': true})
                        .where('life_time').gt(Date.now())
                        .sort('-post_id')
                        .limit(5);

  let posts_link = '';
  posts.forEach(post => {
    let incl = false;
    user_posts.forEach(user_post => {
      if (post.post_id == user_post.post_id) {
        incl = true;
      }
    });
    if (incl == false) {
      posts_link += `👉🏻 https://vk.com/ezmoneybots?w=wall-187786454_${post.post_id} <br>`;
    }
  });
  view.repost_task(vk_id, posts_link);
};
exports.like_task = async function (ctx, user) {
  let vk_id = user.vk_id;
  let user_posts = user.likedPost;
  let posts = await Post.find()
                        .where({'like.check': true})
                        .where('life_time').gt(Date.now())
                        .sort('-post_id')
                        .limit(5);

  let posts_link = '';
  posts.forEach(post => {
    let incl = false;
    user_posts.forEach(user_post => {
      if (post.post_id == user_post.post_id) {
        incl = true;
      }
    });
    if (incl == false) {
      posts_link += `👉🏻 https://vk.com/ezmoneybots?w=wall-187786454_${post.post_id} <br>`;
    }
  });
  view.like_task(vk_id, posts_link);
};
exports.noTasks = async function (ctx, user) {
  let vk_id = user.vk_id;
  await view.non_task(vk_id);
}

exports.checkTasks = async function () {
  let post = await Post.findOne()
                       .where('next_check').lt(Date.now())
                       .where('life_time').gt(Date.now());
  if (post != null) {
    post.next_check = Date.now() + (1000 * 60 * 60); //60 M
    //post.next_check = Date.now();
    let post_id = post.post_id;
    await post.save();
    let users = await User.find()
                          .where('vk_token').exists(true)
                          .where({status: true})
                          .where({job_access: true})
                          .where('report_balls').lt(50);
    // let users = await User.find({vk_id: VK_ID_ADMIN});
    // let users = await User.find({vk_id: 518724496});

    users.forEach(user => {
      let check_arr;
      let check_product;
      let prd_check;
      let vk_id = user.vk_id;
      let vk_token = user.vk_token;
      if (post.like.check == true) {
        check_arr = user.likedPost;
        check_product = 'like';
        prd_check = 'liked';
      }
      else if(post.repost.check == true) {
        check_arr = user.repostPost;
        check_product = 'repost';
        prd_check = 'copied';
      }
      let check_post = true;
      check_arr.forEach(value => {
        if (value.post_id == post.post_id) {
          if (value.future_check < Date.now() && value.checked == true) {
            exports.handlerCheckUsersTasks(vk_id, vk_token, post.post_id, 'accept', check_product, user, null, value);
            check_post = false;
          }
          check_post = false;
        }
      });
      if (check_post == true) {
        let date = {
          add_money: post[check_product].money,
          add_expr: post[check_product].expr
        };
        //console.log(date);
        exports.handlerCheckUsersTasks(vk_id, vk_token, post.post_id, 'check', check_product, user, date);
      }
    });
  }
}


/**
  @param {string} type_check - like or repost
  @param {string} type_operation - check or accept
*/
exports.handlerCheckUsersTasks = async function (vk_id, vk_token, post_id, type_operation, type_check, user, date = null, post) {
  VK.setToken(vk_token);
  VK.request('likes.isLiked', {'item_id': post_id, 'user_id': vk_id, 'owner_id': `-${VK_GROUP_ID}`, 'type': 'post'}, async function(res) {
    //console.log(res);
    if (res.error != undefined && user.job_access != undefined) {

      // code 30 - приватный профиль

      if (res.error.error_code == 30) {
        view.error_task(vk_id);
      }

      // code 28 - токен не действителен

      else if(res.error.error_code == 28) {
        user.vk_token = undefined;
        await user.save();
        view.error_token(vk_id);
      }
      else {
        user.vk_token = undefined;
        await user.save();
        if (res.error.error_code != 15) {
          view.error_task_custom(vk_id, res.error.error_code);
        }
      }

      if (user.job_access == true) {
        user.job_access = false;
        await user.save();
      }

    } else {
      let check = false;
      let response = res.response;
      //console.log(response);
      if (type_check == 'like' && response.liked == 1) check = true;
      else if (type_check == 'repost' && response.copied == 1) check = true;

      if (type_operation == 'check' && check == true) {
        //console.log('Выполняем начисление на баланс!');
        let push_obj = {
          post_id: post_id,
          add_money: date.add_money,
          future_check: Date.now() + (1000 * 60 * 10)
        }
        //начислить деньги и опыт
        if (type_check == 'like') user.likedPost.push(push_obj);
        else if (type_check == 'repost') user.repostPost.push(push_obj);
        let am = Number(date.add_money);
        user.money_job = user.money_job + am;
        user.last_online = Date.now();
        await user.save();

        await mainController.calculation_money(vk_id);
        let add_text = await mainController.calculation_exp(vk_id, date.add_expr);

        view.success_task(vk_id, type_check, date.add_money, date.add_expr, add_text);
      }
      else if (type_operation == 'accept') {
        let next_check;

        if (post.count_check == 0 || post.count_check == undefined) next_check = Date.now() + (1000 * 60 * 60 * 4);
        else if (post.count_check == 1) next_check = Date.now() + (1000 * 60 * 60 * 12);
        else if (post.count_check == 2) next_check = Date.now() + (1000 * 60 * 60 * 24);
        else if (post.count_check == 3) next_check = Date.now() + (1000 * 60 * 60 * 24 * 2);
        else if (post.count_check == 4) next_check = Date.now() + (1000 * 60 * 60 * 24 * 3);
        else if (post.count_check == 5) next_check = Date.now() + (1000 * 60 * 60 * 24 * 7);

        post.count_check += 1;
        post.future_check = next_check;
        if (post.count_check > 5) {
          post.checked = false;
        }

        if (check == false) {
          let add_rep = 1;
          if (type_check == 'repost') add_rep = 10;
          post.checked = false;
          user.report_balls += add_rep;
          //await post.save();
          await user.save();
          view.report_task(vk_id, type_check, add_rep);
        }
      }
    }
    VK.setToken(VK_API_TOKEN);
  });
}














exports.addBonusInUser = async function (ctx, user, type) {
  const add_money_const = {
    b_24: {
      money: { max: 1, min: 0.1 },
      exp: { max: 3, min: 1 }
    },
    b_12: {
      money: { max: 0.25, min: 0.05 },
      exp: { max: 2, min: 1 }
    },
    b_1: {
      money: { max: 0.05, min: 0.01 },
      exp: { max: 1, min: 0 }
    }
  }
  const vk_id = user.vk_id;


  if(type == 'addbonus-24h'){
    fn_d(vk_id, 'b_24', 24);
  }
  else if(type == 'addbonus-12h') {
    fn_d(vk_id, 'b_12', 12);
  }
  else if(type == 'addbonus-1h') {
    fn_d(vk_id, 'b_1', 1);
  }

  function fn_d(vk_id, type, h){
    User.findOne({vk_id: vk_id}, 'bonus', (err, res) => {
      if (err) throw('ERR:012:Ошибка получения информации о бонусе');

      if (res.bonus[type].upd > Date.now()){
        let nxt_date = Moment(Date.now()).to(res.bonus[type].upd);
        view.error_bonus(vk_id, type, nxt_date);
      } else {
        mainController.getHash().then(hash => {
          let new_data = Date.now() + (1000 * 60 * 60 * h);
          let add_m = random.float(add_money_const[type].money.min, add_money_const[type].money.max);
          let add_exp = random.int(add_money_const[type].exp.min, add_money_const[type].exp.max);

          res.bonus[type].add_money = add_m.toFixed(3);
          res.bonus[type].add_exp = add_exp;
          res.bonus[type].check_hash = hash;
          res.bonus[type].note = true;
          res.bonus[type].upd = new_data;


          res.save(err => {
            if (err) throw('ERR:012:Ошибка обновления бонуса');
            mainController.getBonusLink(vk_id, hash, type)
                          .then(link => Queue.setTask(vk_id, 'utils.getShortLink', {link: link, event_type: 'get_bonus_link'}));
          });
        });
      }
    });
  }
}

exports.checkHashLink = function (vk_id, hash, type) {
  return new Promise(async (resolve, reject) => {
    User.findOne({vk_id: vk_id}, (err, res) => {
      if (err) throw err;

      let res_hash = res.bonus[type].check_hash;
      let mnoj = res.lvl.bonus_mnoj;
      let add_money = Number(res.bonus[type].add_money);
      let add_expr = Number(res.bonus[type].add_exp);
      add_money = add_money * mnoj;
      add_money = add_money.toFixed();
      if (res_hash === undefined){
        resolve(false);
      }
      else if (res_hash != hash){
        resolve(false);
      }
      else {
        let add_money = Number(res.bonus[type].add_money);
        add_money = add_money.toFixed(5);
        add_money = Number(add_money);
        res.money_job += add_money;
        res.last_online = Date.now();
        res.bonus[type].add_money_sum += add_money;
        res.bonus[type].add_money = 0;
        res.bonus[type].add_exp = 0;
        res.bonus[type].check_hash = undefined;
        num_rep = random.int(1, 5);

        res.save(err => {
          if (err) throw err;

          mainController.calculation_money(vk_id);
          mainController.calculation_exp(vk_id, add_expr).then(add_text => {
            view.success_bonus(vk_id, type, add_money, add_expr, num_rep, add_text);
          });
        });
        resolve(res_hash);
      }
    });
  });
};












exports.outmoney = async function (ctx, user) {
  let vk_id = user.vk_id;

  let user_lvl = user.lvl.n;
  let money_out_ss = Number(user.money_out);
  if (user_lvl < 3) {
    if (money_out_ss < 1) {
      view.outmoney__error(vk_id, 'min');
    } else {
      view.outmoney__error(vk_id, 'lvl');
    }
  } else {

    // let payments_out_per_day = await PaymentOut.find()
    //                                      .where({vk_id: vk_id})
    //                                      .where('date.start').gt(Date.now() - (1000 * 60));
    let payments_out_per_day = await PaymentOut.find()
                                         .where({vk_id: vk_id})
                                         .where('date.start').gt(Date.now() - (1000 * 60 * 60 * 24));

    let user_limit_per_day = user.lvl.limit_out;
    let ost = user_limit_per_day;

    if (payments_out_per_day != undefined) {
      //console.log(payments_out_per_day);
      payments_out_per_day.forEach(p => {
        ost -= p.amount;
      });
      ost = Math.floor(ost);
    }

    if (ost < 1) {
      view.outmoney__error(vk_id, 'limit');
    } else {
      await mainController.setContext(ctx, 'pay_out__money');
      view.outmoney__continius(vk_id, ost);
    }
  }
}
exports.createPaymentOut = async function (ctx, user, out_money) {
  let vk_id = user.vk_id;

  let payments_out_per_day = await PaymentOut.find()
                                       .where({vk_id: vk_id})
                                       .where('date.start').gt(Date.now() - (1000 * 60 * 60 * 24));
  // let payments_out_per_day = await PaymentOut.find()
  //                                      .where({vk_id: vk_id})
  //                                      .where('date.start').gt(Date.now() - (1000 * 60));

  let user_limit_per_day = user.lvl.limit_out;
  let ost = user_limit_per_day;

  if (payments_out_per_day != undefined) {
    payments_out_per_day.forEach(p => {
      ost -= p.amount;
    });
    ost = Math.floor(ost);
  }

  if (out_money <= ost) {
    if (out_money <= user.money_out) {
      await mainController.setContext(ctx, `pay_out__requisites${out_money}`);
      view.outmoney__requisites(vk_id);
      user.money_out -= Number(out_money);
      await user.save();
    } else {
      view.outmoney__error(vk_id, 'nomoney');
    }
  } else {
    view.outmoney__error(vk_id, 'max');
  }
}
exports.createPaymentOut__final = async function (ctx, user, requisites, out_money) {
  let vk_id = user.vk_id;

  let comm = requisites.replace(/\n/g, ' ');
  comm = comm.replace(/['"`]/g, '');

  let count_payments = await PaymentOut.estimatedDocumentCount();
  let random_salt = random.int(100, 999);
  let pre_np = count_payments + '' + random_salt;
  let np = Number(pre_np);

  let pay_out = new PaymentOut({
    amount: out_money,
    vk_id: vk_id,
    paymentRequisites: comm,
    np: np
  });
  await pay_out.save();
  // let ulvl = user.lvl.n;
  // let new_lvl = await Lvl.findOne({n: ulvl});
  // user.lvl.limit_out = Number(new_lvl.limit_out);
  // await user.save();

  let date = {
    np: np,
    sum: out_money,
    comm: requisites,
    user: vk_id
  };

  mainController.deleteContext(ctx).then(() => {
    view.outmoney__finish(vk_id, 'user', date);
  });
  view.outmoney__finish(VK_ID_ADMIN, 'admin', date);
}








exports.getpayments = async function (ctx, user) {
  let start = false;
  if (user.start_msg.add_money == false || user.start_msg.add_money == undefined) {
    start = true;
    user.start_msg.add_money = true;
    await user.save();
  }
  let vk_id = user.vk_id;
  let stocks = await Stock.getActive();
  view.payments(vk_id, start, stocks);
}
exports.sumpayments = async function (ctx, user) {
  let vk_id = user.vk_id;
  mainController.setContext(ctx, 'pay');
  view.go_sum(vk_id);
}

exports.view_payment_link = async function (vk_id, link, date) {
  let p_date = JSON.parse(date);
  let np = p_date.np;
  view.payment_link(vk_id, link, np);
}

exports.errorPaymentRobokassa = function (data) {
  return new Promise(async (resolve, reject) => {
    if (data['InvId'] != undefined) {
      let inv = data['InvId'];
      let pay = await Payment.findOne({np: inv, 'status': 'pending'});
      if (pay != undefined) {
        pay.status = 'error';
        pay.date.end = Date.now();
        pay.save();
        view.error_pay(pay.vk_id);
      }
    }
    resolve();
  });
};
exports.handlerPaymentRobokassa = function (data) {
  return new Promise(async (resolve, reject) => {
    //console.log(data);
    let out_sum = Number(data['OutSum']);
    out_sum = out_sum.toFixed();
    let invid = data['InvId'];
    let sign = data['SignatureValue'];
    let istest = data['IsTest'];
    let pass2 = R_PASS2;
    if (istest == 1) pass2 = R_PASS_DEMO2;

    let pay = await Payment.findOne({np: invid, status: 'pending'});
    let my_out_sum = pay.amount;
    if (istest != 1) {
      my_out_sum = Number(my_out_sum);
      my_out_sum = my_out_sum.toFixed(6);
    }
    let vk_id = pay.vk_id;
    let mysign = MD5(`${my_out_sum}:${invid}:${pass2}:Shp_vkid=${vk_id}`);
    mysign = mysign.toUpperCase();
    if (sign == mysign){
      pay.date.end = Date.now();
      pay.status = 'success';
      await pay.save();

      let user = await User.findOne({vk_id: vk_id});

      let add_money = Number(my_out_sum);
      let add_expr = add_money * 5;
      add_expr = add_expr.toFixed();
      if (actia_1 == true) {
        if (add_money >= 100 && add_money < 250) {
          let bbb = add_money / 100 * 25;
          add_money = add_money + bbb;
        }
        else if (add_money >= 250 && add_money < 500) {
          let bbb = add_money / 100 * 50;
          add_money = add_money + bbb;
        }
        else if (add_money >= 500) {
          let bbb = add_money / 100 * 75;
          add_money = add_money + bbb;
        }
      }

      if (actia_2 == true) {
        if (add_money >= 50) {
          let bbb = 50;
          add_money = add_money + bbb;
        }
      }

      if (actia_3 == true) {
        add_money = add_money * 2;
      }
      if (actia_4 == true) {
        add_money = add_money * 2;
        add_expr = add_expr * 1.5;
      }

      user.money_job = user.money_job + add_money;

      await user.save();
      mainController.calculation_money(vk_id);
      mainController.ref_otch(user, add_money);
      mainController.calculation_exp(vk_id, add_expr).then(add_text => {
        if (istest == 1) add_text += `Тестовая оплата<br>`;
        view.success_pay(vk_id, add_money, add_expr, add_text);
        view.success_pay_admin(VK_ID_ADMIN, vk_id, add_money);
      });
    } else {
      pay.date.end = Date.now();
      pay.status = 'error';
      await pay.save();
    }

    resolve(invid);
  });
}

exports.createPaymentRobokassa = async function (ctx, user, add_money) {
  let istest = 0; //Тестовый режим
  let pass1 = R_PASS1;
  if (istest == 1) pass1 = R_PASS_DEMO1;

  let merchantlogin = 'EZMONEY';// id магазина !
  let culture = 'ru';
  let encoding = 'utf-8';
  let vk_id = user.vk_id;

  let count_payments = await Payment.estimatedDocumentCount();
  let random_salt = random.int(100, 999);
  let pre_invid = count_payments + '' + random_salt;

  let invid = Number(pre_invid); // номер заказа
  let description = 'Пополнение баланса на проекте EZMONEY.'; //max 100 char

  if (add_money > 10000) add_money = 10000;
  else if (add_money < 1) add_money = 1;
  else add_money = Number(add_money).toFixed();

  let outsum = add_money; // стоимость !

  let signaturevalue = MD5(`${merchantlogin}:${outsum}:${invid}:${pass1}:Shp_vkid=${vk_id}`); //!

  let link =  `https://auth.robokassa.ru/Merchant/Index.aspx?`;
      link += `MerchantLogin=${merchantlogin}&`;
      link += `OutSum=${outsum}&`;
      link += `Description=${description}&`;
      link += `Encoding=${encoding}&`;
      link += `Culture=${culture}&`;
      link += `InvId=${invid}&`;
      link += `isTest=${istest}&`;
      link += `Shp_vkid=${vk_id}&`;
      link += `SignatureValue=${signaturevalue}`;

  await mainController.deleteContext(ctx);

  let payment_data = {
    vk_id: vk_id,
    amount: add_money,
    type: 'robokassa',
    status: 'pending',
    np: invid
  }
  let pay = new Payment(payment_data);
  await pay.save();
  let date_r = JSON.stringify({np: invid});
  Queue.setTask(vk_id, 'utils.getShortLink', {link: link, event_type: 'get_payment_link', date: date_r});
}

















exports.view_link = async function (vk_id, short_url) {
  const user = await User.findOne({vk_id: vk_id});

  let access_bonus = {
    b_24: {
      access: false,
      next_access: Moment(Date.now()).to(user.bonus.b_24.upd)
    },
    b_12: {
      access: false,
      next_access: Moment(Date.now()).to(user.bonus.b_12.upd)
    },
    b_1: {
      access: false,
      next_access: Moment(Date.now()).to(user.bonus.b_1.upd)
    },
  }
  if (user.bonus.b_24.accept == true && user.bonus.b_24.upd <= Date.now()) access_bonus.b_24.access = true;
  if (user.bonus.b_12.accept == true && user.bonus.b_12.upd <= Date.now()) access_bonus.b_12.access = true;
  if (user.bonus.b_1.accept == true && user.bonus.b_1.upd <= Date.now()) access_bonus.b_1.access = true;

  view.go_bonus(vk_id, short_url, access_bonus);
}


exports.getBonus = async function (ctx, user) {
  let vk_id = user.vk_id;

  let start = false;
  if (user.start_msg.bonus == false || user.start_msg.bonus == undefined) {
    start = true;
    user.start_msg.bonus = true;
    await user.save();
  }

  let access_bonus = {
    b_24: {
      access: false,
      next_access: Moment(Date.now()).to(user.bonus.b_24.upd)
    },
    b_12: {
      access: false,
      next_access: Moment(Date.now()).to(user.bonus.b_12.upd)
    },
    b_1: {
      access: false,
      next_access: Moment(Date.now()).to(user.bonus.b_1.upd)
    },
    b_code: { access: false },
  }
  if (user.bonus.b_24.accept == true && user.bonus.b_24.upd <= Date.now()) access_bonus.b_24.access = true;
  if (user.bonus.b_12.accept == true && user.bonus.b_12.upd <= Date.now()) access_bonus.b_12.access = true;
  if (user.bonus.b_1.accept == true && user.bonus.b_1.upd <= Date.now()) access_bonus.b_1.access = true;
  if (user.invite_code == undefined) access_bonus.b_code.access = true;

  await view.bonuses(vk_id, access_bonus, start);
}

exports.getStatsUser = function (ctx, user) {
  let vk_id = user.vk_id
  return new Promise((resolve, reject) => {
    let all_bonuses = user.bonus.b_24.add_money_sum + user.bonus.b_12.add_money_sum + user.bonus.b_1.add_money_sum;
    let am__pm = user.add_money_per_minute * 5;
    let date = {
      bonus: {
        b_24: user.bonus.b_24.add_money_sum.toFixed(2),
        b_12: user.bonus.b_12.add_money_sum.toFixed(2),
        b_1:  user.bonus.b_1.add_money_sum.toFixed(2),
        b_all: all_bonuses.toFixed(2)
      },
      income: {
        h: (am__pm * 60).toFixed(3),
        d: (am__pm * 60 * 24).toFixed(2),
        m: (am__pm * 60 * 24 * 30).toFixed(2),
      },
      tasks: {
        liked_income: user.liked_income,
        liked_count: user.likedPost.length,
        repost_income: user.repost_income,
        repost_count: user.repostPost.length,
        job: 0
      },
      report_balls: user.report_balls,
      time_in_prj: Moment(user.date_reg).fromNow(true),
      date_reg: Moment(user.date_reg).format("DD.MM.YYYY")
    };
    view.stats(vk_id, date);
    resolve();
  })
}


exports.settings = async function (ctx, user) {
  let vk_id = user.vk_id;
  let inline_kb = false;
  if(ctx.client_info.inline_keyboard == true){
    inline_kb = true;
  }
  await view.userSettings(vk_id, inline_kb)
}

exports.notifications = async function (ctx, user, d_text = false) {
  let vk_id = user.vk_id;
  let inline_kb = false;
  if(ctx.client_info.inline_keyboard == true){
    inline_kb = true;
  }
  let noti = user.subscriptions;

  await view.notifications(vk_id, inline_kb, noti, d_text)
}

exports.toggle_notifications = async function (ctx, user, cmd) {
  let noti;
  let vk_id = user.vk_id;

  if (cmd == 'ads_noti') noti = 'ads';
  else if (cmd == 'alert_noti') noti = 'alert';
  else if (cmd == 'news_noti') noti = 'news';

  let status = user.subscriptions[noti];

  if(status === true){
    user.subscriptions[noti] = false;
    status = false;
  }
  else if (status === false){
    user.subscriptions[noti] = true;
    status = true;
  }

  let isSaves = await user.save();
  //console.log(isSaves);
  view.toggle_notifications(vk_id, status, ctx, user);
}


exports.getProfile = function (ctx, user) {
  return new Promise(async (resolve, reject) => {
    let start = false;
    if (user.start_msg.profile == false || user.start_msg.profile == undefined) {
      start = true;
      user.start_msg.profile = true;
      await user.save();
    }
    let vk_id = user.vk_id;
    let data = {
      balance_osn: user.money_out.toFixed(2),
      vk_token: user.vk_token,
      balance_job: user.money_job.toFixed(2),
      balance_ref: user.money_ref.toFixed(2),
      lvl: user.lvl.n || 1,
      exp: user.lvl.exp || 0,
      next_exp: user.lvl.next_lvl_exp || 100,
      referals: user.referals.length,
      referals_inc: user.referals_income,
      start: start
    };

    mainController.deleteContext(ctx).then(() => {
      view.profile(vk_id, data);
    });
  })
}
