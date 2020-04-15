const mainController = require('../controllers/mainController');
const vkapiController = require('../controllers/vkapiController');
const eventController = require('../controllers/eventController');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const Fuse = require('fuse.js');

const view = require('../views/view');

const FuseOptions = {
  id: "command",
  shouldSort: true,
  tokenize: false,
  threshold: 0.5,
  maxPatternLength: 32,
  minMatchCharLength: 3,
  keys: ["text"]
};
const FuseList = [
  { command: 'профиль', text: ['профиль', 'аккаунт']},
  { command: 'getquest', text: ['задание', 'репост', 'лайк']},
  { command: 'getbonus', text: ['бонус', 'приз']},
  { command: 'stats', text: ['статистика', 'доход', 'данные']},
  { command: 'refd', text: ['друзья', 'пригласить', 'реферал']},
  { command: 'settings', text: ['настройки', 'уведомления', 'ссылка']},
  { command: 'outmoney', text: ['вывести']},
  { command: 'addpay', text: ['пополнить']}
];
const fuse = new Fuse(FuseList, FuseOptions);
// var result = fuse.search("хочу бонус");

exports.command = function (ctx, cmd_a, user, accepted, d_tm, context) {
  let cmd = cmd_a.cmd;

  userController.loginUser(ctx).then(is_login => {
    if(accepted == false){
      if(cmd == 'true' || cmd == 'да' || cmd == 'хорошо' || cmd == 'ок' || cmd == 'согласна' || cmd == 'согласен'){
        userController.setAcceptedRules(ctx, user);
      }
      else if(cmd == 'false' || cmd == 'нет' || cmd == 'отмена'){
        userController.noAcceptedRules(ctx);
      }
      else {
        let vk_id = ctx.message.from_id;
        view.accepted_rules(vk_id, is_login); // is_login = dop_text
        let h48 = 48 * 60 * 60;
        mainController.setContext(ctx, 'accept_rules', h48);
      }
    } else {


      //разбираем команды
      //console.log('разбираем команды');

      if(cmd.indexOf('/') == 0) {
        if(user.privelegies == 'admin') {
          switch (cmd) {
            case '/online':
              vkapiController.setOnline(ctx);
            break;
            case '/offline':
              vkapiController.setOffline(ctx);
            break;
            case '/status':
              vkapiController.getOnline(ctx);
            break;
            case '/exec':
              vkapiController.execute_command(ctx);
            break;
            case '/delete_tokens':
              userController.test();
            break;
            case '/job_access_true':
              userController.job_access_true();
            break;
            case '/ref':
              userController.goInviteCode(ctx, user);
            break;
            case '/app':
              adminController.getapp();
            break;
            case '/stt':
              vkapiController.stt(ctx, user);
            break;
          }

          if (cmd.indexOf('/pay_list') == 0) { // /pay_list(1,2,3...)
            mainController.get_payments_out_list(cmd);
          }
          else if (cmd.indexOf('/pay_ok') == 0) { // pay_ok1149
            mainController.payments_out_complite(cmd);
          }
          else if (cmd.indexOf('/pay_error') == 0) { // /pay_error1149|Минимальная сумма для вывода на карту 100 рублей.
            mainController.payments_out_error(cmd);
          }

        }
      }
      else if (cmd.indexOf('|||') == 0) {
        if(user.privelegies == 'admin') {
          mainController.mailing(cmd_a.org_cmd);
        }
      } else {
        if (context === undefined) {
          let fuse_cmd = fuse.search(cmd);
          if (fuse_cmd.length > 0) {
            fuse_cmd = fuse_cmd[0];
          } else {
            fuse_cmd = cmd;
          }
          switch (fuse_cmd) {
            case '!ping':
              userController.ping(ctx, user, d_tm);
            break;
            case '!test':
              userController.test(user);
              break;
            case 'профиль':
              userController.getProfile(ctx, user);
            break;
            case 'подтвердить':
            case 'gettoken':
              userController.setConfirmUser(ctx, user);
            break;
            case 'stats':
              userController.getStatsUser(ctx, user);
            break;
            case 'refd':
              userController.referals(ctx, user);
            break;
            case 'settings':
              userController.settings(ctx, user);
            break;
            case 'reflink_settings':
              userController.referals(ctx, user);
            break;
            case 'addbonus-code':
              userController.goInviteCode(ctx, user);
            break;
            case 'addmoney_settings':
              userController.noTasks(ctx, user);
            break;
            case 'getquest':
              userController.getTasks(ctx, user);
            break;
            case 'getlikeinfojob':
              userController.like_task(ctx, user);
            break;
            case 'getrepinfojob':
              userController.repost_task(ctx, user);
            break;
            case 'getrasslinfojob':
              userController.noTasks(ctx, user);
            break;
            case 'getbonus':
              userController.getBonus(ctx, user);
            break;
            case 'addbonus-24h':
            case 'addbonus-12h':
            case 'addbonus-1h':
              userController.addBonusInUser(ctx, user, cmd);
            break;
            case 'notifications_settings':
              userController.notifications(ctx, user);
            break;
            case 'ads_noti':
            case 'alert_noti':
            case 'news_noti':
              userController.toggle_notifications(ctx, user, cmd);
            break;
            case 'outmoney':
              userController.outmoney(ctx, user);
            break;
            case 'addpay':
              userController.getpayments(ctx, user);
            break;
            case 'otheraddpay':
              userController.sumpayments(ctx, user);
            break;
          }
        }
        else if (context === 'pay'){
          let result = Number(cmd);
          if (isNaN(result)) {
            switch (cmd) {
              case 'профиль':
                userController.getProfile(ctx, user);
              break;
            }
          } else {
            userController.createPaymentRobokassa(ctx, user, result);
          }
        }
        else if (context === 'pay_out__money'){
          let result = Number(cmd);
          if (isNaN(result)) {
            switch (cmd) {
              case 'профиль':
                userController.getProfile(ctx, user);
              break;
            }
          } else {
            userController.createPaymentOut(ctx, user, result);
          }
        }
        else if (context.indexOf('pay_out__requisites') == 0){
          let result = cmd;
          let out_money = context.replace('pay_out__requisites', '');
          out_money = Number(out_money);

          if (result == 'профиль') {
            userController.getProfile(ctx, user);
          }
          else {
            userController.createPaymentOut__final(ctx, user, result, out_money);
          }
        }
        else if (context.indexOf('ref_code') == 0){
          let code = cmd;

          if (code == 'профиль') {
            userController.getProfile(ctx, user);
          }
          else {
            userController.addInviteCode(ctx, user, code);
          }
        }
      }
    }
  });
}
