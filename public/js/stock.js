let stocks = [];
let uid_stock_selected;

function add_stock(){
  let cond_block = document.createElement("div");
  cond_block.classList.add('cond_block');
  let new_index = stocks.length;

  let innerHTML = `
  <input type="number" name="invoce" value="0" class="elem">
  <select name="type_b" class="elem">
    <option value="num" selected>₽</option>
    <option value="proc">%</option>
  </select>
  <input type="number" name="bonus" value="0" class="elem">
  <button type="button" class="elem delete_cond btn_stock" data-index="${new_index}" onclick="delete_stock(event)">
    <i class="close icon" data-index="${new_index}"></i>
  </button>
  `;

  cond_block.innerHTML = innerHTML;
  let pushObj = {
    'invoce' : 0,
    'bonus' : 0,
    'type_bonus' : 'num',
  }
  stocks.push(pushObj);
  $(".conditions").append(cond_block);
}

function delete_stock(e){
  let del_idx = $(e.target).attr('data-index');
  stocks.splice(del_idx, 1);

  $(".cond_block").each(function(index) {
    let idx = $(this).children('.delete_cond').attr('data-index');
    if (del_idx == idx) {
      $(this).remove();
    }
    else if (del_idx < idx) {
      $(this).children('.delete_cond').attr('data-index', (idx - 1));
      $(this).children('.delete_cond').children('i').attr('data-index', (idx - 1));
    }
  });
}

function init_stocks(send = false) {
  stocks = [];
  $(".cond_block").each(function(index) {
    let pushObj = {
      'invoce' : $(this).children('input[name=invoce]').val(),
      'bonus' : $(this).children('input[name=bonus]').val(),
      'type_bonus' : $(this).children('select[name=type_b]').val(),
    }
    stocks.push(pushObj);
  });
  console.log(stocks);
  if(send != false) {
    let send = $('.btn_stock.save').attr('data-type');
    let uid = $('.btn_stock.save').attr('data-uid');
    send_stocks(send, {'uid': uid});
  }
}

async function send_stocks(type, dop = {}) {
  let params = {
    name: $('input[name=name]').val(),
    descr: $('textarea[name=descr]').val(),
    status: $('select[name=status]').val(),
    data: JSON.stringify(stocks)
  }
  Object.assign(params, dop);
  let res = await handler(type, params);
  if (res.status == 'ok') {
    change_page('stock.index');
  }
  else {
    console.error(res);
    alert(`Ошибка: ${res.error_msg}`);
  }
}


function open_modal_stock (uid) {
  uid_stock_selected = uid;
  $('.modal.stock_modal')
  .modal({
    closable : false,
    onDeny   : () => {
      let del_uid = uid_stock_selected;
      uid_stock_selected = undefined;
      $('.modal.stock_modal .actions .button.ok').removeClass('loading');
      if (del_uid == undefined) {
        return false;
      }
    },
    onApprove: async () => {
      let del_uid = uid_stock_selected;
      uid_stock_selected = undefined;
      $('.modal.stock_modal .actions .button.ok').addClass('loading');
      if (del_uid != undefined) {
        // alert('удаляем: '+del_uid);
        let res = await handler('delete_stock', {uid: del_uid});
        if(res.status == 'ok') {
          msg_model_show('green', 'Удалено');
          change_page('stock.index');
        }
        else {
          alert(`Ошибка: ${res.error_msg}`)
        }
      }
    },
  })
  .modal('show');
}
