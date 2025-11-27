/* Doremi Cake — frontend single script
   - localStorage keys:
     - 'doremi_products' : products array
     - 'doremi_cart' : cart items [{id, qty}]
     - 'userData' : logged in user {name,email,phone?,addr?,role}
     - 'doremi_orders' : orders array
*/

/* Configuration */
const ADMIN_ACCOUNTS = [{email:'admin@doremicake.com', pass:'Admin123'}];
const SHOP_WA = '6281234567890'; // ganti sesuai toko

/* Default products */
const DEFAULT_PRODUCTS = [
  {id:1, name:'Velvet Rose Cake', category:'kue', price:125000, desc:'Red velvet with cream cheese', img: 'images/cake1.jpeg', popular:95},
  {id:2, name:'Choco Chip Cookies', category:'cookies', price:35000, desc:'Crunchy outside, chewy inside', img:'images/cookies1.jpeg', popular:80},
  {id:3, name:'Hazelnut Brownie', category:'brownies', price:45000, desc:'Rich chocolate with hazelnut', img:"images/brownies1.jpeg", popular:88},
  {id:4, name:'Butter Croissant', category:'pastry', price:28000, desc:'Flaky buttery layers', img:'images/pastry1.jpeg', popular:70},
];

/* ---------- Storage helpers ---------- */
function initProducts(){
  if(!localStorage.getItem('doremi_products')){
    localStorage.setItem('doremi_products', JSON.stringify(DEFAULT_PRODUCTS));
  }
}
function getProducts(){ return JSON.parse(localStorage.getItem('doremi_products') || '[]'); }
function saveProducts(arr){ localStorage.setItem('doremi_products', JSON.stringify(arr)); }

function getCart(){ return JSON.parse(localStorage.getItem('doremi_cart') || '[]'); }
function saveCart(c){ localStorage.setItem('doremi_cart', JSON.stringify(c)); updateCartCount(); }

function getOrders(){ return JSON.parse(localStorage.getItem('doremi_orders') || '[]'); }
function saveOrders(o){ localStorage.setItem('doremi_orders', JSON.stringify(o)); }

/* ---------- UI helpers ---------- */
function showModal(id){ document.getElementById(id).style.display = 'flex'; document.getElementById(id).setAttribute('aria-hidden','false'); }
function hideModal(id){ document.getElementById(id).style.display = 'none'; document.getElementById(id).setAttribute('aria-hidden','true'); }

