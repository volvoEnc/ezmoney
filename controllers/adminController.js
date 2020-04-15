const Config = require('../models/Config');
const Stock = require('../models/Stock');
const mainController = require('../controllers/mainController');
const view = require('../views/view');

const { VK_ID_ADMIN } = process.env;

const routes = ['tasks', 'config', 'bonus', 'stock.index', 'stock.change', 'index'];


exports.getapp = async () => {
  let hash = await mainController.getHash();

  let config_pass = await Config.findOne({sys_name: 'admin_pass'});
  config_pass.value = hash;
  await config_pass.save();

  view.admin__get_app_link(VK_ID_ADMIN, 'https://vk.com/app7177293#admin/index');
};


exports.loadpage = params => {
  return new Promise( async (resolve, reject) => {
    let { page, pass, vk_id } = params;
    let res = {};
    let adm_pass = (await Config.findOne({sys_name: 'admin_pass'}, 'value -_id')).value;
    let found_page = false;

    if (adm_pass != pass) {
      res['page'] = 'error';
      res['error_code'] = 403;
      res['error_msg'] = `Доступ запрещен`;
      resolve(res);
      return;
    }

    if (routes.indexOf(page) == -1) {
      res['page'] = 'error';
      res['error_code'] = 404;
      res['error_msg'] = `Страница не найдена`;
      resolve(res);
      return;
    }

    res['page'] = page;

    if(page == 'stock.index'){ res['data'] = await Stock.getAll(); }
    else if(page == 'stock.change'){
      if(params['uid'] != undefined) {
        res['data'] = await Stock.getById(params['uid']);
      }
    }

    resolve(res);
  });
};



exports.handler = params => {
  return new Promise(async (resolve, reject) => {
    let { name_func, pass } = params;
    let adm_pass = (await Config.findOne({sys_name: 'admin_pass'}, 'value -_id')).value;
    let found_func = ['create_stock', 'update_stock', 'delete_stock'];
    let send = {};

    if (adm_pass != pass) {
      send['status'] = 'error';
      send['error_code'] = 403;
      send['error_msg'] = `Доступ запрещен`;
      resolve(send);
      return;
    }
    else if (name_func == undefined || found_func.indexOf(name_func) == -1) {
      send['status'] = 'error';
      send['error_code'] = 404;
      send['error_msg'] = `Функция не найдена`;
      resolve(send);
      return;
    }


    if (name_func == 'create_stock') {
      send = await Stock.createNewStock(params);
    }
    else if (name_func == 'update_stock') {
      send = await Stock.updateStock(params);
    }
    else if (name_func == 'delete_stock') {
      send = await Stock.deleteStock(params);
    }
    resolve(send);
  });
};
