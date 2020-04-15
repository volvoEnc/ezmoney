const Config = require('../config');
const VkBot = require('../node_modules/node-vk-bot-api/lib');
const Markup = require('../node_modules/node-vk-bot-api/lib/markup');
const {VK_GROUP_ID, VK_API_TOKEN} = process.env;
const vkb = new VkBot({
  token: VK_API_TOKEN,
  group_id: VK_GROUP_ID,
  execute_timeout: 50, // in ms   (50 by default)
  polling_timeout: 25, // in secs (25 by default)
})

class vkbc {
  constructor() {
    this.vkbot = vkb
    this.markup = Markup
  }
}

module.exports = vkbc;
