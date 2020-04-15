const Mongoose = require("mongoose");
const Chalk = require('chalk');
const Validate = require('validate.js');
const Moment = require('moment');
const BASE64 = require('base-64');
const Express = require('express');
const Eapp = Express();
const { config, engine } = require('express-edge');

const {PORT, VK_ID_ADMIN, MONGODB_USERNAME, MONGODB_PASS} = process.env;

const VkBot = require('./lib/vkbotLib');
const Queue = require('./lib/queue');

const mainRouter = require('./routes/router');

const mainController = require('./controllers/mainController');
const eventController = require('./controllers/eventController');
const userController = require('./controllers/userController');
const notificationsController = require('./controllers/notificationsController');
const appController = require('./controllers/appController');
const adminController = require('./controllers/adminController');
const paymentController = require('./controllers/paymentController');

const Config = require('./models/Config');

const Bot = new VkBot();

Moment.locale('ru');
Mongoose.connect('mongodb://localhost:27017/ezmoney', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: 'admin',
  pass: 'XnrhttpEques2002',
  authSource: 'admin'
});
const DB = Mongoose.connection;
DB.on('error', console.error.bind(console, 'connection error:'));
DB.once('open', function() {
  console.log(Chalk.bgGreen.bold('Соединение с MongoDB установлено!'))
});

Bot.vkbot.on(ctx => {
  let d_start = Date.now();
  let user;
  let context;
  let accepted_rules = false;
  let vk_id = ctx.message.from_id;

  Queue.spam_control(vk_id)
  .then(() => Queue.check(vk_id))
  .then(() => mainController.getUser(ctx))
  .then(res_user => {
    user = res_user;
    context = user.contexts;
    return mainController.getAccepted(ctx, user);
  })
  .then(accepted => {
    accepted_rules = accepted;
    return mainController.getCommand(ctx);
  })
  .then(command_bot => {
    // return;
    mainRouter.command(ctx, command_bot, user, accepted_rules, d_start, context);
  })
  .catch(err => {
    if (err) console.log(err);
    //console.error(err);
  })
});

let sender_worker = setInterval(() => {
  Queue.sendTasks()
       .then(arr => {
          arr.forEach((val, i) => {
            if (val.event_type == 'confirm_acc') userController.test2(val.vk_id, val.result);
            else if (val.event_type == 'get_bonus_link') userController.view_link(val.vk_id, val.result);
            else if (val.event_type == 'get_payment_link') userController.view_payment_link(val.vk_id, val.result, val.date);
            // else if (val.event_type == 'handling_user_task') userController.handlerCheckUsersTasks(val.vk_id, val.result, val.date);
            else if (val.event_type == 'handling_user_task') console.log(val);
          });
        })
       .catch();
}, 100);

let pay_ccc = 0;

let notifications_worker = setInterval(() => {
  pay_ccc++;
  if (pay_ccc >= 10){
    pay_ccc = 0;
  }
  userController.payment_add();
  notificationsController.checkBonus();
  userController.checkTasks();
}, 60000);



Bot.vkbot.event('message_allow', (ctx) => eventController.message_allow(ctx));
Bot.vkbot.event('message_deny', (ctx) => eventController.message_deny(ctx));
Bot.vkbot.event('vkpay_transaction', (ctx) => paymentController.pay_vkpay(ctx));
Bot.vkbot.event('wall_post_new', (ctx) => eventController.add_post(ctx));

Bot.vkbot.startPolling(() => {
  console.log(Chalk.bgGreen.bold('VK Bot запущен!'));
});


Eapp.use('/static', Express.static('public'));
Eapp.use(engine);
Eapp.use(Express.urlencoded({ extended: true }));
Eapp.set('views', `${__dirname}/appPage`);




Eapp.post('/app', async (req, res) => {
  let route = req.body.route;
  let vk_id = req.body.vk_id;
  let resp = await appController.appRouter(route, vk_id);
  res.json(resp);
});
Eapp.post('/app/admin/loader', async (req, res) => {
  let params = req.body;
  let result = await adminController.loadpage(params); // array
  res.render(result['page'], result);
});
Eapp.post('/app/admin/handler', async (req, res) => {
  let params = req.body;
  let result = await adminController.handler(params); // array
  res.json(result);
});
Eapp.all('/qiwi', async (req, res) => {
  console.log(req);
  console.log('Пришел платеж 2');
  res.send('ok');
});
Eapp.get('/confirm', function(req, res) {
  let token = req.query.code;
  let date = req.query.state;
  userController.addTokenUser(token, date);
  // res.redirect('https://vk.com/ezmoneybots');
  res.sendFile(__dirname + '/page/bonus1/index.html');
});
Eapp.get('/bonus/:type/:vk_id/:hash', function(req, res) {
  let type = req.params.type;
  let vk_id = req.params.vk_id;
  let hash = req.params.hash;
  userController.checkHashLink(vk_id, hash, type);
  //res.redirect(303, 'https://vk.com/ezmoneybots');
  res.sendFile(__dirname + '/page/bonus1/index.html');
});
Eapp.get('/redirect/:link', function(req, res) {
  let enc = BASE64.decode(req.params.link);
  res.redirect(303, enc);
});
Eapp.get('/ping', async function(req, res) {
  let tasks = await Queue.getTasks() + 1;
  let taskss = tasks - 1;
  let ping = Math.ceil(tasks / 10) * 100;
  res.send(`Задержка: ${ping} ms <br> Ожидают: ${taskss} запросов.`);
});
Eapp.post('/api/add_lvl', async function(req, res) {
  // mainController.add_lvl_db(req.body).then((st) => {
  //   res.send(st);
  // });
  res.send('Ай ай ай!');
});


Eapp.all('/pay/result', function(req, res) {
  let data = req.body;
  paymentController.handlerPaymentRobokassa(data).then(inv => {
    res.send(`OK${inv}`);
  });
});
Eapp.all('/pay/success', function(req, res) {
  res.redirect(303, 'https://vk.com/page-187786454_54537323');
});
Eapp.all('/pay/fail', function(req, res) {
  let data = req.body;
  userController.errorPaymentRobokassa(data).then(() => {
    res.redirect(303, 'https://vk.com/page-187786454_54537322');
  });
});
Eapp.get('/test/', function(req, res) {
  res.jsonp({message: 'OK', method: 'ojj'})
});
Eapp.all('/pay/*', function(req, res) {
  res.status(403).json({error: 'Forribien', method: 'undifined method'})
});

// Eapp.get('/three', function(req, res) {
//   res.sendFile(__dirname + '/page/bonus1/three.js');
// });
Eapp.all('/push', async (req, res) => {
  console.log(req.query);
  res.send(`OK`);
});
Eapp.get('/', async (req, res) => {
  let uid = req.query.vk_user_id;
  let params = {};
  if (uid == VK_ID_ADMIN) {
    pass = await Config.findOne({sys_name: 'admin_pass'}, 'value -_id');
    params['code'] = pass.value;
  }
  res.render('vkminiapps', params);
});






Eapp.listen(PORT, function () {
  console.log(`HTTP сервер запущен на ${PORT} порту!`);
});
