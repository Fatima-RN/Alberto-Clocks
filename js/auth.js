/* Login, sign up, log out and "My profile" */

const currentUserRecord = () =>
  user ? store.get("ac_users", []).find((x) => x.email === user.email) : null;

function renderUser() {
  $("#userArea").innerHTML = user
    ? `<div class="dropdown"><button class="btn btn-grad btn-sm dropdown-toggle user-btn" data-bs-toggle="dropdown" aria-label="Account menu"><span class="avatar sm">${esc(user.name[0].toUpperCase())}</span><span class="d-none d-sm-inline">${esc(user.name)}</span></button>
       <ul class="dropdown-menu dropdown-menu-end"><li><span class="dropdown-item-text small"><strong>${esc(user.name)}</strong><br>${esc(user.email)}</span></li><li><hr class="dropdown-divider"></li>
       <li><a class="dropdown-item" href="#" data-profile>My profile</a></li><li><a class="dropdown-item" href="#" data-signout>Log out</a></li></ul></div>`
    : '<button class="btn btn-grad btn-sm" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>';
}
function signIn(u) {
  user = { name: u.name.split(" ")[0], email: u.email };
  store.set("ac_user", user);
  renderUser();
}

// check a typed password against the saved salt + hash
function passwordMatches(u, typed) {
  if (u.hash) return hashPassword(typed, u.salt) === u.hash;
  return u.password !== undefined && u.password === typed; // account made before hashing existed
}

$("#loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target,
    users = store.get("ac_users", []),
    u = users.find((x) => x.email === f.email.value.trim().toLowerCase());
  if (!u || !passwordMatches(u, f.password.value)) {
    const er = $("#loginError");
    er.hidden = false;
    er.textContent =
      "Wrong email or password. New here? Use the Sign up tab to create an account.";
    return;
  }
  if (!u.hash) {
    // upgrade an old account: replace the plain password with a salt + hash
    u.salt = makeSalt();
    u.hash = hashPassword(f.password.value, u.salt);
    delete u.password;
    store.set("ac_users", users);
  }
  $("#loginError").hidden = true;
  signIn(u);
  f.reset();
  bsModal("#loginModal").hide();
  toast("Welcome back, " + user.name);
  refreshAfterLogin();
});

function registerUser(f, er) {
  const users = store.get("ac_users", []),
    email = f.email.value.trim().toLowerCase();
  const fail = (m) => {
    er.hidden = false;
    er.textContent = m;
    return false;
  };
  er.hidden = true;
  if (!PW_RE.test(f.password.value))
    return fail(
      "Password must be 8-20 characters with an uppercase letter, a lowercase letter, a number and a special character, and no spaces.",
    );
  if (f.password.value !== f.confirm.value)
    return fail("Passwords do not match.");
  if (users.some((u) => u.email === email))
    return fail("This email is already registered. Please login.");
  const salt = makeSalt();
  const u = {
    name: f.name.value.trim(),
    gender: f.gender.value,
    phone: f.phone.value,
    email,
    address: f.address.value,
    salt,
    hash: hashPassword(f.password.value, salt), // the password itself is never saved
    joined: new Date().toISOString(),
  };
  users.push(u);
  store.set("ac_users", users);
  signIn(u);
  f.reset();
  return true;
}
$("#signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!registerUser(e.target, $("#signupError"))) return;
  bsModal("#loginModal").hide();
  toast("Welcome, " + user.name + "! Your account is ready");
  refreshAfterLogin();
});
if ($("#registerForm"))
  $("#registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!registerUser(e.target, $("#regError"))) return;
    toast("Account created. Taking you to the products");
    setTimeout(() => (location.href = "#products"), 1400);
    refreshAfterLogin();
  });

// the review box on the product page depends on who is logged in
function refreshAfterLogin() {
  const p = $("#reviews") && byId(+new URLSearchParams(location.search).get("id"));
  if (p) renderReviews(p);
}

/* ---------- log out, profile, switching between Login / Sign up ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-signout]")) {
    e.preventDefault();
    user = null;
    localStorage.removeItem("ac_user");
    renderUser();
    toast("Logged out");
    const m = bootstrap.Modal.getInstance($("#profileModal"));
    if (m) m.hide();
    refreshAfterLogin();
  }
  const t = e.target.closest("[data-auth-tab]");
  if (t) {
    e.preventDefault();
    bootstrap.Tab.getOrCreateInstance(
      $(`[data-bs-target="#${t.dataset.authTab}"]`),
    ).show();
  }
  if (e.target.closest("[data-profile]")) {
    e.preventDefault();
    const c = bootstrap.Modal.getInstance($("#checkoutModal"));
    if (c) c.hide();
    renderProfile();
    bsModal("#profileModal").show();
  }
});

function renderProfile() {
  if (!user) return;
  const u = currentUserRecord() || { name: user.name, email: user.email };
  const orders = ordersOf(user.email).reverse();
  const row = (k, v) =>
    `<div class="profile-row"><span>${k}</span><strong>${esc(v || "-")}</strong></div>`;
  $("#profileBody").innerHTML = `
    <div class="d-flex align-items-center gap-3 mb-3">
      <span class="avatar">${esc(u.name[0].toUpperCase())}</span>
      <div><h4 class="mb-0">${esc(u.name)}</h4><small class="text-secondary">${esc(u.email)}</small></div>
    </div>
    ${row("Phone", u.phone)}${row("Gender", u.gender)}${row("Address", u.address)}
    ${row("Member since", u.joined ? new Date(u.joined).toLocaleDateString() : "")}
    <h3 class="mt-4 fs-6">Orders (${orders.length})</h3>
    ${orders.length ? orders.map(orderHTML).join("") : '<p class="text-secondary small mb-0">No orders yet.</p>'}
    <button class="btn btn-outline-secondary w-100 mt-4" data-signout>Log out</button>`;
}
// keep the order status fresh while the profile window is open
setInterval(() => {
  const m = $("#profileModal");
  if (m && m.classList.contains("show")) {
    const open = $$("#profileBody details[open]").map((d) =>
      d.querySelector("strong").textContent,
    );
    renderProfile();
    $$("#profileBody details").forEach((d) => {
      if (open.includes(d.querySelector("strong").textContent)) d.open = true;
    });
  }
}, 15000);
