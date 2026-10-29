/* ============================================================
   VAIJAN — shop page: category filter, cart panel, order form.
   Requires common.js.
   ============================================================ */

/* ---- category filter ---- */
const chips = document.querySelectorAll('.chip[data-filter]');
const cards = document.querySelectorAll('.card[data-cat]');
chips.forEach(chip => chip.addEventListener('click', () => {
  chips.forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const f = chip.dataset.filter;
  cards.forEach(card => { card.style.display = (f === 'all' || card.dataset.cat === f) ? '' : 'none'; });
}));

/* ---- cart state ---- */
let cart = loadCart();
let cartMode = false;

function renderCart(){
  const box = $('cartBox');
  const t = priceCart(cart);
  $('cartFabCount').textContent = t.totalQty;
  $('cartFabSum').textContent = fmt(t.ptotal);
  $('cartFab').style.display = cart.length ? 'block' : 'none';
  if(!cart.length){ box.style.display = 'none'; if(cartMode){ cartMode = false; setFormMode(); } return; }
  box.style.display = 'block';
  $('cartRows').innerHTML = cart.map((it, i) => {
    const sizeCtl = it.p === 'BUNDLE'
      ? '<label style="font-size:12px;color:#b7b0a0">Size A <select data-ci="' + i + '" data-cf="s1">' + sizeOpts(it.s1) + '</select></label> <label style="font-size:12px;color:#b7b0a0">Size B <select data-ci="' + i + '" data-cf="s2">' + sizeOpts(it.s2) + '</select></label>'
      : '<label style="font-size:12px;color:#b7b0a0">Size <select data-ci="' + i + '" data-cf="s1">' + sizeOpts(it.s1) + '</select></label>';
    return '<div class="crow"><div class="cinfo"><b>' + PNAMES[it.p] + '</b><span>' + fmt(PRICES[it.p]) + ' each</span></div>'
      + '<div>' + sizeCtl + '</div>'
      + '<div class="cqty"><button type="button" data-ci="' + i + '" data-cq="-1">−</button><span>' + it.qty + '</span><button type="button" data-ci="' + i + '" data-cq="1">+</button></div>'
      + '<div class="cline">' + fmt(PRICES[it.p] * it.qty) + '</div>'
      + '<button type="button" class="crm" data-ci="' + i + '" data-crm="1" title="Remove">✕</button></div>';
  }).join('');
  $('cartTotal').textContent = fmt(t.ptotal);
  $('cartDiscRow').style.display = t.discount > 0 ? 'flex' : 'none';
  if(t.discount > 0) $('cartDisc').textContent = '−' + fmt(t.discount);
  box.querySelectorAll('select[data-ci]').forEach(sel => sel.addEventListener('change', () => { cart[+sel.dataset.ci][sel.dataset.cf] = sel.value; saveCart(cart); }));
  box.querySelectorAll('button[data-cq]').forEach(b => b.addEventListener('click', () => { const it = cart[+b.dataset.ci]; it.qty = Math.min(5, Math.max(1, it.qty + (+b.dataset.cq))); saveCart(cart); renderCart(); if(cartMode) upd(); }));
  box.querySelectorAll('button[data-crm]').forEach(b => b.addEventListener('click', () => { cart.splice(+b.dataset.ci, 1); saveCart(cart); renderCart(); if(cartMode) upd(); }));
}
function setFormMode(){
  ['cellProduct','cellQty','cellSize'].forEach(id => { const el = $(id); if(el) el.style.display = cartMode ? 'none' : ''; });
  $('cartModeNote').style.display = cartMode ? 'block' : 'none';
}

/* Order Now on a card → preselect in the single-order form */
document.querySelectorAll('[data-pick]').forEach(el => {
  el.addEventListener('click', () => { cartMode = false; setFormMode(); $('fProduct').value = el.dataset.pick; upd(); });
});
/* Add to Cart buttons */
document.querySelectorAll('[data-add]').forEach(el => {
  el.addEventListener('click', () => {
    const p = el.dataset.add;
    const ex = cart.find(it => it.p === p);
    if(ex){ if(ex.qty < 5) ex.qty++; } else { cart.push({ p, s1:'L', s2:'L', qty:1 }); }
    saveCart(cart); renderCart();
    const t = $('cartToast'); t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1400);
    window.dispatchEvent(new CustomEvent('cart:added'));
  });
});
$('cartFab').addEventListener('click', () => { window.open('cart.html', '_blank'); });
$('cartCheckout').addEventListener('click', () => { window.open('cart.html', '_blank'); });
$('exitCartMode').addEventListener('click', e => { e.preventDefault(); cartMode = false; setFormMode(); upd(); });
$('cartClear').addEventListener('click', () => { cart = []; saveCart(cart); renderCart(); upd(); });
renderCart();

