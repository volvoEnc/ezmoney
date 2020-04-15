const VkBot = require('../lib/vkbotLib');
const userController = require('../controllers/userController');
const Bot = new VkBot();
const Queue = require('../lib/queue');
const {MODE, VK_SERVICE_KEY, VK_GROUP_ID, VK_API_TOKEN, VK_APP_ID, VK_APP_SICRET} = process.env;



exports.admin__get_app_link = function (vk_id, link) {
  let text = link;
  Queue.setTask(vk_id, 'message.send', {message: text});
};

exports.custom_error = function (vk_id, text) {
  Queue.setTask(vk_id, 'message.send', {message: text});
};




exports.noti__token_delete = function (vk_id) {

  let text = `В боте скоро появится возможность выполнять задания. Для внедрения этой системы, нам необходимо получить от Вас новый токен доступа.<br><br> Пожалуйста подтвердите аккаунт еще раз!`;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};
exports.noti__task_activate = function (vk_id) {
  let text = '';
  text += '✅ Задания запущены! <br><br>';
  text += '💬 Доступны задания на лайки и на репосты. Перейдите в раздел заданий и ознакомьтесь с правилами!<br><br>';
  text += '⚠ Задания находятся в тестовом режиме, если Вы обнаружите ошибку, то пишите в обсуждения сообщества.';
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};

