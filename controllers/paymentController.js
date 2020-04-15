const User = require('../models/User');
const Payment = require('../models/Payment');
const Stock = require('../models/Stock');

const MD5 = require("md5");

const mainController = require('../controllers/mainController');
const view = require('../views/view');
const {MODE, VK_SERVICE_KEY, VK_GROUP_ID, VK_API_TOKEN, VK_APP_ID, VK_APP_SICRET, R_PASS_DEMO1, R_PASS_DEMO2, R_PASS1, R_PASS2, VK_ID_ADMIN} = process.env;






exports.handlerPaymentRobokassa = function (data) {
  return new Promise(async (resolve, reject) => {
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
      let add_money_n = await exports.calculation_stock(add_money);
      let add_expr = add_money * 5;
      add_expr = add_expr.toFixed();

      user.money_job = user.money_job + add_money_n;
      await user.save();

      mainController.calculation_money(vk_id);
      mainController.ref_otch(user, add_money);
      mainController.calculation_exp(vk_id, add_expr).then(async add_text => {
        if (istest == 1) add_text += `Тестовая оплата<br>`;
        // user.lvl.limit_out = add_money * 2;
        // await user.save();
        view.success_pay(vk_id, add_money_n, add_expr, add_text);
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








exports.pay_vkpay = async (ctx) => {
  let payment_data = {
    vk_id: ctx.message.from_id,
    amount: (ctx.message.amount / 1000),
    'date.end': Date.now(),
    type: 'vk_pay',
    status: 'success'
  }
  let vk_id = payment_data.vk_id;
  let pay = new Payment(payment_data);
  await pay.save();

  let user = await User.findOne({vk_id: vk_id});

  let add_money = payment_data.amount;
  let add_money_n = await exports.calculation_stock(add_money);
  let add_expr = add_money * 5;
  add_expr = add_expr.toFixed();

  user.money_job = user.money_job + add_money_n;
  await user.save();

  mainController.ref_otch(user, add_money);
  mainController.calculation_money(vk_id);
  mainController.calculation_exp(vk_id, add_expr).then(async add_text => {
    // user.lvl.limit_out = add_money * 2;
    // await user.save();
    view.success_pay(vk_id, add_money_n, add_expr, add_text);
    view.success_pay_admin(VK_ID_ADMIN, vk_id, add_money);
  });
}



exports.calculation_stock = function (add_money_ns) {
  let add_money = add_money_ns;
  let add_money_n = add_money_ns;

  return new Promise(async (resolve, reject) => {
    let stocks = await Stock.getActive();
    if (stocks != undefined && stocks.length > 0) {
        stocks.forEach(stock => {
          let data_st = stock.data;
          let add_m;
          let type;
          data_st.forEach((element_stock, index) => {
            if (add_money >= element_stock.invoce) {
              add_m = Number(element_stock.bonus);
              type = element_stock.type_bonus;
            }
          });

          if (type != undefined) {
            let add_mf;
            if (type == 'num') { add_mf = add_m; }
            if (type == 'proc') { add_mf = add_money / 100 * add_m; }

            add_mf = Number(add_mf);
            add_mf = Number(add_mf.toFixed(5));

            add_money_n = add_money_n + add_mf;
          }
        });
        resolve (add_money_n);
    }
    else {
      resolve (add_money_n);
    }
  });
};