/* ---- single / cart-mode order form ---- */
function calc(){
  const area = $('fArea').value;
  if(cartMode && cart.length){
    const t = priceCart(cart);
    const del = cartDelivery(t, area);
    return { p:'CART', q:t.totalQty, area, ptotal:t.ptotal, del, grand:t.ptotal + del };
  }
  const p = $('fProduct').value, q = parseInt($('fQty').value, 10);
  const ptotal = PRICES[p] * q;
  const del = singleDelivery(p, area, q);
  return { p, q, area, ptotal, del, grand: ptotal + del };
}
function upd(){
  const c = calc();
  $('size2Wrap').style.display = c.p === 'BUNDLE' ? '' : 'none';
  $('tProduct').textContent = fmt(c.ptotal);
  $('tDelivery').textContent = c.del === 0 ? 'FREE' : fmt(c.del);
  $('tGrand').textContent = fmt(c.grand);
}
['fProduct','fQty','fArea','fSize','fSize2'].forEach(id => $(id).addEventListener('change', upd));
upd();

function sizeText(c){
  return c.p === 'BUNDLE' ? ('A: ' + $('fSize').value + ' / B: ' + $('fSize2').value) : $('fSize').value;
}
$('fSubmit').addEventListener('click', () => {
  const name = $('fName').value.trim();
  const phone = $('fPhone').value.replace(/[\s-]/g, '');
  const addr = $('fAddr').value.trim();
  const note = $('fNote').value.trim();
  const err = $('fErr');
  if(!name || !phone || addr.length < 8){ err.textContent = 'Please fill in your name, mobile number and full address.'; err.style.display = 'block'; return; }
  if(!/^01[3-9]\d{8}$/.test(phone)){ err.textContent = 'Please give a valid mobile number (starts with 01, 11 digits).'; err.style.display = 'block'; return; }
  err.style.display = 'none';
  const c = calc();
  const oid = 'VJ' + Date.now().toString(36).toUpperCase();
  let prodText, sizeVal, qtyVal, subtotal, discount;
  if(cartMode && cart.length){
    const t = priceCart(cart);
    prodText = cart.map(it => PNAMES[it.p] + ' (' + (it.p === 'BUNDLE' ? 'A:' + it.s1 + ' / B:' + it.s2 : it.s1) + ') ×' + it.qty).join('; ');
    if(t.discount > 0) prodText += '; 🎁 Bundle Combo ×' + t.pairs + ' applied (−' + fmt(t.discount) + ')';
    sizeVal = '—'; qtyVal = c.q; subtotal = t.subtotal; discount = t.discount;
  } else { prodText = PNAMES[c.p]; sizeVal = sizeText(c); qtyVal = c.q; subtotal = c.ptotal; discount = 0; }
  const o = {
    id: oid, time: new Date().toLocaleString('en-GB'), name, phone, addr,
    area: AREAS[c.area], product: prodText, size: sizeVal, qty: qtyVal,
    subtotal, discount,
    productTotal: c.ptotal,
    delivery: c.del === 0 ? 'FREE' : c.del,
    grandTotal: c.grand,
    note
  };
  const url = drawReceipt(o);
  postOrder(o, url);
  if(cartMode){ cart = []; saveCart(cart); cartMode = false; renderCart(); setFormMode(); }
  $('receiptImg').src = url;
  const dl = $('receiptDl'); dl.href = url; dl.setAttribute('download', 'Vaijan_Receipt_' + oid + '.png');
  $('doneText').textContent = 'Order ID: ' + oid + ' — Thank you, ' + name.split(' ')[0] + '! Your order is confirmed in our order book. We will call ' + phone + ' shortly — no need to message anywhere. Save your receipt below.';
  $('formWrap').style.display = 'none';
  $('orderDone').style.display = 'block';
  $('orderDone').scrollIntoView({ behavior:'smooth', block:'center' });
});
