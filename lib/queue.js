const redis = require('redis');
const VkAPI = require('vksdk');
const router = require('../routes/ev_router');

const {VK_SERVICE_KEY, VK_GROUP_ID, VK_API_TOKEN, VK_APP_ID, VK_APP_SICRET} = process.env;
const VK_API_TOKENS = [
  '46af6da4e198a2923c341dbdfa832c35696ff74b5299a593f0687ef1e95e568d57f8968454323a7e29ad5',
  '1165a880c65b948cb9b824062856e4194c74b9982efa3fffbdaadc935739fa3000287859d55c2fd6d770c',
  'a01770559d780e2d9bd218bbc5f579369bb15b34034fe2c5d5e027d7e0f2038a04f71398e3633b0fd5f8c'
];

const VK = new VkAPI({
   'appId'     : VK_APP_ID,
   'appSecret' : VK_APP_SICRET,
   'language'  : 'ru',
   'secure'    :  true,
   'version'   : '5.103'
});
VK.setToken(VK_API_TOKEN);

class Queue {
  constructor() {
    let self = this;
    this.redis_cl = redis.createClient();
    this.redis_cl2 = redis.createClient();
    this.cursor = 0;
    this.c_token = 0;
    this.t_token = VK_API_TOKENS[0];

    this.redis_cl.on("error", function (err) {
      console.log("Error " + err);
    });
    this.redis_cl2.on("error", function (err) {
      console.log("Error " + err);
    });

    this.redis_cl.on("connect", function (err) {
      console.log(`Соединение с Redis установлено!`);
      self.redis_cl.flushall();
    });
    this.redis_cl2.on("connect", function (err) {
      console.log(`Соединение с Redis2 установлено!`);
      self.redis_cl2.flushall();
    });
  }

  check(vk_id){
    let self = this;
    return new Promise( (resolve, reject) => {
      self.redis_cl.select(0, () => {
        self.redis_cl.exists(vk_id, (err, res) => {
          if (err) reject(err);

          if (res === 1) reject();
          else resolve();
        });
      });
    });
  }

  add_spam_timeout(vk_id){
    let self = this;
    return new Promise((resolve, reject) => {
      self.redis_cl2.select(1, () => {
        self.redis_cl2.setex(vk_id, 15, "", (err) => {
          if (err) reject(err);
        });
      });
    });
  }

  spam_control(vk_id){
    let self = this;
    return new Promise((resolve, reject) => {
      self.redis_cl2.select(1, () => {
        self.redis_cl2.exists(vk_id, (err, res) => {
          if (err) reject(err);

          if(res === 1){
            reject();
          } else {
            self.redis_cl2.setex(vk_id, 1, "", (err) => {
              if (err) reject(err);
              resolve();
            });
          }
        });
      });
    });
  }

  setTask(vk_id, type = 'message.send', data){
    let self = this;
    let random_id = Number(Date.now() + "" + Math.random() * (999999 - 100000) + 100000);
    let n_vk_id = `${random_id}_${vk_id}`;
    let nn = n_vk_id.split('_');

    return new Promise(function(resolve, reject) {
      self.redis_cl.select(0, () => {
        self.redis_cl.hset(n_vk_id, "type", type);
        for (let key in data) {
          //console.log(key)
          self.redis_cl.hset(n_vk_id, key, data[key], (err) => {
            if (err) reject(err);

            resolve()
          });
        }
      });
    });
  }

  getTasks(){
    let self = this;
    return new Promise(function(resolve, reject) {
      self.redis_cl.select(0, () => {
        self.redis_cl.keys('*', (err, res) => {
          if (err) throw err;

          let count_tasks = res.length;
          resolve(count_tasks);
        });
      });
    });
  }

  sendTasks(count = 9){
    return new Promise((resolve, reject) => {
      this.redis_cl.select(0, () => {
        this.redis_cl.scan(this.cursor, 'COUNT', count, (err, res) => {
          if (err != null) throw err;

          this.cursor = res[0];
          let tasks = res[1];
          let count = tasks.length;
          let send_arr = [];
          tasks.forEach((value, i) => {
            let vk_id = value.split('_');
            vk_id = vk_id[1];
            this.redis_cl.hgetall(value, (err, res) => {
              if (err) throw err;
              try {
                res.vk_id = vk_id;
              } catch (e) {}
              send_arr[i] = res;
              this.redis_cl.del(value);

              if(i >= (count - 1)){
                this._preparation(send_arr)
                    .then(arr => {
                      resolve(arr);
                    })
                    .catch(() => {
                      reject();
                    });
              }
            });
          });
        });
      });
    });
  }

  _preparation(send_arr){
    return new Promise((resolve, reject) => {
      this.t_token = VK_API_TOKENS[this.c_token];
      VK.setToken(this.t_token);

      if (this.c_token < (VK_API_TOKENS.length - 1)) { this.c_token++ }
      else { this.c_token = 0 }

      let prepare_send_arr = 'var res_data = [];\n';
      send_arr.forEach((val, i) => {
        //console.log(val);
        if (val.type == 'message.send') {
          prepare_send_arr += this.get__message_send(val);
        }
        else if(val.type == 'utils.getShortLink'){
          prepare_send_arr += this.get__short_link(val);
        }
        else if(val.type == 'likes.isLiked'){
          prepare_send_arr += this.get__check_like(val);
        }
      });
      prepare_send_arr += `return res_data;`;
      //console.log(`package complite: ${send_arr.length}`);
      VK.request('execute', {'code': prepare_send_arr}, function(res) {
        //console.log(res)

        let response = res.response;
        if(response != undefined && response.length > 0){
          resolve(response);
        } else {
          reject();
        }
      });
    });
  }

  get__message_send(item) {
    let vk_id = item.vk_id;
    let msg = item.message;
    let random_id = Number(Date.now() + "" + Math.random() * (999999 - 100000) + 100000);
    let keyboard = item.keyboard || null;
    let attachment = item.attachment || null;
    let sticker_id = item.sticker_id || null;
    let dont_parse_links = item.dont_parse_links || 0;

    return `API.messages.send({'user_id': ${vk_id}, 'keyboard': ${keyboard}, 'message': '${msg}', 'random_id': ${random_id}, 'attachment': '${attachment}', 'dont_parse_links': ${dont_parse_links}});\n`;
  }

  get__short_link(item) {
    let vk_id = item.vk_id;
    let event_type = item.event_type;
    let link = item.link;
    let date = item.date || null;

    return `res_data.push({result: API.utils.getShortLink({'url': '${link}'}).short_url, vk_id: ${vk_id}, event_type: '${event_type}', date: '${date}'});\n`;
  }

  get__check_like(item) {
    let vk_id = item.vk_id;
    let event_type = item.event_type;
    let type_post = item.type_post;
    let type_operation = item.type_operation;
    let group_id = VK_GROUP_ID;
    let item_id = item.item_id;
    let prd_check = item.prd_check;
    let access_token = item.access_token;
    let date = item.date;

    return `res_data.push({result: API.likes.isLiked({'user_id': ${vk_id}, 'access_token': '${access_token}', 'type': '${type_post}', 'owner_id': -${group_id}, 'item_id': ${item_id}}), vk_id: ${vk_id}, event_type: '${event_type}', date: '${date}'});\n`;
  }

}

module.exports = new Queue();