/* ---------- Login / Signup (index.html) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initProducts();
  updateCartCount();
  // Landing modals forms
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPass').value.trim();
      // check admin
      const isAdmin = ADMIN_ACCOUNTS.some(a => a.email === email && a.pass === pass);
      if(isAdmin){
        const user = {name:'Admin', email, role:'admin'};
        localStorage.setItem('userData', JSON.stringify(user));
        alert('Login admin berhasil');
        location.href = 'home.html';
        return;
      }
      // check regular user stored as user_{email}
      const stored = JSON.parse(localStorage.getItem('user_' + email) || 'null');
      if(stored && stored.pass === pass){
        const user = {name: stored.name, email, role:'user', phone:stored.phone||'', addr:stored.addr||''};
        localStorage.setItem('userData', JSON.stringify(user));
        alert('Login berhasil');
        location.href = 'home.html';
      } else {
        alert('Akun tidak ditemukan atau password salah.');
      }
    });
  }
  if(signupForm){
    signupForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const pass = document.getElementById('signupPass').value.trim();
      if(!name||!email||!pass){ alert('Isi semua data'); return; }
      localStorage.setItem('user_' + email, JSON.stringify({name, pass}));
      const user = {name, email, role:'user'};
      localStorage.setItem('userData', JSON.stringify(user));
      alert('Akun dibuat dan login');
      location.href = 'home.html';
    });
  }

  // If on home page, render products
  if(document.getElementById('productsGrid')){
    renderHomeInit();
  }

  // If on cart page, render cart
  if(document.getElementById('cartItems')){
    renderCartPage();
  }

  // If on profile page, render profile
  if(document.getElementById('profileName')){
    renderProfile();
  }

  // If on admin page, handle admin UI
  if(document.getElementById('adminLoginBlock')){
    // admin login handled by adminLoginAction called by button
  }

  // checkout form handler
  const checkoutForm = document.getElementById('checkoutForm');
  if(checkoutForm){
    checkoutForm.addEventListener('submit', function(e){
      e.preventDefault();
      const fd = new FormData(checkoutForm);
      const obj = Object.fromEntries(fd.entries());
      handleCheckout(obj);
    });
  }

  // modal close when click outside
  document.querySelectorAll('.modal').forEach(m=>{
    m.addEventListener('click', (ev)=>{
      if(ev.target === m) m.style.display='none';
    });
  });

  // hamburger toggle
  const hb = document.getElementById('hamburgerBtn');
  const panel = document.getElementById('shortcutPanel');
  if(hb && panel){
    hb.addEventListener('click', ()=>{
      const is = panel.getAttribute('aria-hidden')==='false';
      panel.setAttribute('aria-hidden', is ? 'true' : 'false');
      panel.style.display = is ? 'none' : 'flex';
    });
  }
});

/* ---------- Home rendering & interactions ---------- */
function renderHomeInit(){
  initProducts();
  const cats = ['All','kue','cookies','brownies','pastry'];
  const catCont = document.getElementById('categories');
  cats.forEach(c=>{
    const b = document.createElement('button');
    b.className = 'cat-btn';
    b.innerText = (c==='All'? 'All' : (c.charAt(0).toUpperCase()+c.slice(1)));
    b.onclick = ()=>{ document.querySelectorAll('.cat-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderProducts(c); }
    if(c==='All') b.classList.add('active');
    catCont.appendChild(b);
  });

  document.getElementById('sortSelect').addEventListener('change', ()=> renderProducts(document.querySelector('.cat-btn.active').innerText));
  document.getElementById('searchInput')?.addEventListener('input', (e)=> {
    const q = e.target.value.toLowerCase();
    const prods = getProducts().filter(p=>p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q));
    renderProductsList(prods);
  });

  renderProducts('All');
}

function renderProducts(filter='All'){
  let prods = getProducts();
  if(filter && filter!=='All') prods = prods.filter(p=>p.category===filter.toLowerCase());
  const sort = document.getElementById('sortSelect').value;
  if(sort==='asc') prods.sort((a,b)=>a.price-b.price);
  else if(sort==='desc') prods.sort((a,b)=>b.price-a.price);
  else prods.sort((a,b)=> (b.popular||0) - (a.popular||0));
  renderProductsList(prods);
}

function renderProductsList(prods){
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';
  prods.forEach(p=>{
    const div = document.createElement('div'); div.className='product-card';
    div.innerHTML = `<img src="${p.img}" alt="${p.name}"/><div class="pname">${p.name}</div><div class="pprice">IDR ${p.price.toLocaleString()}</div><div class="pdesc">${p.desc}</div><button class="add-btn" onclick="addToCart(${p.id})">Tambah ke Keranjang</button>`;
    grid.appendChild(div);
  });
}

/* ---------- Cart functions ---------- */
function addToCart(pid){
  const prods = getProducts();
  const p = prods.find(x=>x.id==pid);
  if(!p) return alert('Produk tidak ditemukan');
  const cart = getCart();
  const found = cart.find(i=>i.id==pid);
  if(found) found.qty++;
  else cart.push({id:pid, qty:1});
  saveCart(cart);
  alert(`"${p.name}" ditambahkan ke keranjang`);
  renderCartPage();
}

function renderCartPage(){
  const container = document.getElementById('cartItems');
  if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if(cart.length===0){ container.innerHTML = '<p>Keranjang kosong.</p>'; document.getElementById('cartTotal').innerText = 'IDR 0'; return; }
  let total=0;
  cart.forEach(ci=>{
    const prod = getProducts().find(p=>p.id==ci.id);
    total += prod.price * ci.qty;
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `<img src="${prod.img}" style="width:80px;height:70px;object-fit:cover;border-radius:8px"/><div style="flex:1"><strong>${prod.name}</strong><div>IDR ${prod.price.toLocaleString()} x ${ci.qty}</div></div><div><button onclick="changeQty(${ci.id},1)">+</button><button onclick="changeQty(${ci.id},-1)">-</button></div>`;
    container.appendChild(row);
  });
  document.getElementById('cartTotal').innerText = 'IDR ' + total.toLocaleString();
  updateCartCount();
}

function changeQty(id, delta){
  const cart = getCart();
  const it = cart.find(c=>c.id==id);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0) { const idx=cart.findIndex(c=>c.id==id); cart.splice(idx,1); }
  saveCart(cart);
  renderCartPage();
}

function updateCartCount(){
  const count = getCart().reduce((s,i)=>s+i.qty,0);
  const el = document.getElementById('cartCount'); if(el) el.innerText = count;
}

/* ---------- Checkout handlers ---------- */
function handleCheckout(formObj){
  const cart = getCart();
  if(cart.length===0) return alert('Keranjang kosong');
  // build order payload
  let total=0; let items=[];
  cart.forEach(ci=>{
    const p = getProducts().find(x=>x.id==ci.id);
    items.push({id:p.id,name:p.name,qty:ci.qty,price:p.price});
    total += p.price * ci.qty;
  });
  const order = {
    id: 'ORD' + Date.now(),
    customer: formObj.fullname,
    whatsapp: formObj.whatsapp,
    address: formObj.address,
    delivery: formObj.delivery,
    additional: formObj.additional || '-',
    items, total, status: 'Pending', created: new Date().toISOString()
  };
  // save orders
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  // clear cart
  localStorage.removeItem('doremi_cart');
  updateCartCount();
  // open WhatsApp with message
  let msg = `Pesanan Doremi Cake%0aNama: ${order.customer}%0aWA: ${order.whatsapp}%0aAlamat: ${order.address}%0aDelivery: ${order.delivery}%0aItems:%0a`;
  items.forEach(it=> msg += `- ${it.name} x${it.qty} (IDR ${it.price.toLocaleString()})%0a`);
  msg += `Total: IDR ${total.toLocaleString()}%0aCatatan: ${order.additional}`;
  window.open('https://wa.me/' + SHOP_WA + '?text=' + msg, '_blank');
  // redirect to confirm
  location.href = 'confirm.html';
}

