const VkAPI = require('vksdk');
const Faker = require("faker");
const User = require('../models/User')
const mainController = require('../controllers/mainController');
const {MODE, VK_SERVICE_KEY, VK_GROUP_ID, VK_API_TOKEN, VK_APP_ID, VK_APP_SICRET} = process.env;
const VK = new VkAPI({
   'appId'     : VK_APP_ID,
   'appSecret' : VK_APP_SICRET,
   'language'  : 'ru',
   'secure'    :  true,
   'version'   : '5.103'
});
VK.setToken(VK_API_TOKEN);

exports.loginUser = function (ctx) {
  let vk_id = ctx.message.from_id
  User.findOne({vk_id: vk_id}, 'report_balls accept_rules', (err, user) => {
    if (err) console.error('ERR:001:Ошибка при поиске User по vk_id')

    if(user.report_balls >= 75) {
      ctx.reply('Ваш аккаунт заблокирован, т.к. у Вас превышен лимит штрафных баллов!')
      ctx.reply(`Штрафных баллов на аккаунте: ${user.report_balls} шт.`)
    }
    else if (user.accept_rules == false){
      ctx.reply('Для продолжения работы с нашим сервисом, необходимо согласиться с правилами.<br>https://vk.com/@ezmoneybots-pravila-servisa')

      mainController.setContext(ctx, 'accept_rules').then(res => {
        ctx.reply('Да - согласен(нa)<br>Нет - не согласен(на)')
      })
    }
    else{
      ctx.reply('Аккаунт уже существует, перехожу в Ваш профиль...')
      //Вызываем getProfile() или игнорируем вызов команды
    }
  })
}


exports.getVKCClink = function (link) {
  return new Promise((resolve, reject) => {
    VK.request('utils.getShortLink', {'url' : link}, function(res) {
      //console.log(res)
      resolve(res.response.short_url);
    })
  })
}


exports.setOnline = function (ctx) {
  VK.request('groups.enableOnline', {'group_id' : VK_GROUP_ID}, function(res) {
    if(res.error !== undefined){
      ctx.reply('Группа уже онлайн')
    }
    else {
      ctx.reply('Группа онлайн')
    }
  })
}

exports.getOnline = function (ctx) {
  VK.request('groups.getOnlineStatus', {'group_id' : VK_GROUP_ID}, function(res) {
    let status = res.response.status

    if(status == 'none'){
      ctx.reply('Группа оффлайн')
    }
    else if(status == 'online'){
      ctx.reply('Группа онлайн')
    }
  })
}

exports.setOffline = function (ctx) {
  VK.request('groups.disableOnline', {'group_id' : VK_GROUP_ID}, function(res) {
    if(res.error !== undefined){
      ctx.reply('Группа уже оффлайн')
    }
    else {
      ctx.reply('Группа оффлайн')
    }
  })
}

exports.getUser = function (ctx, sett = {}) {
  let user_id;
  let name_case;
  sett.userid == undefined ? user_id = ctx.message.user_id : user_id = sett.userid;
  sett.name_case == undefined ? name_case = 'nom' : name_case = sett.name_case;
  return new Promise(function(resolve, reject) {
    VK.request('users.get', {'user_id' : user_id, 'name_case' : name_case}, function(res) {
      resolve(res)
    })
  })
}

exports.setEditMsg = function (ctx, sett = {}) {
  let peer_id;
  let message = 'Hello Bro!';
  let msgid = ctx.message.id + 1;
  sett.userid == undefined ? peer_id = ctx.message.from_id : peer_id = sett.userid;

  ctx.reply('hello bro')

  setTimeout(function () {
    VK.request('messages.edit', {'peer_id' : peer_id, 'message_id' : msgid, 'message': message}, function(res) {
      console.log(res)
    })
  }, 5000);
}

exports.stt = function (ctx, user) {
  let vk_id = user.vk_id;
  let token = user.vk_token;
  VK.setToken(token);
  VK.request('status.get', {'user_id' : vk_id}, function(res) {
    console.log(res);
    VK.setToken(VK_API_TOKEN);
  })
}

exports.app_w = function (ctx) {
  let code = {
      "title": "Цитата дня",
      "title_url": "https://vk.com",
      "title_counter": 42,
      "more": "Читать все цитаты",
      "more_url": "https://vk.com",
      "text": "«Нам нужно гордиться»",
      "descr": "Дэвид Кэмерон о победе сторонников выхода страны\n из Евросоюза на референдуме"
  }
  code = JSON.stringify(code);
  // let full_code = `return ${code};`;
  // let full_code = `return {
  //       "title": "Цитата дня "+Args.uid,
  //       "title_url": "https://vk.com",
  //       "title_counter": 42,
  //       "more": "Читать все цитаты",
  //       "more_url": "https://vk.com",
  //       "text": "«Нам нужно гордиться»",
  //       "descr": "Дэвид Кэмерон о победе сторонников выхода страны из Евросоюза на референдуме"};`;
  let full_code = `return false;`;
  console.log(code);
  console.log('--------------');
  console.log(full_code);
  VK.setToken('eb829a6b8d0e9f97740fb4aefa4aa4e4b545979a0955727c552daeece2e29efef0e14b3e0fd47df7d4165');
  VK.request('appWidgets.update', {'code': full_code, 'type': 'text'}, function(res) {
    console.log(res);
    VK.setToken(VK_API_TOKEN);
  });
  //"eb829a6b8d0e9f97740fb4aefa4aa4e4b545979a0955727c552daeece2e29efef0e14b3e0fd47df7d4165"
}

