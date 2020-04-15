const User = require('../models/User');
const mainController = require('../controllers/mainController');
const view = require('../views/view');

class AppComputing {
  constructor () {
    this.response = {};
  }


  appRouter (route_d, vk_id) {
    return new Promise(async (resolve, reject) => {
      let route = route_d.replace('#', '');
      console.log(vk_id);
      let user = await this._analysis_user(vk_id);
      if (route.indexOf('tgst/') == 0) {
        setTimeout(async () => {
          view.accepted_rules(vk_id, 'Добро пожаловать!<br><br>')
        }, 2000);
      }
      else if (route.indexOf('r/') == 0) {
        let code = route.replace('r/', '');
        code = code.toUpperCase();

        if (code.length > 10 || code.length < 10) {
          this.response['error'] = true;
          this.response['error_msg'] = 'Неверный код!';
        }
        else if (user.ref_code == code) {
          this.response['error'] = true;
          this.response['error_msg'] = 'Вы не можете использовать свой код!';
        }
        else if (user.invite_code != undefined) {
          this.response['error'] = true;
          this.response['error_msg'] = 'Вы уже получали бонус!';
        }


        if (this.response['error'] == undefined) {
          let inv_user = await User.findOne().where({ref_code: code});

          if (inv_user == undefined) {
            this.response['error'] = true;
            this.response['error_msg'] = 'Неверный код!2';
          }
          else {
            let referals = inv_user.referals;
            referals.forEach(referal => {
              if (referal.vk_id == vk_id) {
                this.response['error'] = true;
                this.response['error_msg'] = 'Вы уже получали бонус!';
              }
            });

            if (this.response['error'] == undefined) {
              if (inv_user.report_balls < 50 && inv_user.status == true && inv_user.vk_token != undefined) {

                let b_m_a_m = Number(inv_user.lvl.ref_bonus_add);
                user.money_job = user.money_job + b_m_a_m;
                user.invite_code = code;

                let new_ref = {
                  vk_id: vk_id,
                  procent: inv_user.lvl.proc_ref,
                  b_m: inv_user.lvl.ref_bonus_add
                };

                inv_user.referals.push(new_ref);
                let vk_id_inv = inv_user.vk_id;
                inv_user.save();
                view.refCode__success_inv(vk_id_inv, inv_user.lvl.ref_bonus_add, vk_id);
              }
              else {
                user.money_job += 5;
                user.invite_code = code;
              }
              await user.save();
              await mainController.calculation_money(vk_id);
            }
          }
        }
      }
      console.log(this.response);
      resolve(this.response);
    });
  }

  _analysis_user (vk_id) {
    return new Promise(async (resolve, reject) => {
      let user = await User.findOne().where({vk_id: vk_id});
      if (user == undefined) {
        user = await this._create_user(vk_id);
        this.response['status'] = 'new';
        resolve(user);
      }
      else {
        this.response['status'] = 'old';
        resolve(user);
      }
    });
  }

  _create_user (vk_id) {
    return new Promise(async (resolve, reject) => {
      let ref_code = await mainController.getRefCode();
      let new_user = new User({
        vk_id: vk_id,
        status: false,
        ref_code: ref_code
      });
      let save = await new_user.save();
      resolve(save);
    });
  }
}




const AppComputing_o = new AppComputing();
module.exports = AppComputing_o;
