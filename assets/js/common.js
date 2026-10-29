/* ============================================================
   VAIJAN — shared logic: catalogue, cart maths, receipt.
   Used by index.html (shop.js) and cart.html (cart-page.js).
   ============================================================ */
const ORDER_LOG_URL = 'https://script.google.com/macros/s/AKfycbzIH-h0Y_36mRN-ehYNSSN1IVvCawk4HRx8_L2unYIQTRc6N2V_AlXbqm4UAfjuY2GUUg/exec';

const PRICES = { A:750, B:750, BUNDLE:1300, AW1:450, AW2:450, AW3:450, AW4:450, AW5:450, AW7:450 };
const PNAMES = { A:'Design A — Kalima Calligraphy Hoodie', B:'Design B — Only Trust Allah Hoodie', BUNDLE:'Winter Bundle — Design A + Design B',
  AW1:'Acid Wash Tee — One Piece / Jolly Roger', AW2:'Acid Wash Tee — LIVE YOUR LIFE Forest', AW3:'Acid Wash Tee — Kakashi',
  AW4:'Acid Wash Tee — Spider-Man', AW5:'Acid Wash Tee — Zulfiqar Sword',
  AW7:'Acid Wash Tee — ALPHA INSTINCT Tiger' };
const PIMG = { A:'images/hoodie-a.jpg', B:'images/hoodie-b.jpg', BUNDLE:'images/winter-poster.png',
  AW1:'images/acid-1.jpg', AW2:'images/acid-2.jpg', AW3:'images/acid-3.jpg', AW4:'images/acid-4.jpg', AW5:'images/acid-5.jpg', AW7:'images/acid-7.jpg' };
const AREAS  = { khulna:'Inside Khulna', dhaka:'Dhaka City', other:'Other District' };

const $ = id => document.getElementById(id);
function fmt(n){ return '৳' + n.toLocaleString('en-IN'); }
function sizeOpts(sel){ return ['M','L','XL','XXL'].map(s => '<option' + (s === sel ? ' selected' : '') + '>' + s + '</option>').join(''); }

/* ---- cart storage (key kept from v1 so saved carts survive) ---- */
function loadCart(){
  try { return JSON.parse(localStorage.getItem('vaijan_cart') || '[]').filter(it => PRICES[it.p]); }
  catch(e){ return []; }
}
function saveCart(cart){ try { localStorage.setItem('vaijan_cart', JSON.stringify(cart)); } catch(e){} }

/* ---- cart maths ---- */
function priceCart(cart){
  let subtotal = 0, totalQty = 0, awQty = 0, hasBundle = false, qtyA = 0, qtyB = 0;
  cart.forEach(it => {
    subtotal += PRICES[it.p] * it.qty;
    totalQty += it.qty;
    if(it.p.indexOf('AW') === 0) awQty += it.qty;
    if(it.p === 'BUNDLE') hasBundle = true;
    if(it.p === 'A') qtyA += it.qty;
    if(it.p === 'B') qtyB += it.qty;
  });
  /* Combo match: Design A + Design B together = Winter Bundle (1300 instead of 1500) → 200 off per pair */
  const pairs = Math.min(qtyA, qtyB);
  const discount = pairs * 200;
  if(pairs > 0) hasBundle = true;
  return { subtotal, discount, pairs, ptotal: subtotal - discount, totalQty, awQty, hasBundle };
}
function cartDelivery(t, area){
  if(t.hasBundle || t.awQty >= 2) return 0; /* bundle orders + any 2 acid wash tees: FREE delivery */
  const base = area === 'khulna' ? 60 : area === 'dhaka' ? 115 : 135;
  return base + 20 * (t.totalQty - 1);
}
function singleDelivery(product, area, qty){
  if(product === 'BUNDLE') return 0;
  if(product.indexOf('AW') === 0 && qty >= 2) return 0;
  const base = area === 'khulna' ? 60 : area === 'dhaka' ? 115 : 135;
  return base + 20 * (qty - 1);
}

