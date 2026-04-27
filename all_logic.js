/* ==========================================================================
   MASTER APPLICATION LOGIC - ADULTTOYSKE
   ========================================================================== */

const SUPABASE_URL = 'https://ndwbepjjxjcrussmvnlm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Kb2j5iHBhdev3hZp1MX5lg_Rqi9Galn';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let ALL_PRODUCTS_DB = [];
let CUSTOMERS_DB = [];
let cart = [];
let currentFilter = 'All';
let pdCurrentId = null, pdQtyVal = 1;

// ---- CURSOR & UX ----
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (cursor) cursor.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
});

function animateRing() {
    rx += (mx - rx - 18) * 0.15;
    ry += (my - ry - 18) * 0.15;
    if (cursorRing) cursorRing.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(animateRing);
}
if (cursorRing) animateRing();

// ---- AGE GATE ----
window.enterSite = function () {
    const gate = document.getElementById('ageGate');
    if (gate) gate.classList.add('hidden');
    sessionStorage.setItem('ageVerified', 'true');
}
window.exitSite = function () {
    window.location.href = 'https://www.google.com';
}
if (sessionStorage.getItem('ageVerified')) enterSite();

// ---- NAVBAR SCROLL ----
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ---- CART STATE & UI ----
window.addToCart = function (name, price, emoji) {
    const existing = cart.find(i => i.name === name);
    if (existing) { existing.qty++; }
    else { cart.push({ name, price, emoji, qty: 1 }); }
    updateCartUI();
    showToast(`${emoji} ${name} added to cart`);
    openCart();
}

window.removeFromCart = function (index) {
    cart.splice(index, 1);
    updateCartUI();
}

window.updateQty = function (index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) removeFromCart(index);
    else updateCartUI();
}

function updateCartUI() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cartCountBadge');
    if (badge) badge.textContent = count;

    const itemsEl = document.getElementById('cartItems');
    const footerEl = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');

    if (totalEl) totalEl.textContent = `KES ${total.toLocaleString()}`;

    if (!itemsEl) return;

    if (cart.length === 0) {
        itemsEl.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛍</div><div class="cart-empty-text">Your cart is empty</div><p style="font-size:0.75rem;color:var(--text-muted)">Start shopping to add items</p></div>`;
        if (footerEl) footerEl.style.display = 'none';
    } else {
        if (footerEl) footerEl.style.display = 'block';
        itemsEl.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.emoji}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">KES ${item.price.toLocaleString()}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="updateQty(${i}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${i}, 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
      </div>
    `).join('');
    }
}

window.openCart = function () { document.getElementById('cartOverlay').classList.add('open'); }
window.closeCart = function () { document.getElementById('cartOverlay').classList.remove('open'); }
window.handleCartOverlayClick = function (e) { if (e.target === document.getElementById('cartOverlay')) closeCart(); }

window.checkout = function () {
    if (cart.length === 0) return;
    const user = getCurrentUser();
    if (!user) { openAuth(); } else { placeOrder(user); }
}

// ---- PRODUCT FETCHING & GRID ----
async function fetchProducts() {
    try {
        const [{ data: pData }, { data: bData }] = await Promise.all([
            db.from('products').select('*'),
            db.from('promo_banners').select('*')
        ]);

        if (pData) {
            ALL_PRODUCTS_DB = pData.map(p => ({
                id: p.id, name: p.name, category: p.category, emoji: p.emoji, bgClass: 'p1',
                price: p.price, oldPrice: p.old_price || null, badge: p.badge, rating: '★★★★★', count: Math.floor(Math.random() * 50) + 15,
                sizes: p.sizes || 'One Size', model: p.model || '—', desc: p.full_desc || p.short_desc || '',
                features: p.features || '', img: p.img, reviews: [], stock: p.stock || 0
            }));
            renderProductsGrid();
        }

        if (bData) {
            const p1 = bData.find(b => b.type === 'promo1');
            const p2 = bData.find(b => b.type === 'promo2');
            if (p1 && document.getElementById('p1_eyebrow')) {
                document.getElementById('p1_eyebrow').textContent = p1.eyebrow;
                document.getElementById('p1_title').innerHTML = p1.title.replace(/\n/g, '<br>');
                document.getElementById('p1_desc').textContent = p1.description;
                document.getElementById('p1_link').querySelector('span').textContent = p1.button_text;
            }
        }
    } catch (err) { console.error('Fetch Error:', err); }
}