function payEwallet(){
  // simulate e-wallet success
  const cart = getCart();
  if(cart.length===0) return alert('Keranjang kosong');
  // create minimal order and mark paid
  const order = { id:'ORD'+Date.now(), customer:'(E-Wallet)', whatsapp:'-', address:'-', delivery:'-', items:cart, total:0, status:'Paid', created: new Date().toISOString() };
  const orders = getOrders(); orders.push(order); saveOrders(orders);
  localStorage.removeItem('doremi_cart'); updateCartCount();
  alert('Pembayaran e-wallet berhasil (simulasi)');
  location.href = 'confirm.html';
}

/* ---------- Profile ---------- */
function renderProfile(){
  const user = JSON.parse(localStorage.getItem('userData'));
  if(!user){ alert('Silakan login'); location.href='index.html'; return; }
  document.getElementById('profileName').innerText = user.name || user.email;
  document.getElementById('profileEmail').innerText = user.email || '';
  document.getElementById('profilePhone').innerText = user.phone || '-';
  document.getElementById('profileAddr').innerText = user.addr || '-';
  // orders
  const orders = getOrders();
  const list = document.getElementById('orderHistory');
  list.innerHTML = '';
  if(orders.length===0) list.innerHTML = '<li>Tidak ada pesanan.</li>';
  else orders.slice().reverse().forEach(o=>{
    const li = document.createElement('li');
    li.innerHTML = `<strong>${o.id || o.created}</strong> — ${o.items?.length ? o.items.length + ' item' : '-'} — ${o.status}`;
    list.appendChild(li);
  });
  // edit profile button
  const editBtn = document.getElementById('editProfileBtn');
  editBtn.onclick = ()=> {
    const newName = prompt('Nama baru:', user.name || '');
    if(newName) { user.name = newName; localStorage.setItem('userData', JSON.stringify(user)); renderProfile(); }
  };
  document.getElementById('logoutBtn').onclick = ()=> { localStorage.removeItem('userData'); alert('Logged out'); location.href='index.html'; };
}

/* ---------- Admin ---------- */
function adminLoginAction(){
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  const ok = ADMIN_ACCOUNTS.some(a=>a.email===email && a.pass===pass);
  if(!ok){ alert('Credential admin salah'); return; }
  // set flag and show panel
  localStorage.setItem('doremi_admin','true');
  document.getElementById('adminLoginBlock').style.display='none';
  document.getElementById('adminPanel').style.display='block';
  loadAdminProducts();
}
function adminLogout(){ localStorage.removeItem('doremi_admin'); location.reload(); }
function adminAddProduct(){
  if(!localStorage.getItem('doremi_admin')) return alert('Only admin');
  const name = document.getElementById('pName').value.trim();
  const cat = document.getElementById('pCat').value;
  const price = Number(document.getElementById('pPrice').value);
  const img = document.getElementById('pImg').value.trim() || 'images/cake1.jpg';
  const desc = document.getElementById('pDesc').value.trim() || '-';
  if(!name || !price) return alert('Nama & harga dibutuhkan');
  const arr = getProducts();
  const id = arr.reduce((m,p)=>Math.max(m,p.id),0)+1;
  arr.push({id,name,category:cat,price,desc,img,popular:50});
  saveProducts(arr);
  loadAdminProducts();
  alert('Produk ditambahkan');
}
function adminRemoveProduct(id){
  if(!localStorage.getItem('doremi_admin')) return alert('Only admin');
  let arr = getProducts().filter(p=>p.id!==id);
  saveProducts(arr); loadAdminProducts();
}
function loadAdminProducts(){
  const list = document.getElementById('adminProductsList');
  if(!list) return;
  const arr = getProducts();
  list.innerHTML = '';
  arr.forEach(p=>{
    const el = document.createElement('div'); el.className='prod';
    el.innerHTML = `<div><strong>${p.name}</strong> — ${p.category} — IDR ${p.price.toLocaleString()}</div><div><button onclick="adminRemoveProduct(${p.id})">Hapus</button></div>`;
    list.appendChild(el);
  });
}

/* ---------- Utilities ---------- */
function scrollToMenu(){ document.getElementById('menuSection')?.scrollIntoView({behavior:'smooth'}); }
function logout(){ localStorage.removeItem('userData'); alert('Logged out'); location.href='index.html'; }
