/* Forms: password rules + show/hide button, contact form, newsletter */

const PW_RULES = [
  ["len", "8 to 20 characters", /^.{8,20}$/],
  ["up", "One uppercase letter (A-Z)", /[A-Z]/],
  ["low", "One lowercase letter (a-z)", /[a-z]/],
  ["num", "One number (0-9)", /\d/],
  ["spec", "One special character (! @ # $ ...)", /[^A-Za-z0-9\s]/],
  ["space", "No spaces", /^\S*$/],
];
// all rules in one regular expression
const PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,20}$/;
const EYE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19C5.5 19 1.5 12 1.5 12a18.8 18.8 0 0 1 4.6-5.4M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10.5 7 10.5 7a18.9 18.9 0 0 1-2.2 3.2M1 1l22 22"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

// show / hide button on every password box
$$('input[type="password"]').forEach((inp) => {
  const wrap = document.createElement("div");
  wrap.className = "pw-wrap";
  inp.parentNode.insertBefore(wrap, inp);
  wrap.appendChild(inp);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pw-toggle";
  btn.innerHTML = EYE;
  btn.setAttribute("aria-label", "Show password");
  btn.addEventListener("click", () => {
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    btn.innerHTML = show ? EYE_OFF : EYE;
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
  wrap.appendChild(btn);
});

// live checklist under the sign up / register password
$$('#signupForm input[name="password"], #registerForm input[name="password"]').forEach(
  (inp) => {
    const conf = inp.form.elements.confirm;
    const ul = document.createElement("ul");
    ul.className = "pw-rules";
    ul.innerHTML = PW_RULES.map(
      ([k, t]) => `<li data-rule="${k}">${t}</li>`,
    ).join("");
    const holder = document.createElement("div");
    holder.className = "col-12";
    holder.hidden = true;
    holder.appendChild(ul);
    (conf || inp)
      .closest('[class*="col-"]')
      .insertAdjacentElement("afterend", holder);

    const check = () => {
      let all = true;
      PW_RULES.forEach(([k, , re]) => {
        const ok = re.test(inp.value);
        ul.querySelector(`[data-rule="${k}"]`).classList.toggle("ok", ok);
        if (!ok) all = false;
      });
      inp.setCustomValidity(all ? "" : "Password does not meet all the rules");
      if (conf)
        conf.setCustomValidity(
          conf.value === inp.value ? "" : "Passwords do not match",
        );
    };
    inp.addEventListener("focus", () => (holder.hidden = false));
    inp.addEventListener("input", () => {
      holder.hidden = false;
      check();
    });
    if (conf) conf.addEventListener("input", check);
    inp.form.addEventListener("reset", () =>
      setTimeout(() => {
        check();
        holder.hidden = true;
      }, 0),
    );
    check();
  },
);

/* ---------- contact form and newsletter (saved in this browser only) ---------- */
if ($("#contactForm"))
  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const m = store.get("ac_messages", []);
    m.push({
      name: e.target.name.value,
      email: e.target.email.value,
      message: e.target.message.value,
      date: new Date().toISOString(),
    });
    store.set("ac_messages", m);
    e.target.reset();
    toast("Message sent. We will reply soon");
  });
$("#newsForm").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  toast("Thanks for subscribing");
});