exports.accepted_rules = function (vk_id, dop_text = '') {
  let text = dop_text;
  text += `Для продолжения работы с нашим сервисом, необходимо согласиться с правилами. <br> https://vk.com/@ezmoneybots-pravila-servisa <br><br> Нажмите на кнопку Да или напишите, Да.`;
  let kb = Bot.markup.keyboard([
    [
      Bot.markup.button('✅ Да', 'positive', {'command':'true'}),
      Bot.markup.button('🚫 Нет', 'negative', {'command':'false'}),
    ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}




exports.confirmUser = function (ctx, link, status) {
  let vk_id = ctx.message.from_id;
  let text;
  if(status == 'success') {
    text = `✅ Для подтверждения аккаунта перейдите по ссылке:`;
    Queue.setTask(vk_id, 'message.send', {message: text});
    setTimeout(function () {
      text = link;
      Queue.setTask(vk_id, 'message.send', {message: text});
    }, 500);
  }
  else {
    text = `Вы уже запрашивали подтверждение. Перейдите по предыдущей ссылке. <br> Следующий запрос можно сделать, ${status}`;
    Queue.setTask(vk_id, 'message.send', {message: text});
  }
}

exports.mailing = function (vk_id, text_msg) {
  let text = text_msg;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb, dont_parse_links: 1});
}






exports.tasks = function (vk_id, inline_kb = false, start = false) {
  let text = '';
  if (start) {
    text += `👨‍🏫 Обучение<br><br>`;
    text += `⚠ Перед выполнением заданий, Внимательно ознакомься с правилами: <br>`;
    text += `👉🏻 vk.com/@ezmoneybots-pravila-vypolneniya-zadanii<br><br>`;
    text += `💬 Задания позволяют начать зарабатывать без вложений.<br>`;
    text += `💬 Они бывают разные, сейчас доступно 2 типа заданий.<br><br>`;
    text += `⚠ Оплата за задания поступает в течении часа.<br><br>`;
  }

  text += `📋 Задания:<br><br>`;
  text += `📌 Лайк ~ 0.1 ₽<br>`;
  text += `📌 Репост ~ 1 ₽<br>`;
  //text += `📌 Подписка на рассылку ~ 10 ₽<br>`;

  let kb;

  if(inline_kb){
    kb = Bot.markup.keyboard([
      [ Bot.markup.button('❤️ Лайки', 'primary', {'command':'getlikeinfojob'}) ],
      [ Bot.markup.button('🗣 Репосты', 'primary', {'command':'getrepinfojob'}) ],
    //  [ Bot.markup.button('🚁 Рекламная рассылка', 'positive', {'command':'getrasslinfojob'}) ]
    ]).inline();
  } else {
    kb = Bot.markup.keyboard([
      [
        Bot.markup.button('❤️ Лайки', 'primary', {'command':'getlikeinfojob'}),
        Bot.markup.button('🗣 Репосты', 'primary', {'command':'getrepinfojob'})
      ],
      //[ Bot.markup.button('🚁 Рекламная рассылка', 'positive', {'command':'getrasslinfojob'}) ],
      [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
    ]);
  }
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}

exports.non_task = function (vk_id) {
  let text = `Данный функционал в разработке. Следите за новостями в группе.`;
  Queue.setTask(vk_id, 'message.send', {message: text});
}

exports.repost_task = function (vk_id, posts) {
  let text = `📌 Сделайте репост записей ниже, что-бы получить награду!<br>`;
  text += `⚠ Оплата за задания поступает в течении часа.<br><br>`;
  if (posts == ''){
    text += `Сейчас репостить нечего ☹`;
  } else {
    text += posts;
  }
  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.like_task = function (vk_id, posts) {
  let text = `📌 Поставьте лайк на записи ниже, что-бы получить награду!<br>`;
  text += `⚠ Оплата за задания поступает в течении часа.<br><br>`;
  if (posts == ''){
    text += `Сейчас лайкать нечего ☹`;
  } else {
    text += posts;
  }
  Queue.setTask(vk_id, 'message.send', {message: text});
}

exports.error_task_custom = function (vk_id, error_code) {
  let text = `⛔ При попытке получить доступ к вашему аккаунту, система получила ошибку. Пожалуйста подтвердите аккаунт еще раз. Код ошибки: ${error_code}<br>`;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.error_task = function (vk_id) {
  let text = `⛔ Система не смогла получить доступ к Вашему аккаунту.<br>`;
  text += `⛔ Это произошло потому, что Ваш профиль ВКонтакте имеет статус "Приватный"<br>`;
  text += `⛔ Задания оплачиваться не будут. Для разблокировки пишите тех.поддержку.`;
  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.error_token = function (vk_id) {
  let text = `⛔ Ваш токен не прошел проверку<br>`;
  text += `⛔ Доступ к некоторым разделам бота запрещен<br>`;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.success_task = function (vk_id, type_check, add_money, add_expr, add_text = '') {
  let text = add_text;
  let task = 'поставить лайк';

  if(type_check == 'repost') task = 'сделать репост';

  text += `✅ Получена оплата за задание, ${task}<br>`;
  text += `💳 + ${add_money} ₽ <br>`;
  text += `🔱 + ${add_expr} оп.`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};
exports.report_task = function (vk_id, type_check, add_rep_b) {
  let text = '';
  let task = 'поставить лайк';

  if(type_check == 'repost') task = 'сделать репост';

  text += `⛔ Задание, ${task} не прошло проверку!<br>`;
  text += `⭕ + ${add_rep_b} штрафных баллов. <br>`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};









exports.successConfirmUser = function (vk_id) {
  let text = `✅ Аккаунт успешно подтвержден!`;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}




exports.ping = function (vk_id, tm) {
  let text = `Время обработки запроса: ${tm}мс.`;
  Queue.setTask(vk_id, 'message.send', {message: text});
}













exports.referals = function (vk_id, date, start = false) {
  let text = '';

  if (start) {
    text += `👨‍🏫 Обучение<br><br>`;
    text += `💬 Рефералы это простой способ заработать.<br>`;
    text += `💬 Все что нужно сделать, это пригласить друга и попросить ввести его твой бонус-код или дать ему свою реф.ссылку!<br>`;
    text += `💬 Для того, что бы больше узнать о рефералах посмотри этот пост: <br>`;
    text += `👉🏻 https://vk.com/@ezmoneybots-referaly <br><br>`;
  }

  text += `👪 Рефералов: ${date.count}<br>`;
  text += `💰 Доход: ${date.income} ₽<br>`;
  text += `💳 Ожидают: ${date.income_bm} ₽<br><br>`;
  text += `🎁 Бонус-код: ${date.code}<br>`;
  text += `💰 Реферальная ссылка: https://vk.com/app7177293#r/${date.code}<br>`;
  text += `✅ За каждого реферала ты получишь ${date.add_b_r} ₽. А так же ${date.add_p_r}% от пополенения баланса.`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb, dont_parse_links: 1});
};
exports.refCode__error = function (vk_id, type) {
  let text = '';
  //у пользователя уже есть код
  if (type == 'overflow_code') {
    text += `🚫 Этот бонус можно получить только 1 раз!`;
  }
  //любая ошибка при проверке кода
  else if (type == 'overflow_user'){
    text += `🚫 Вы не можете использовать свой код`;
  }
  else if (type == 'bad_code'){
    text += `🚫 Код недействителен!`;
  }
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};
exports.refCode__success = function (vk_id, add_money) {
  let text = '';
  text += `✅ Поздравляем! <br> Бонус в размере ${add_money} ₽ получен!`;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};
exports.refCode__success_inv = function (vk_id, add_money, vk_id_add) {
  let text = '';
  text += `✅ Пользователь: id${vk_id_add}, ввел твой бонус-код! <br> Вознаграждение в размере ${add_money} ₽ начислено!`;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};
exports.refCode__go = function (vk_id, start = false) {
  let text = '';
  if (start) {
    text += `👨‍🏫 Обучение<br><br>`;
    text += `💬 Бонус-код можно ввести только один раз!.<br>`;
    text += `💬 Код можно попросить у любого пользователя проекта. У тебя он тоже есть.<br>`;
    text += `💬 Мы создали специальное обсуждение, где можно взять код.<br>`;
    text += `👉🏻 https://vk.com/topic-187786454_39939941 <br><br>`;
  }
  text += `💰 Для получения бонуса, введите код: `;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
};












exports.userSettings = function (vk_id) {
  let text = `✏ Настройки: `;
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('🔔 Уведомления', 'primary', {'command':'notifications_settings'}) ],
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}

exports.notifications = function (vk_id, inline_kb, noti, d_text) {
  let text;
  if (d_text === false) {
    text = `🔔 Уведомления: <br><br>`;

    text += `💡 Системные сообщения: <br> Уведомления о готовности бонусов, привлечении нового реферала, выводе средств с баланса и т.д.<br><br>`;
    text += `💡 Новости, акции и индивидуальные предложения: <br> Получайте уведомления о важных событиях на сервисе, выгодных акциях и многом другом! Так же мы будем формировать для вас Индивидуальные предложения и задания! <br><br>`;
    text += `💡 Рекламная рассылка: <br> Получайте рекламную рассылку. Не чаще 1 раза в 24 часа. Отписаться можно в любой момент.`;

  } else {
    text = d_text;
  }
  let noti_simbol = {
    ads: '🔔',
    alert: '🔔',
    news: '🔔'
  };
  if (noti.ads === false) noti_simbol.ads = '🔕';
  if (noti.alert === false) noti_simbol.alert = '🔕';
  if (noti.news === false) noti_simbol.news = '🔕';


  let kb = Bot.markup.keyboard([
    [ Bot.markup.button(`${noti_simbol.ads} Рекламная рассылка`, 'positive', {'command':'ads_noti'}) ],
    [
      Bot.markup.button(`${noti_simbol.alert} Системные сообщения`, 'primary', {'command':'alert_noti'}),
      Bot.markup.button(`${noti_simbol.news} Новости, акции и т.д.`, 'primary', {'command':'news_noti'})
    ],
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'settings'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.toggle_notifications = function (vk_id, type, ctx, user) {
  let text;

  if (type === false) text = `⚠ Уведомления выключены.`;
  else text = `✅ Уведомления включены.`;

  userController.notifications(ctx, user, text);
  //Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.bonuses = function (vk_id, data, start = false) {
  let text = '';

  if (start) {
    text += `👨‍🏫 Обучение<br><br>`;
    text += `💬 Это раздел с бонусами.<br>`;
    text += `💬 Бонусы позволяют получать деньги, просто просмотрев короткую рекламу.<br>`;
    text += `💬 Для того, что бы узнать как собирать бонусы, посмотри эту статью: <br>`;
    text += `👉🏻 https://vk.com/@ezmoneybots-bonusy <br><br>`;
  }

  let b24_c = data.b_24.access ? 'positive' : 'negative';
  let b12_c = data.b_12.access ? 'positive' : 'negative';
  let b1_c = data.b_1.access ? 'positive' : 'negative';

  text += `🎁 Список доступных бонусов:<br><br>`;

  if (!data.b_24.access) text += `⛔ Ежедневный бонус недоступен.<br>⌚ Заходи ${data.b_24.next_access}.<br><br>`;
  else text += `💎 Ежедневный бонус готов!<br><br>`;
  if (!data.b_12.access) text += `⛔ Бонус каждые 12 ч. еще недоступен.<br>⌚ Заходи ${data.b_12.next_access}.<br><br>`;
  else text += `💎 Бонус каждые 12 часов готов!<br><br>`;
  if (!data.b_1.access) text += `⛔ Бонус каждый час еще недоступен.<br>⌚ Заходи ${data.b_1.next_access}.<br><br>`;
  else text += `💎 Бонус каждый час готов!<br><br>`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('💎 Ежедневный бонус', b24_c, {'command':'addbonus-24h'}) ],
    [ Bot.markup.button('💎 Бонус каждые 12 ч.', b12_c, {'command':'addbonus-12h'}) ],
    [ Bot.markup.button('💎 Бонус каждый час', b1_c, {'command':'addbonus-1h'}) ],
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);

  if (data.b_code.access == true) {
    kb = Bot.markup.keyboard([
      [ Bot.markup.button('💎 Бонус-код', 'positive', {'command':'addbonus-code'}) ],
      [ Bot.markup.button('💎 Ежедневный бонус', b24_c, {'command':'addbonus-24h'}) ],
      [ Bot.markup.button('💎 Бонус каждые 12 ч.', b12_c, {'command':'addbonus-12h'}) ],
      [ Bot.markup.button('💎 Бонус каждый час', b1_c, {'command':'addbonus-1h'}) ],
      [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
    ]);
  }

  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.error_bonus = function (vk_id, type, date) {
  let text = `Время еще не пришло!<br>`;

  if (type == 'b_24') text += `Зайди за ежедневным бонусом ${date}.`;
  else if (type == 'b_12') text += `Зайди за бонусом ${date}.`;
  else if (type == 'b_1') text += `Зайди за ежечасовым бонусом ${date}.`;

  //kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.success_bonus = function (vk_id, type, add_money, add_expr, num_rep, add_text) {
  let text = add_text;

  // if(num_rep == 1) text += `Оу, ты получил бонус!<br>`;
  // else if(num_rep == 2) text += `Поздравляю, бонус получен!<br>`;
  // else if(num_rep == 3) text += `Какая радость!<br>`;
  // else if(num_rep == 4) text += `Что-то произошло!<br>`;
  // else if(num_rep == 5) text += `Б - значит Бонус!<br>`;

  if (type == 'b_24') text += `✅ Ежедневный бонус зачислен на баланс! <br>💳 + ${add_money} ₽ <br>🔱 + ${add_expr} оп.`;
  else if (type == 'b_12') text += `✅ Бонус каждые 12 часов уже на балансе! <br>💳 + ${add_money} ₽ <br>🔱 + ${add_expr} оп.`;
  else if (type == 'b_1') text += `✅ Ежечасовой бонус зачислен! <br>💳 + ${add_money} ₽ <br>🔱 + ${add_expr} оп.`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);

  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.go_bonus = async (vk_id, short_url, data) => {
  let b24_c = data.b_24.access ? 'positive' : 'negative';
  let b12_c = data.b_12.access ? 'positive' : 'negative';
  let b1_c = data.b_1.access ? 'positive' : 'negative';
  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('💎 Ежедневный бонус', b24_c, {'command':'addbonus-24h'}) ],
    [ Bot.markup.button('💎 Бонус каждые 12 ч.', b12_c, {'command':'addbonus-12h'}) ],
    [ Bot.markup.button('💎 Бонус каждый час', b1_c, {'command':'addbonus-1h'}) ],
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);

  kb = JSON.stringify(kb);
  let text = `Твой бонус готов! <br> Для его получения перейди по ссылке:`;
  await Queue.setTask(vk_id, 'message.send', {message: text});
  setTimeout(() => {
    text = short_url;
    Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb, dont_parse_links: 1});
  }, 500);
}
exports.notifications_bonus = function (vk_id, type) {
  let text;
  if (type == 'b_24') text = `💎 Ура! Ежедневный бонус наконец-то можно собрать. 💎`;
  else if (type == 'b_12') text = `💎 Бонус который можно собрать всего лишь раз в 12 часов, готов к сбору! 💎`;
  else if (type == 'b_1') text = `💎 Дзынь-дзынь! <br> Пришло время собрать ежечасовой бонус! 💎`;

  Queue.setTask(vk_id, 'message.send', {message: text});
}





exports.outmoney_canceled = function (vk_id, type) {
  let text = '';

  if (type == 'user') {

  }
  else if (type == 'admin'){

  }
};
exports.outmoney_list = function (vk_id, date, count) {
  let text = `💰 Список заявок на вывод: <br><br>`;
  //console.log(date);
  if (date[0] == undefined) {
    text += `✅ Заявок нет!`;
  } else {
    date.forEach(z => {
      text += `ID: ${z.np}<br>`;
      text += `Сумма: ${z.sum} ₽<br>`;
      text += `Данные: ${z.comm} <br>`;
      text += `Ссылка: https://vk.com/id${z.user} <br><br>`;
    });
  }
  console.log(count);
  if (count > 0) {
    text += `Еще: ${count}`;
  }
  console.log(text);
  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.outmoney_success_user = function (vk_id, id) {
  let text = `✅ Средства выплачены!<br>`;
  text += `Номер заявки: ${id}<br>`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'primary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.outmoney_success_admin = function (vk_id, id) {
  let text = `Заявка №${id} выплачена!<br>`;
  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.outmoney_error_user = function (vk_id, id, msg) {
  let text = `🚫 Отказ в выплате!<br>`;
  text += `Номер заявки: ${id}<br>`;
  text += `Причина: ${msg}`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'primary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.outmoney_error_admin = function (vk_id, id) {
  let text = `Выплата по счету №${id} отменена!`;
  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.outmoney__error = function (vk_id, type) {
  let text = '';

  if (type == 'lvl'){
    text = `🚫 Вывод средств доступен с 3-го уровня!`;
  }
  else if (type == 'limit') {
    text = `🚫 Достигнут ежедневный лимит на вывод средств.`;
  }
  else if (type == 'max') {
    text = `🚫 Вы не можете вывести больше, чем Ваш лимит на вывод в сутки.`;
  }
  else if (type == 'min') {
    text = `🚫 Минимальная сумма для вывода 1 ₽`;
  }
  else if (type == 'nomoney') {
    text = `🚫 Недостаточно средств на балансе`;
  }

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.outmoney__continius = function (vk_id, limit) {
  let text = '';
  text += `✏ Введите сумму для вывода<br>`;
  text += `💡 Ваш лимит на вывод сегодня: ${limit} ₽ <br>`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.outmoney__requisites = function (vk_id) {
  let text = '';
  text += `✏ Введите способ вывода и реквизиты: <br>`;
  text += `💡 Например, < киви, +79008080999 > <br>`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.outmoney__finish = function (vk_id, type, date) {
  let text = '';
  if (type == 'user') {
    text += `✅ Заявка на вывод успешно создана! №${date.np}<br>`;
    let kb = Bot.markup.keyboard([
      [ Bot.markup.button('👤 Профиль', 'secondary', {'command':'профиль'}) ]
    ]);
    kb = JSON.stringify(kb);
    Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
  }
  else if (type == 'admin') {
    text += `⚠ Заявка на вывод <br><br>`;
    text += `ID: ${date.np}<br>`;
    text += `Сумма: ${date.sum} ₽<br>`;
    text += `Данные: ${date.comm}<br>`;
    text += `Пользователь: https://vk.com/id${date.user}`;
    Queue.setTask(vk_id, 'message.send', {message: text});
  }
}









exports.payment_link = function (vk_id, link, np) {
  let text = `💡 Счет №${np} создан!<br>`;
  text += `🏷 Для оплаты перейдите по ссылке: `;
  Queue.setTask(vk_id, 'message.send', {message: text});
  setTimeout(() => {
    text = link;
    Queue.setTask(vk_id, 'message.send', {message: text, dont_parse_links: 1});
  }, 500);
}
exports.go_sum = function (vk_id) {
  let text = `💳 Пополение баланса<br><br>`;
  text += `⚠ Минимальная сумма пополения 1 ₽<br>`;
  text += `⚠ Максимальная сумма пополения 10 000 ₽<br><br>`;
  text += `✏ Введите сумму пополения: `;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.success_pay = function (vk_id, add_money, add_exp, dop_text) {
  let text = dop_text;
  text += `✅ Баланс пополенен на ${add_money} ₽<br>`;
  text += `🔱 Получено опыта: ${add_exp}`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.success_pay_admin = function (vk_id_a, vk_id, add_money) {
  let text = '';
  text += `✅ Пользователь пополнил баланс на ${add_money} ₽<br>`;
  text += `https://vk.com/id${vk_id}`;

  Queue.setTask(vk_id_a, 'message.send', {message: text});
}
exports.success_pay_r = function (vk_id, add_money, procent) {
  let text = '';
  text += `✅ Реферальные отчисления.<br>`;
  text += `💳 На рабочий счет зачислено ${add_money} ₽ (${procent}%)<br>`;
  text += `💡 Чем выше твой уровень, тем больше %`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
exports.error_pay = function (vk_id) {
  let text = `🚫 Оплата отменена!`;

  Queue.setTask(vk_id, 'message.send', {message: text});
}
exports.payments = function (vk_id, start, stocks) {
  let text = '';
  if (start) {
    text += `👨‍🏫 Обучение<br><br>`;
    text += `💬 При пополнении баланса вы получаете опыт!<br>`;
    text += `💬 1 ₽ = 5 оп.<br><br>`;
  }

  if (stocks != undefined && stocks.length > 0) {
    text += `🎁 Действующие акции: <br>`;
    stocks.forEach(stock => {
      text += `🎗 ${stock.name}<br>`;
    });
    text += `<br>`;
  }

  text += `💳 Выберите способ пополнения: <br><br>`;
  text += `💎 VkPay - нет комиссий. Моментальное получение стредств на баланс. <br>`;
  text += `💰 Другие способы - пополение картой, электронными кошельками (Qiwi, YandexMoney) и т.д. <br>`;
  let group_id = VK_GROUP_ID;
  let kb = {
    "buttons": [
      [{
          "action": {
            "type": 'vkpay',
            "hash": `action=transfer-to-group&group_id=${group_id}`
          }
      }],
      [{
          "action": {
            "type": 'text',
            "label": `💰 Другие способы`,
            "payload": {'command':'otheraddpay'}
          },
          "color": "positive"
      }],
      [{
          "action": {
            "type": 'text',
            "label": `⬅️ Назад`,
            "payload": {'command':'профиль'}
          }
      }]
    ]
  }
  kb = JSON.stringify(kb);
  kb = JSON.stringify(kb);
  //console.log(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}













exports.profile = function (vk_id, data) {
  let text = '';

  if (data.start == true) {
    text += `👨‍🏫 Обучение<br><br>`;
    text += `💬 Это твой профиль. Тут ты можешь посмотреть краткую информацию о своем аккаунте.<br>`;
    text += `💬 У тебя есть 2 баланса, основоной и рабочий.<br>`;
    text += `💬 С основного баланса можно выводить деньги.<br>`;
    text += `💬 Каждую миниту, на основной баланс поступает доход. Размер поступлений зависит от суммы денег на рабочем балансе.<br><br>`;
    text += `💬 Перейди в статистику для более подробной информации о доходе.<br>`;
    text += `💬 Если у тебя пропали кнопки, напиши Профиль, или нажми на иконку (см. скриншот ниже).<br><br>`;
  }

  text += `👤 Профиль<br><br>`;
  text += `💸 Баланс: ${data.balance_osn} ₽<br>`;
  text += `💳 Баланс (рабочий): ${data.balance_job} ₽<br>`;
  text += `💰 Доход с реферелов: ${data.referals_inc} ₽<br>`;
  text += `👪 Рефералов: ${data.referals}<br>`;
  text += `🚀 Уровень ${data.lvl} (${data.exp}/${data.next_exp})<br><br>`;
  if(data.vk_token == undefined || data.vk_token == ''){
    text += `❗ Аккаунт не прошел подтверждение ❗`;
  }

  let d_quest = [
                  Bot.markup.button('📋 Задания', 'primary', {'command':'getquest'}),
                  Bot.markup.button('🎁 Бонусы', 'primary', {'command':'getbonus'}),
                ];
  let d_token = [
                  Bot.markup.button('✅ Подтвердить аккаунт', 'primary', {'command':'gettoken'})
                ];

  let kb = Bot.markup.keyboard([
                [ Bot.markup.button('', 'secondary') ],
                [
                  Bot.markup.button('📝 Статистика', 'secondary', {'command':'stats'}),
                  Bot.markup.button('👥 Рефералы', 'secondary', {'command':'refd'}),
                  Bot.markup.button('✏ Настройки', 'secondary', {'command':'settings'}),
                ],
                [
                  Bot.markup.button('💳 Пополнить', 'positive', {'command':'addpay'}),
                  Bot.markup.button('💸 Вывести', 'negative', {'command':'outmoney'}),
                ]
        ]);

  if (data.vk_token == undefined || data.vk_token == '') kb.__keyboard.buttons[0] = d_token;
  else kb.__keyboard.buttons[0] = d_quest;

  kb = JSON.stringify(kb);
  if (data.start == true) {
    Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb, attachment: 'photo-187786454_457239075'});
  } else {
    Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
  }
}

exports.stats = function (vk_id, data) {
  let text = `📊 Статистика: <br><br>`;

  text += `💰 Доход:<br>`;
  text += `💵 Доход в час: ~ ${data.income.h} ₽<br>`;
  text += `💵 Доход в сутки: ~ ${data.income.d} ₽<br>`;
  text += `💵 Доход в месяц: ~ ${data.income.m} ₽<br><br>`;

  text += `🎁 Бонусы: <br>`;
  text += `💎 24 часовых: ${data.bonus.b_24} ₽<br>`;
  text += `💎 12 часовых: ${data.bonus.b_12} ₽<br>`;
  text += `💎 1 часовых: ${data.bonus.b_1} ₽<br>`;
  text += `💎 Всего: ${data.bonus.b_all} ₽<br><br>`;

  text += `📋Задания:<br>`;
  text += `❤️ Поставлено лайков: ${data.tasks.liked_count}<br>`;
  text += `❤️ Заработано на лайках: ${data.tasks.liked_income} ₽<br>`;
  text += `🗣 Сделано репостов: ${data.tasks.repost_count}<br>`;
  text += `🗣 Заработано на репостах: ${data.tasks.repost_income} ₽<br><br>`;
  //text += `✍️ Выполнено заданий: 0<br>`;
  //text += `✍️ Заработано на заданиях: 0 ₽<br><br>`;
  text += `🕐 На проекте: ${data.time_in_prj}<br>`;
  text += `📅 Аккаунт создан: ${data.date_reg}<br><br>`;
  //text += `🛍 За все время заработали: 4 000 ₽ <br><br>`;
  text += `⭕️ Штрафных баллов: ${data.report_balls}`;

  let kb = Bot.markup.keyboard([
    [ Bot.markup.button('⬅️ Назад', 'secondary', {'command':'профиль'}) ]
  ]);
  kb = JSON.stringify(kb);
  Queue.setTask(vk_id, 'message.send', {message: text, keyboard: kb});
}
