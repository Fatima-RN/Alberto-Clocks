# Alberto Clocks (Aptech E-Project)

Plain HTML, CSS and JavaScript (Bootstrap for layout). No database: everything is saved in the browser (localStorage).

Open it with a local server (for example VS Code "Live Server"), because the clocks are loaded from `data/products.json`.

## Folders

- `index.html` - home page (hero, world time, products, about, store locator, support/FAQ, register)
- `pages/product.html` - one clock's page (details, stock, reviews)
- `data/products.json` - the clocks (name, price, stock, ...). Edit `stock` to change how many are left.
- `css/style.css` - lists all the other CSS files in the right order (order matters)
  - `base`, `header`, `hero`, `sections`, `products`, `cart-footer`, `pages`, `responsive`, `hero-bg`, `about`,
    `theme-toggle`, `auth`, `led`, `product-photos`, `store-status`, `forms-faq` - the original design, one part per file
  - `accessibility.css` - skip link, keyboard focus, reduced motion
  - `features.css` - wishlist, stock badge, ratings, price slider, world time, coupon, checkout, order history, reviews
- `js/` (loaded in this order)
  - `core.js` helpers and shared data, `security.js` password hashing, `wishlist.js`, `reviews.js`,
    `products.js` cards, listing page, detail page, `orders.js` order status, `cart.js` cart + coupon + checkout,
    `auth.js` login / sign up / profile, `forms.js` password rules + contact form, `ui.js` clock, theme, LED, store status,
    `main.js` starts everything
- `fonts/` - DSEG7 (digital clock font). See `fonts/README.txt` to add the other fonts for offline use.

## Handy settings

- Coupon code: `COUPONS` at the top of `js/cart.js` (try `TIME10`).
- Checkout needs Internet: `REQUIRE_INTERNET_FOR_CHECKOUT` in `js/cart.js`.
- Order status speed: `DELIVERY_STEPS` in `js/orders.js` (minutes after the order).
