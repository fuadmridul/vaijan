/* ============================================================
   VAIJAN — cart page: full cart review + checkout.
   Requires common.js.
   ============================================================ */
let cart = loadCart();

function render(){
  const empty = !cart.length;
  $('cartMain').style.display = empty ? 'none' : '';
  $('cartEmpty').style.display = empty ? 'block' : 'none';
  if(empty) return;
  $('cartRows').innerHTML = cart.map((it, i) => {
    const sizeCtl = it.p === 'BUNDLE'
      ? '<label style="font-size:12px;color:#b7b0a0">Size A <select data-ci="' + i + '" data-cf="s1">' + sizeOpts(it.s1) + '</select></label> <label style="font-size:12px;color:#b7b0a0">Size B <select data-ci="' + i + '" data-cf="s2">' + sizeOpts(it.s2) + '</select></label>'
      : '<label style="font-size:12px;color:#b7b0a0">Size <select data-ci="' + i + '" data-cf="s1">' + sizeOpts(it.s1) + '</select></label>';
    return '<div class="crow"><img class="thumb" src="' + PIMG[it.p] + '" alt="">'
      + '<div class="cinfo"><b>' + PNAMES[it.p] + '</b><span>' + fmt(PRICES[it.p]) + ' each</span></div>'
      + '<div>' + sizeCtl + '</div>'
      + '<div class="cqty"><button type="button" data-ci="' + i + '" data-cq="-1">−</button><span>' + it.qty + '</span><button type="button" data-ci="' + i + '" data-cq="1">+</button></div>'
      + '<div class="cline">' + fmt(PRICES[it.p] * it.qty) + '</div>'
      + '<button type="button" class="crm" data-ci="' + i + '" data-crm="1" title="Remove">✕</button></div>';
  }).join('');
  $('cartRows').querySelectorAll('select[data-ci]').forEach(sel => sel.addEventListener('change', () => { cart[+sel.dataset.ci][sel.dataset.cf] = sel.value; saveCart(cart); }));
  $('cartRows').querySelectorAll('button[data-cq]').forEach(b => b.addEventListener('click', () => { const it = cart[+b.dataset.ci]; it.qty = Math.min(5, Math.max(1, it.qty + (+b.dataset.cq))); saveCart(cart); render(); }));
  $('cartRows').querySelectorAll('button[data-crm]').forEach(b => b.addEventListener('click', () => { cart.splice(+b.dataset.ci, 1); saveCart(cart); render(); }));
  updTotals();
}
function updTotals(){
  const t = priceCart(cart);
  const del = cartDelivery(t, $('fArea').value);
  $('tSub').textContent = fmt(t.subtotal);
  $('discRow').style.display = t.discount > 0 ? '' : 'none';
  if(t.discount > 0) $('tDisc').textContent = '−' + fmt(t.discount);
  $('tProduct').textContent = fmt(t.ptotal);
  $('tDelivery').textContent = del === 0 ? 'FREE' : fmt(del);
  $('tGrand').textContent = fmt(t.ptotal + del);
}
$('fArea').addEventListener('change', updTotals);
$('clearBtn').addEventListener('click', () => { cart = []; saveCart(cart); render(); });
render();

$('fSubmit').addEventListener('click', () => {
  const name = $('fName').value.trim();
  const phone = $('fPhone').value.replace(/[\s-]/g, '');
  const addr = $('fAddr').value.trim();
  const note = $('fNote').value.trim();
  const err = $('fErr');
  if(!cart.length){ err.textContent = 'Your cart is empty.'; err.style.display = 'block'; return; }
  if(!name || !phone || addr.length < 8){ err.textContent = 'Please fill in your name, mobile number and full address.'; err.style.display = 'block'; return; }
  if(!/^01[3-9]\d{8}$/.test(phone)){ err.textContent = 'Please give a valid mobile number (starts with 01, 11 digits).'; err.style.display = 'block'; return; }
  err.style.display = 'none';
  const t = priceCart(cart);
  const area = $('fArea').value;
  const del = cartDelivery(t, area);
  const oid = 'VJ' + Date.now().toString(36).toUpperCase();
  let prodText = cart.map(it => PNAMES[it.p] + ' (' + (it.p === 'BUNDLE' ? 'A:' + it.s1 + ' / B:' + it.s2 : it.s1) + ') ×' + it.qty).join('; ');
  if(t.discount > 0) prodText += '; 🎁 Bundle Combo ×' + t.pairs + ' applied (−' + fmt(t.discount) + ')';
  const o = {
    id: oid, time: new Date().toLocaleString('en-GB'), name, phone, addr,
    area: AREAS[area], product: prodText, size: '—', qty: t.totalQty,
    subtotal: t.subtotal, discount: t.discount,
    productTotal: t.ptotal,
    delivery: del === 0 ? 'FREE' : del,
    grandTotal: t.ptotal + del,
    note
  };
  const receiptUrl = drawReceipt(o);
  postOrder(o, receiptUrl);
  cart = []; saveCart(cart);
  $('receiptImg').src = receiptUrl;
  const dl = $('receiptDl'); dl.href = receiptUrl; dl.setAttribute('download', 'Vaijan_Receipt_' + oid + '.png');
  $('doneText').textContent = 'Order ID: ' + oid + ' — Thank you, ' + name.split(' ')[0] + '! Your order is confirmed in our order book. We will call ' + phone + ' shortly — no need to message anywhere. Save your receipt below.';
  $('cartMain').style.display = 'none';
  $('cartEmpty').style.display = 'none';
  $('orderDone').style.display = 'block';
  $('orderDone').scrollIntoView({ behavior:'smooth', block:'center' });
});