exports.getUserMember = function (ctx, sett = {}) {
  let user_id;
  let group_id = VK_GROUP_ID;
  let extended;
  sett.userid == undefined ? user_id = ctx.message.from_id : user_id = sett.userid;
  sett.extended == undefined ? extended = 0 : extended = sett.extended;
  return new Promise(function(resolve, reject) {
    VK.request('groups.isMember', {'group_id': group_id, 'user_id': user_id, 'extended' : extended}, function(res) {
      let resp = res.response

      if (resp == 1) ctx.reply('Ты состоишь в группе')
      else ctx.reply('Ты не состоишь в группе')

      resolve(res)
    })
  })
}

exports.getUserMsgAllow = function (ctx, sett = {}) {
  let user_id;
  let group_id = VK_GROUP_ID;
  sett.userid == undefined ? user_id = ctx.message.from_id : user_id = sett.userid;
  return new Promise(function(resolve, reject) {
    VK.request('messages.isMessagesFromGroupAllowed', {'group_id': group_id, 'user_id': user_id}, function(res) {
      let resp = res.response.is_allowed

      if (resp == 1) ctx.reply('Сообщения разрешены')
      else ctx.reply('Сообщения запрещены')

      resolve(res)
    })
  })
}

exports.getDataBase = function (ctx, sett = {}) {
  VK.setToken(VK_SERVICE_KEY);
  sett.userid == undefined ? user_id = ctx.message.from_id : user_id = sett.userid;
  return new Promise(function(resolve, reject) {
    VK.request('database.getCountries', {}, function(res) {
      VK.setToken(VK_API_TOKEN);
      console.log(res)
      resolve(res)
    })
  })
}
exports.getEnv = function (ctx, sett = {}) {
  mainController.setContext(ctx, 'env').then(ctx.reply(`MODE: ${MODE}`))
}
exports.getIsLikedPost = function (ctx, sett = {}) {
  VK.setToken(VK_SERVICE_KEY);
  let user_id;
  let post_id;
  let group_id = VK_GROUP_ID;
  sett.userid == undefined ? user_id = ctx.message.from_id : user_id = sett.userid;
  post_id = sett.post_id || 4;
  return new Promise(function(resolve, reject) {
    VK.request('likes.getList', {owner_id: "-"+VK_GROUP_ID, type: 'post', item_id: post_id}, function(res) {
      VK.setToken(VK_API_TOKEN);
      console.log(`Пост с ID ${post_id}`)
      console.log(res)

      resolve(res)
    })
  })
}
exports.setActiveWriteMsg = function (ctx, sett = {}) {
  let user_id;
  let group_id = VK_GROUP_ID;
  sett.userid == undefined ? user_id = ctx.message.from_id : user_id = sett.userid;
  return new Promise(function(resolve, reject) {
    VK.request('messages.setActivity', {'user_id': user_id, type: 'typing'}, function(res) {
      let resp = res.response
      resolve(res)
    })
  })
}
exports.execute_command = function (ctx) {
  //let group_id = VK_GROUP_ID;
  let user_id = ctx.message.from_id;

  return new Promise((resolve, reject) => {
    let full_cmd = '';
    for (let i = 0; i < 2; i++) {
      let random_id = Faker.random.number();
      let r_text = `❗ Для продолжентя работы с нашим сервисом, необходимо согласиться с правилами! ${i}<br>`;

      let p_cmd = `API.messages.send({'user_id': ${user_id}, 'message': '${r_text}', 'random_id': ${random_id}, 'keyboard': null});`;
      full_cmd += p_cmd;
    }
    full_cmd += 'return;';
    console.log(full_cmd);
    VK.request('execute', {'code': full_cmd}, function(res) {
      console.log(res)
      resolve(res)
    });


  });
}
exports.setPayBtn = function (ctx, sett = {}) {
  let user_id;
  let random_id = Faker.random.number();
  let group_id = VK_GROUP_ID;
  let desc = "Add balance in account"; // Комментарий
  sett.userid == undefined ? user_id = ctx.message.from_id : user_id = sett.userid;
  keyboard = {
    "one_time": true,
    "buttons": [
      [{
          "action": {
            "type": 'vkpay',
            "hash": `action=pay-to-group&group_id=${group_id}&amount=1&description=`+desc
          }
      }]
    ]
  }
  keyboard = JSON.stringify(keyboard)
  console.log(keyboard)
  console.log(random_id)
  return new Promise(function(resolve, reject) {
    VK.request('messages.send', {'user_id': user_id, message: 'Оплата', 'random_id': random_id, keyboard: keyboard}, function(res) {
      let resp = res
      console.log(res)
      resolve(res)
    })
  })
}
