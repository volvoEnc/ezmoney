const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;

var StockSchema = new Schema({
  uid: Number,
  name: String,
  descr: String,
  status: {
    type: Boolean,
    default: false
  },
  data: Schema.Types.Mixed
},
{
  collection: 'Stock'
});

StockSchema.static('getActive', function() {
  return new Promise(async (resolve, reject) => {
    let res = await this.find({status: true});
    resolve(res);
  });
});
StockSchema.static('getAll', function() {
  return new Promise(async (resolve, reject) => {
    let res = await this.find().sort('-uid');
    resolve(res);
  });
});
StockSchema.static('getById', function(uid) {
  return new Promise(async (resolve, reject) => {
    let res = await this.findOne({uid: uid});
    resolve(res);
  });
});
StockSchema.static('deleteStock', function(params) {
  return new Promise(async (resolve, reject) => {
    if (params['uid'] == undefined || params['uid'] == '') {
      resolve({'status': 'error', 'error_msg':'Не передан UID'});
      return;
    }

    let stock_el = await this.findOne({uid: params['uid']});
    if (stock_el == undefined) {
      resolve({'status': 'error', 'error_msg':'Акция не найдена.'});
      return;
    }

    stock_el.remove()
    .then(() => {
      let send = {'status': 'ok'}
      resolve(send);
    })
    .catch(err => {
      resolve({'status': 'error', 'error_msg': err});
      return;
    });
  });
});
StockSchema.static('createNewStock', function(params) {
  return new Promise(async (resolve, reject) => {
    if (params['name'] == undefined || params['name'] == '') {
      resolve({'status': 'error', 'error_msg':'Нет названия'});
      return;
    }
    else if (params['descr'] == undefined || params['descr'] == '') {
      resolve({'status': 'error', 'error_msg':'Нет описания'});
      return;
    }
    else if (params['data'] == undefined || params['data'].length <= 2) {
      resolve({'status': 'error', 'error_msg':'Нет условий'});
      return;
    }

    if(params['status'] == 1) { params['status'] = true; }
    else { params['status'] = false; }

    params['data'] = JSON.parse(params['data']);
    let uid = await this.estimatedDocumentCount();
    params['uid'] = uid + 1;
    let newStock = new Stock(params);
    await newStock.save();
    let send = {'status': 'ok'}
    resolve(send);
  });
});
StockSchema.static('updateStock', function(params) {
  return new Promise(async (resolve, reject) => {
    if (params['name'] == undefined || params['name'] == '') {
      resolve({'status': 'error', 'error_msg':'Нет названия.'});
      return;
    }
    else if (params['descr'] == undefined || params['descr'] == '') {
      resolve({'status': 'error', 'error_msg':'Нет описания.'});
      return;
    }
    else if (params['data'] == undefined || params['data'].length <= 2) {
      resolve({'status': 'error', 'error_msg':'Нет условий.'});
      return;
    }
    params['data'] = JSON.parse(params['data']);


    let stock_el = await this.findOne({uid: params['uid']});
    if (stock_el == undefined) {
      resolve({'status': 'error', 'error_msg':'Акция не найдена.'});
      return;
    }

    stock_el.name = params['name'];
    stock_el.descr = params['descr'];
    stock_el.status = params['status'];
    stock_el.data = params['data'];

    await stock_el.save();
    let send = {'status': 'ok'}
    resolve(send);
  });
});

let Stock = Mongoose.model('Stock', StockSchema);



module.exports = Stock;
