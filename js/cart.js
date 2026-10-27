/* Cart, coupon and checkout */

// Placing an order needs the Internet (the site checks before it continues).
// Set this to false if you want checkout to work fully offline.
const REQUIRE_INTERNET_FOR_CHECKOUT = true;

// coupon codes: code -> percent off
const COUPONS = { TIME10: 10 };
let coupon = store.get("ac_coupon", null); // code the shopper applied, or null

function saveCart() {
  store.set("ac_cart", cart);
  renderCart();
}
function addToCart(id, qty = 1) {
  const p = byId(id);
  if (!p) return;
  const left = stockLeft(p);
  const it = cart.find((c) => c.id === id);
  const have = it ? it.qty : 0;
  if (left === 0) return toast(p.name + " is out of stock");
  if (have + qty > left) {
    toast("Only " + left + " of " + p.name + " in stock");
    qty = left - have;
    if (qty <= 0) return;
  }
  it ? (it.qty += qty) : cart.push({ id, qty });
  saveCart();
  toast(p.name + " added to cart");
}
function changeQty(id, d) {
  const it = cart.find((c) => c.id === id);
  if (d > 0 && it.qty + d > stockLeft(byId(id)))
    return toast("No more of this clock in stock");
  it.qty += d;
  if (it.qty <= 0) cart = cart.filter((c) => c.id !== id);
  saveCart();
}
function removeItem(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
}

// subtotal, coupon discount and total
function totals() {
  const subtotal = cart.reduce((s, c) => s + byId(c.id).price * c.qty, 0);
  const pct = coupon ? COUPONS[coupon] || 0 : 0;
  const discount = Math.round((subtotal * pct) / 100);
  return { subtotal, pct, discount, total: subtotal - discount };
}
function totalsHTML(t) {
  return `<div class="sum-row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount ? `<div class="sum-row disc"><span>Coupon ${esc(coupon)} (${t.pct}% off)</span><span>−${money(t.discount)}</span></div>` : ""}
    <div class="sum-row total"><span>Total</span><span>${money(t.total)}</span></div>`;
}

function renderCart() {
  if (!products.length) return;
  cart = cart.filter((c) => byId(c.id) && stockLeft(byId(c.id)) > 0);
  cart.forEach((c) => (c.qty = Math.min(c.qty, stockLeft(byId(c.id)))));
  const count = cart.reduce((s, c) => s + c.qty, 0);
  $("#cartItems").innerHTML = cart.length
    ? cart
        .map((c) => {
          const p = byId(c.id);
          return `<div class="cart-item">${clockImg(p)}
      <div class="cart-item-info"><a class="cart-name" href="${PRODUCT_PAGE}?id=${p.id}">${esc(p.name)}</a><br><small class="price">${money(p.price)}</small>
        <div class="cart-qty"><button class="btn btn-sm btn-outline-secondary" onclick="changeQty(${p.id},-1)" aria-label="Less of ${esc(p.name)}">-</button><span>${c.qty}</span><button class="btn btn-sm btn-outline-secondary" onclick="changeQty(${p.id},1)" aria-label="More of ${esc(p.name)}">+</button></div></div>
      <button class="btn-close" aria-label="Remove ${esc(p.name)}" onclick="removeItem(${p.id})"></button></div>`;
        })
        .join("")
    : '<p class="text-center text-secondary mt-4">Your cart is empty. <a href="' +
      ROOT +
      'index.html#products">Browse clocks</a></p>';
  $$('[data-count="cart"]').forEach((el) => {
    el.textContent = count;
    el.dataset.n = count;
  });
  $("#cartTotals").innerHTML = cart.length ? totalsHTML(totals()) : "";
  $("#couponInput").value = coupon || "";
  store.set("ac_cart", cart); // keep the saved cart in step with the stock check above
}

$("#clearBtn").onclick = () => {
  cart = [];
  saveCart();
};

/* ---------- coupon ---------- */
function couponNote(msg, ok) {
  const n = $("#couponNote");
  n.textContent = msg;
  n.className = "coupon-note " + (ok ? "ok" : "bad");
}
$("#couponForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = $("#couponInput").value.trim().toUpperCase();
  if (!code) {
    coupon = null;
    store.set("ac_coupon", null);
    couponNote("", true);
  } else if (COUPONS[code]) {
    coupon = code;
    store.set("ac_coupon", code);
    couponNote(code + " applied: " + COUPONS[code] + "% off", true);
  } else {
    couponNote("This coupon code is not valid.", false);
    return;
  }
  renderCart();
});

