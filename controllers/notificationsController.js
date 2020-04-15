const Queue = require('../lib/queue');
const User = require('../models/User');
const view = require('../views/view');


class NotificationsController {
  constructor() {

  }

  checkBonus() {
    User.find({"subscriptions.alert": true, status: true}, 'bonus vk_id', (err, users) => {
      if(err) throw err;

      users.forEach((user, i) => {
        for (let key in user.bonus) {
          if( (user.bonus[key].note === true || user.bonus[key].note == undefined) && user.bonus[key].upd <= Date.now() && user.bonus[key].accept == true){
            let vk_id = user.vk_id;
            //Queue.setTask(vk_id, 'message.send', {message: 'Пора собрать бонусы'});
            user.bonus[key].note = false;
            let res = user.save(err => {
              view.notifications_bonus(vk_id, key);
            });

            break;
          } else {
            //console.log('Для пользователя готовых бонусов не найдено!');
          }
        }
      });
      // users = new_users;
      // users.save(err => {
      //   if (err) throw('ERR:012:Ошибка обновления бонуса');
      //
      //   console.log('ОК');
      // });
    });
  }

}

module.exports = new NotificationsController();