/* ---- receipt image (black & gold, canvas) ---- */
const logoImg = new Image(); logoImg.src = 'images/logo.jpg';
function wrapC(x, text, maxW){
  const words = String(text).split(' '); const lines = []; let line = '';
  for(const w of words){ const t = line ? line + ' ' + w : w; if(x.measureText(t).width > maxW && line){ lines.push(line); line = w; } else line = t; }
  if(line) lines.push(line); return lines.length ? lines : [''];
}
function drawReceipt(o){
  const W = 880, M = 54; const c = document.createElement('canvas');
  const x = c.getContext('2d');
  x.font = "500 25px Manrope, sans-serif";
  const addrLines = wrapC(x, o.addr, W - 2 * M - 130);
  const prodLines = wrapC(x, o.product, W - 2 * M - 130);
  const H = 806 + addrLines.length * 34 + (prodLines.length - 1) * 34 + (o.note ? 40 : 0) + (o.discount ? 78 : 0);
  c.width = W; c.height = H;
  x.fillStyle = '#0a0a0b'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#c9a86a'; x.lineWidth = 3; x.strokeRect(10, 10, W - 20, H - 20);
  x.textAlign = 'center';
  if(logoImg.complete && logoImg.naturalWidth){
    x.save();
    x.beginPath(); x.arc(W / 2, 92, 54, 0, 7); x.clip();
    x.fillStyle = '#ffffff'; x.fillRect(W / 2 - 54, 38, 108, 108);
    x.drawImage(logoImg, W / 2 - 54, 38, 108, 108);
    x.restore();
    x.strokeStyle = '#c9a86a'; x.lineWidth = 3;
    x.beginPath(); x.arc(W / 2, 92, 54, 0, 7); x.stroke();
  }
  x.fillStyle = '#c9a86a'; x.font = "700 54px Cinzel, serif";
  x.fillText('V A I J A N', W / 2, 200);
  x.fillStyle = '#b7b0a0'; x.font = "600 17px Manrope, sans-serif";
  x.fillText('T H E   N A M E  •  T H E   L O O K  •  T H E   L E G A C Y', W / 2, 234);
  x.fillStyle = '#f4efe6'; x.font = "800 27px Manrope, sans-serif";
  x.fillText('ORDER RECEIPT', W / 2, 278);
  x.fillStyle = '#c9a86a'; x.fillRect(M, 298, W - 2 * M, 2);
  x.textAlign = 'left';
  let y = 346;
  const row = (k, v, bold) => {
    x.fillStyle = '#b7b0a0'; x.font = "600 22px Manrope, sans-serif"; x.fillText(k, M, y);
    x.fillStyle = '#f4efe6'; x.font = (bold ? "800" : "600") + " 24px Manrope, sans-serif"; x.fillText(v, M + 170, y);
    y += 40;
  };
  row('Order ID', o.id, true);
  row('Date', o.time);
  row('Name', o.name);
  row('Mobile', o.phone);
  x.fillStyle = '#b7b0a0'; x.font = "600 22px Manrope, sans-serif"; x.fillText('Address', M, y);
  x.fillStyle = '#f4efe6'; x.font = "600 23px Manrope, sans-serif";
  addrLines.forEach(ln => { x.fillText(ln, M + 170, y); y += 34; });
  y += 8;
  row('Area', o.area);
  x.fillStyle = '#b7b0a0'; x.font = "600 22px Manrope, sans-serif"; x.fillText('Product', M, y);
  x.fillStyle = '#f4efe6'; x.font = "600 23px Manrope, sans-serif";
  prodLines.forEach(ln => { x.fillText(ln, M + 170, y); y += 34; });
  y += 8;
  row('Size / Qty', o.size + '  ×  ' + o.qty);
  if(o.note){ row('Note', o.note.length > 30 ? o.note.slice(0, 30) + '…' : o.note); }
  y += 4;
  x.fillStyle = '#c9a86a'; x.fillRect(M, y, W - 2 * M, 2); y += 44;
  const trow = (k, v) => {
    x.fillStyle = '#b7b0a0'; x.font = "600 23px Manrope, sans-serif"; x.fillText(k, M, y);
    x.fillStyle = '#f4efe6'; x.font = "700 24px Manrope, sans-serif"; x.textAlign = 'right'; x.fillText(v, W - M, y); x.textAlign = 'left'; y += 38;
  };
  if(o.discount){
    trow('Subtotal', fmt(o.subtotal));
    x.fillStyle = '#b7b0a0'; x.font = "600 23px Manrope, sans-serif"; x.fillText('Combo discount', M, y);
    x.fillStyle = '#e6cd8f'; x.font = "700 24px Manrope, sans-serif"; x.textAlign = 'right'; x.fillText('−' + fmt(o.discount), W - M, y); x.textAlign = 'left'; y += 38;
  }
  trow('Product total', fmt(o.productTotal));
  trow('Delivery', typeof o.delivery === 'string' ? o.delivery : fmt(o.delivery));
  x.fillStyle = '#c9a86a'; x.font = "800 29px Manrope, sans-serif";
  x.fillText('TOTAL (COD)', M, y);
  x.textAlign = 'right'; x.fillText(typeof o.grandTotal === 'number' ? fmt(o.grandTotal) : String(o.grandTotal), W - M, y); x.textAlign = 'left';
  y += 54;
  x.textAlign = 'center';
  x.fillStyle = '#b7b0a0'; x.font = "600 19px Manrope, sans-serif";
  x.fillText('Please check the product in front of the delivery rider.', W / 2, y); y += 30;
  x.fillStyle = '#e6cd8f';
  x.fillText('Thank you for shopping with VAIJAN — WhatsApp 01569-177407', W / 2, y);
  x.textAlign = 'left';
  return c.toDataURL('image/png');
}

/* ---- send order (+ receipt copy) to the Google Sheet database ---- */
function postOrder(o, receiptUrl){
  try { const all = JSON.parse(localStorage.getItem('vaijan_orders') || '[]'); all.push(o); localStorage.setItem('vaijan_orders', JSON.stringify(all)); } catch(e){}
  if(ORDER_LOG_URL){
    const payload = Object.assign({}, o, { receipt: receiptUrl });
    fetch(ORDER_LOG_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body: JSON.stringify(payload) }).catch(()=>{});
  }
}