/* ---------- online check: the site works offline, but placing an order needs the Internet ---------- */
async function isOnline() {
  if (!navigator.onLine) return false; // browser already knows there is no network
  try {
    // tiny request to a public server; fails when connected to Wi-Fi/LAN without Internet
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    await fetch("https://www.gstatic.com/generate_204", {
      mode: "no-cors",
      cache: "no-store",
      signal: ctl.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}
// small notice inside the cart while the device is offline
function showNetNotice() {
  const box = $("#netNotice");
  if (box) box.hidden = navigator.onLine || !REQUIRE_INTERNET_FOR_CHECKOUT;
}
addEventListener("online", showNetNotice);
addEventListener("offline", showNetNotice);
showNetNotice();

/* ---------- checkout ---------- */
$("#checkoutBtn").onclick = async () => {
  if (!cart.length) return toast("Your cart is empty");
  if (REQUIRE_INTERNET_FOR_CHECKOUT) {
    const btn = $("#checkoutBtn");
    btn.disabled = true;
    const online = await isOnline();
    btn.disabled = false;
    if (!online) {
      showNetNotice();
      $("#netNotice").hidden = false;
      return toast(
        "You are offline. Please connect to the Internet to place your order.",
      );
    }
  }
  if (!user) {
    bsOffcanvas("#cartPanel").hide();
    toast("Please login to check out");
    return bsModal("#loginModal").show();
  }
  openCheckout();
};

function openCheckout() {
  const u = currentUserRecord() || {};
  const f = $("#checkoutForm");
  f.name.value = u.name || user.name;
  f.phone.value = u.phone || "";
  f.address.value = u.address || "";
  f.city.value = "Karachi";
  f.note.value = "";
  f.payment.value = "cod";
  $("#checkoutError").hidden = true;
  syncPayment();
  $("#coLines").innerHTML = cart
    .map(
      (c) =>
        `<li><span>${esc(byId(c.id).name)} × ${c.qty}</span><span>${money(byId(c.id).price * c.qty)}</span></li>`,
    )
    .join("");
  $("#coTotals").innerHTML = totalsHTML(totals());
  $("#checkoutFormWrap").hidden = false;
  $("#checkoutDone").hidden = true;
  bsOffcanvas("#cartPanel").hide();
  bsModal("#checkoutModal").show();
}

// pickup orders do not need a delivery address
function syncPayment() {
  const pickup = $("#checkoutForm").payment.value === "pickup";
  $("#addressFields").hidden = pickup;
  $("#checkoutForm").address.required = !pickup;
  $("#checkoutForm").city.required = !pickup;
}
$$('#checkoutForm input[name="payment"]').forEach((r) =>
  r.addEventListener("change", syncPayment),
);

const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;
$("#checkoutForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target,
    er = $("#checkoutError");
  if (!PHONE_RE.test(f.phone.value.trim())) {
    er.hidden = false;
    er.textContent =
      "Please enter a phone number with 10 to 15 digits, for example 0300 1234567.";
    return;
  }
  er.hidden = true;
  placeOrder(f);
});

function placeOrder(f) {
  const orders = store.get("ac_orders", []);
  const no = "AC-" + (1000 + orders.length + 1);
  const t = totals();
  const pickup = f.payment.value === "pickup";
  const order = {
    no,
    email: user.email,
    items: cart.map((c) => ({
      id: c.id,
      name: byId(c.id).name,
      price: byId(c.id).price,
      qty: c.qty,
    })),
    subtotal: t.subtotal,
    discount: t.discount,
    coupon: t.discount ? coupon : null,
    total: t.total,
    name: f.name.value.trim(),
    phone: f.phone.value.trim(),
    address: pickup ? "" : f.address.value.trim(),
    city: pickup ? "" : f.city.value.trim(),
    note: f.note.value.trim(),
    payment: f.payment.value,
    date: new Date().toISOString(),
  };
  orders.push(order);
  store.set("ac_orders", orders);
  // take the bought clocks out of the stock
  const sold = store.get("ac_sold", {});
  cart.forEach((c) => (sold[c.id] = (sold[c.id] || 0) + c.qty));
  store.set("ac_sold", sold);
  cart = [];
  coupon = null;
  store.set("ac_coupon", null);
  saveCart();
  if (window.redrawListing) redrawListing();
  renderWish();
  $("#checkoutFormWrap").hidden = true;
  $("#checkoutDone").hidden = false;
  $("#doneText").textContent =
    `Order ${no} is placed. Total ${money(order.total)}. ` +
    (pickup
      ? "We will call you when it is ready at the showroom."
      : "We will call you to confirm delivery.");
  toast("Order " + no + " placed. Thank you, " + user.name + "!");
}
