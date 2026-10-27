/* Alberto Clocks - core helpers shared by every page.
   Load order (see the <script> tags): core, security, wishlist, reviews, products,
   orders, cart, auth, forms, ui, main. */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// project root, found from this script's own URL (index.html is in the root, other pages in /pages)
const ROOT = new URL("../", document.currentScript.src).href;
const PRODUCT_PAGE = ROOT + "pages/product.html";
const ON_HOME = !!$("#home");

// tiny wrapper around localStorage (data stays in this browser only)
const store = {
  get: (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// make text safe before it goes inside innerHTML
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) => "Rs. " + Math.round(n).toLocaleString("en-US");
const catName = (c) =>
  ({ wall: "Wall", luxury: "Luxury", vintage: "Vintage" })[c];

// shared state
let products = [];
let cart = store.get("ac_cart", []);
let user = store.get("ac_user", null);
const byId = (id) => products.find((p) => p.id === id);

// small pop-up message at the bottom of the screen
function toast(msg) {
  let t = $("#toast");
  if (!t) {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="toast" class="toast-msg" role="status" aria-live="polite"></div>',
    );
    t = $("#toast");
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove("show"), 2600);
}

// five stars, filled up to the rounded average
function starsHTML(avg) {
  const full = Math.round(avg);
  return `<span class="stars" aria-hidden="true">${"★".repeat(full)}<span class="off">${"★".repeat(5 - full)}</span></span>`;
}

const bsModal = (sel) => bootstrap.Modal.getOrCreateInstance($(sel));
const bsOffcanvas = (sel) => bootstrap.Offcanvas.getOrCreateInstance($(sel));