function renderProductsGrid() {
    const grid = document.getElementById('mainProductsGrid');
    if (!grid) return;
    let prods = ALL_PRODUCTS_DB;

    if (currentFilter === 'New In') prods = prods.filter(p => p.badge === 'New');
    else if (currentFilter === 'Bestsellers') prods = prods.filter(p => p.badge === 'Hot');
    else if (currentFilter === 'On Sale') prods = prods.filter(p => p.oldPrice);
    else if (currentFilter !== 'All') {
        prods = prods.filter(p => p.category.toLowerCase() === currentFilter.toLowerCase());
    }

    grid.innerHTML = prods.map(p => {
        const hasImg = p.img && p.img !== '';
        return `
      <div class="product-card fade-in visible" onclick="openProduct('${p.id || p.name}')" style="cursor:pointer">
        <div class="product-img">
          ${hasImg ? `<img src="${p.img}" class="product-actual-img" onerror="this.style.display='none'">` : ''}
          <div class="product-img-bg ${p.bgClass || 'p1'}" ${hasImg ? 'style="display:none"' : ''}></div>
          <div class="product-emoji" ${hasImg ? 'style="font-size:1.2rem;top:10px;left:10px;background:rgba(0,0,0,0.5);width:30px;height:30px;line-height:30px"' : ''}>${p.emoji}</div>
          ${p.badge ? `<span class="product-badge badge-${p.badge.toLowerCase()}">${p.badge}</span>` : ''}
          <button class="product-wishlist" onclick="event.stopPropagation(); toggleWishlist(this)">♡</button>
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-rating">
            <span class="stars">${p.rating || '★★★★★'}</span>
            <span class="rating-count">(${p.count || 0})</span>
          </div>
          <div class="product-pricing">
            <span class="price">KES ${p.price.toLocaleString()}</span>
            ${p.oldPrice ? `<span class="price-old">KES ${p.oldPrice.toLocaleString()}</span>` : ''}
          </div>
          <div class="product-footer">
            <button class="btn-add-cart" ${p.stock <= 0 ? 'disabled' : ''} onclick="event.stopPropagation(); addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.emoji}')">${p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</button>
            <span class="product-delivery">${p.stock > 0 ? `✓ ${p.stock} in stock` : '❌ Out of stock'}</span>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

window.setFilter = function (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.textContent;
    renderProductsGrid();
};

// ---- PRODUCT MODAL ----
window.openProduct = function (id) {
    let p = ALL_PRODUCTS_DB.find(x => x.id === id || x.name === id);
    if (!p) return;
    pdCurrentId = p.id || p.name; pdQtyVal = 1;
    document.getElementById('pdQty').textContent = 1;
    document.getElementById('pdCategory').textContent = p.category;
    document.getElementById('pdName').textContent = p.name;
    document.getElementById('pdStars').textContent = p.rating;
    document.getElementById('pdRatingCount').textContent = `(${p.count} reviews)`;
    document.getElementById('pdPrice').textContent = 'KES ' + p.price.toLocaleString();
    document.getElementById('pdOldPrice').textContent = p.oldPrice ? 'KES ' + p.oldPrice.toLocaleString() : '';
    document.getElementById('pdDesc').textContent = p.desc || p.full_desc || '';

    const stockEl = document.getElementById('pdStock');
    if (stockEl) {
        stockEl.textContent = p.stock > 0 ? `${p.stock} units available` : 'Currently out of stock';
        stockEl.style.color = p.stock > 0 ? 'var(--success)' : 'var(--danger)';
    }

    const modalAddBtn = document.getElementById('pdAddBtn');
    if (modalAddBtn) {
        modalAddBtn.disabled = p.stock <= 0;
        modalAddBtn.textContent = p.stock > 0 ? 'Add to Cart' : 'Out of Stock';
    }

    const imgEl = document.getElementById('pdActualImg');
    const bgEl = document.getElementById('pdImgBg');
    const emoEl = document.getElementById('pdEmoji');

    if (p.img) {
        imgEl.src = p.img; imgEl.style.display = 'block'; bgEl.style.display = 'none';
    } else {
        imgEl.style.display = 'none'; bgEl.style.display = 'block';
    }
    emoEl.textContent = p.emoji;

    document.getElementById('pdOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    renderProductReviews(p.id);
}

window.closePd = function () { document.getElementById('pdOverlay').classList.remove('open'); document.body.style.overflow = ''; }

async function renderProductReviews(prodId) {
    const listEl = document.getElementById('pdReviewsList');
    if (!listEl) return;
    const { data: revs } = await db.from('product_reviews').select('*').eq('product_id', prodId).order('created_at', { ascending: false });
    if (revs && revs.length > 0) {
        listEl.innerHTML = revs.map(r => `<div class="pd-review-item"><strong>${r.customer_name}</strong>: ${r.review_text}</div>`).join('');
    } else {
        listEl.innerHTML = '<div class="pd-review-item">No reviews yet.</div>';
    }
}

// ---- AUTH LOGIC ----
window.getCurrentUser = function () { const u = sessionStorage.getItem('atk_user'); return u ? JSON.parse(u) : null; }
window.openAuth = function () { document.getElementById('authOverlay').classList.add('open'); }
window.closeAuth = function () { document.getElementById('authOverlay').classList.remove('open'); }
window.switchAuthTab = function (tab) {
    document.getElementById('formSignIn').style.display = tab === 'signin' ? 'block' : 'none';
    document.getElementById('formSignUp').style.display = tab === 'signup' ? 'block' : 'none';
}

window.doSignIn = async function () {
    const email = document.getElementById('siEmail').value.trim();
    const pass = document.getElementById('siPass').value.trim();
    const err = document.getElementById('siErr');
    if (err) err.style.display = 'none';

    if (!email || !pass) {
        if (err) { err.textContent = 'Please enter your email and password.'; err.style.display = 'block'; }
        return;
    }

    const btn = document.querySelector('.auth-btn');

    try {
        // ── STEP 1: Try Supabase Auth (accounts created via the normal sign-up flow) ──
        const { data, error } = await db.auth.signInWithPassword({ email, password: pass });

        if (!error && data.session) {
            // Supabase Auth succeeded — pull their profile from the customers table
            let { data: customer } = await db.from('customers').select('*').ilike('email', email).limit(1).maybeSingle();
            if (!customer) {
                // First Google/Auth login — create a stub record
                const newUser = { name: data.user.user_metadata?.full_name || email.split('@')[0], email, password: 'auth_managed', phone: '', delivery_location: '' };
                const { data: inserted } = await db.from('customers').insert([newUser]).select().single();
                customer = inserted;
            }
            if (customer) {
                sessionStorage.setItem('atk_user', JSON.stringify(customer));
                closeAuth();
                initAuthUI();
                if (cart.length > 0) placeOrder(customer);
                else showToast(`Welcome back, ${customer.name}! ✨`);
            }
            return;
        }

        // ── STEP 2: Legacy fallback — search customers table directly ──
        // Use ilike for case-insensitive email match
        const { data: byEmail } = await db.from('customers').select('*').ilike('email', email).limit(5);
        // Also allow phone number as the "username"
        const { data: byPhone } = await db.from('customers').select('*').eq('phone', email).limit(5);

        const candidates = [...(byEmail || []), ...(byPhone || [])];
        const match = candidates.find(u => u.password === pass);

        if (match) {
            sessionStorage.setItem('atk_user', JSON.stringify(match));
            closeAuth();
            initAuthUI();
            if (cart.length > 0) placeOrder(match);
            else showToast(`Welcome back, ${match.name}! ✨`);
            return;
        }

        // ── Provide specific error message ──
        const msg = candidates.length > 0
            ? 'Incorrect password. Please try again.'
            : 'No account found with that email. Please create an account.';
        if (err) { err.textContent = msg; err.style.display = 'block'; }

    } catch (e) {
        console.error('[SIGN IN ERROR]', e);
        const msg = e.message?.includes('Email not confirmed')
            ? '⚠️ Please check your email inbox and click the confirmation link.'
            : 'Sign in failed. Please try again.';
        if (err) { err.textContent = msg; err.style.display = 'block'; }
    }
}

window.doForgotPassword = async function () {
    const email = document.getElementById('siEmail').value.trim();
    if (!email) { alert('Please enter your email address in the Sign In form first.'); return; }

    const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
    });

    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Password reset link sent to your email! ✨ Check your inbox (and spam folder).');
    }
}

window.initAuthUI = function () {
    const user = getCurrentUser();
    const loginLink = document.getElementById('loginLink');
    const userProfile = document.getElementById('userProfile');
    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (userProfile) userProfile.style.display = 'flex';
        if (document.getElementById('userName')) document.getElementById('userName').textContent = user.name.split(' ')[0];
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if (userProfile) userProfile.style.display = 'none';
    }
}

window.doLogout = function () { sessionStorage.removeItem('atk_user'); location.reload(); }

window.loginWithGoogle = async function () {
    await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
}

// ---- ORDERING ENGINE ----
async function placeOrder(user) {
    if (!user.phone || !user.delivery_location || user.phone === '0000000000') {
        showToast('⚠️ Please complete your profile first');
        openProfile(); return;
    }

    const oid = 'ATK-' + Date.now().toString(36).toUpperCase();
    const order = { id: oid, customer_name: user.name, customer_email: user.email, customer_phone: user.phone, items: cart.map(i => ({ ...i })), total: cart.reduce((s, i) => s + i.price * i.qty, 0), status: 'pending' };

    const { error } = await db.from('orders').insert([order]);
    if (!error) {
        sendOrderEmail(user, oid, order);
        cart = []; updateCartUI();
        showSuccessModal(oid);
    }
}

async function sendOrderEmail(user, orderId, order) {
    const params = { customer_name: user.name, order_id: orderId, total_price: order.total.toLocaleString(), items_list: order.items.map(i => `${i.name} (x${i.qty})`).join('\n'), to_email: user.email };
    try { await emailjs.send("service_a2diqqb", "template_b7h4cw3", params); showToast('📧 Confirmation email sent!'); } catch (err) { }
}

window.whatsappOrder = async function () {
    const user = getCurrentUser();
    if (!user) { openAuth(); return; }
    if (!user.phone || !user.delivery_location) { openProfile(); return; }

    const oid = 'WA-' + Date.now().toString(36).toUpperCase();
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const msg = `Hi AdultToysKE! 👋 I'm *${user.name}*. Order ID: ${oid}. Total: KES ${total.toLocaleString()}.`;

    await db.from('orders').insert([{ id: oid, customer_name: user.name, items: cart, total, status: 'whatsapp_pending' }]);
    window.open(`https://wa.me/254745799633?text=${encodeURIComponent(msg)}`, '_blank');
    cart = []; updateCartUI(); showSuccessModal(oid);
}

// ---- MISC ----
window.toggleFaq = function (item) {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
}

window.toggleWishlist = function (btn) {
    const isActive = btn.style.color === 'var(--rose)';
    btn.textContent = isActive ? '♡' : '♥';
    btn.style.color = isActive ? '' : 'var(--rose)';
    showToast(isActive ? 'Removed from wishlist' : '♥ Added to wishlist');
}

window.showToast = function (msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

function showSuccessModal(oid) {
    document.getElementById('successOrderId').textContent = 'Order #' + oid;
    document.getElementById('successOverlay').classList.add('open');
}
window.closeSuccess = function () { document.getElementById('successOverlay').classList.remove('open'); }

// ---- PROFILE ----
window.openProfile = function () {
    const user = getCurrentUser();
    if (!user) { openAuth(); return; }
    document.getElementById('prName').value = user.name || '';
    document.getElementById('prPhone').value = user.phone || '';
    document.getElementById('prLoc').value = user.delivery_location || '';
    document.getElementById('profileOverlay').classList.add('open');
}
window.closeProfile = function () { document.getElementById('profileOverlay').classList.remove('open'); }
window.saveProfile = async function () {
    const user = getCurrentUser();
    const updates = { name: document.getElementById('prName').value, phone: document.getElementById('prPhone').value, delivery_location: document.getElementById('prLoc').value };
    const { data, error } = await db.from('customers').update(updates).eq('id', user.id).select().single();
    if (!error) { sessionStorage.setItem('atk_user', JSON.stringify(data)); initAuthUI(); closeProfile(); showToast('✅ Profile saved'); }
}

// ---- INIT ----
async function init() {
    await fetchProducts();
    initAuthUI();
}

db.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        let { data: customer } = await db.from('customers').select('*').eq('email', session.user.email).maybeSingle();
        if (!customer) {
            const newUser = { name: session.user.user_metadata.full_name || session.user.email.split('@')[0], email: session.user.email, password: 'oauth_' + Math.random().toString(36), phone: '', delivery_location: '' };
            const { data } = await db.from('customers').insert([newUser]).select().single();
            customer = data;
        }
        if (customer) {
            sessionStorage.setItem('atk_user', JSON.stringify(customer));
            initAuthUI();
            if (!customer.phone) openProfile();
        }
    }
});

// SECRET ADMIN
document.addEventListener('keydown', e => { if (e.ctrlKey && e.shiftKey && e.key === 'A') { window.open('admin.html', '_blank'); } });

window.onload = init;
