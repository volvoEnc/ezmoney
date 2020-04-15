const VkBot = require('../lib/vkbotLib');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Post = require('../models/Post');

const vkapiController = require('../controllers/vkapiController');
const mainController = require('../controllers/mainController');

const view = require('../views/view');

const Bot = new VkBot();
const { VK_ID_ADMIN } = process.env;

exports.message_allow = function (ctx) {
  return new Promise(async (resolve, reject) => {
    let vk_id = ctx.message.user_id;

    let user = await User.findOne({vk_id: vk_id});
    if (user != undefined && user.status == false){
      user.status = true;
      await user.save();
      resolve();
    }
    resolve();
  });
}

exports.message_deny = function (ctx) {
  return new Promise(async (resolve, reject) => {
    let vk_id = ctx.message.user_id;

    let user = await User.findOne({vk_id: vk_id});
    if (user != undefined){
      user.status = false;
      await user.save();
      resolve();
    }
    resolve();
  });
}

exports.add_post = function (ctx) {
  return new Promise(async (resolve, reject) => {
    let text_post = ctx.message.text;
    let post_id = ctx.message.id;
    let post_arr = text_post.split('~|');

    let vid = post_arr[0];
    let add_money = post_arr[1];
    let add_expr = post_arr[2];
    let life_day = post_arr[3];

    if(life_day != undefined) {
      let life_time = Date.now() + (life_day * 24 * 60 * 60 * 1000);
      let new_post;
      if (vid == 1) {
        new_post = new Post({
            life_time: life_time,
            post_id: post_id,
            like: {
              check: true,
              money: add_money,
              expr: add_expr
            }
        });
      }
      else if (vid == 2) {
        new_post = new Post({
            life_time: life_time,
            post_id: post_id,
            repost: {
              check: true,
              money: add_money,
              expr: add_expr
            }
        });
      }

      await new_post.save();


    } else {
      console.log('Просто пост');
    }

    resolve();
  });
}
