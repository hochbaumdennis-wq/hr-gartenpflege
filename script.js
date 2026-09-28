// HR Garten & Landschaft – Kopfzeile & Kontaktformular

// Empfänger der Anfragen. Versand über FormSubmit (kostenlos, ohne eigenen Server).
// Beim allerersten Absenden schickt FormSubmit eine Bestätigungs-Mail an diese
// Adresse – dort einmal auf „Activate“ klicken, danach kommen alle Anfragen an.
const RECIPIENT = "hr.gartenpflege@gmail.com";
const ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT}`;

const header = document.querySelector(".site-header");
const dialog = document.getElementById("contact-dialog");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = form.querySelector('button[type="submit"]');

document.getElementById("year").textContent = new Date().getFullYear();

// Kopfzeile beim Scrollen etwas kräftiger einfärben
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Dialog öffnen / schließen
function openContact() {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  form.querySelector('input[name="name"]').focus();
}

function closeContact() {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

document.querySelectorAll("[data-open-contact]").forEach((el) => el.addEventListener("click", openContact));
document.querySelectorAll("[data-close-contact]").forEach((el) => el.addEventListener("click", closeContact));

// Klick auf den abgedunkelten Hintergrund schließt den Dialog
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) closeContact();
});

// Direktlink …/#kontakt öffnet das Formular
if (location.hash === "#kontakt") openContact();

// Validierung
function setStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = "form-status" + (type ? ` is-${type}` : "");
}

function validate() {
  let firstInvalid = null;
  form.querySelectorAll("[required]").forEach((el) => {
    const ok = el.type === "checkbox" ? el.checked : el.checkValidity() && el.value.trim() !== "";
    el.setAttribute("aria-invalid", String(!ok));
    if (el.type === "checkbox") el.closest(".consent").classList.toggle("is-invalid", !ok);
    if (!ok && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    const email = form.elements.email;
    setStatus(
      firstInvalid === email && email.value.trim()
        ? "Bitte eine gültige E-Mail-Adresse eingeben."
        : "Bitte alle Pflichtfelder (*) ausfüllen.",
      "error"
    );
    return false;
  }
  return true;
}

form.addEventListener("input", (e) => {
  if (e.target.getAttribute("aria-invalid") === "true") validate() && setStatus("");
});

function mailtoFallback(data) {
  const body = [
    `Name: ${data.name}`,
    `Telefon: ${data.telefon || "-"}`,
    `E-Mail: ${data.email}`,
    `Adresse: ${data.adresse || "-"}`,
    `Leistung: ${data.leistung}`,
    "",
    data.nachricht,
  ].join("\n");
  return `mailto:${RECIPIENT}?subject=${encodeURIComponent("Anfrage: " + data.leistung)}&body=${encodeURIComponent(body)}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form));
  if (data._honey) return; // Bot

  submitBtn.disabled = true;
  setStatus("Wird gesendet …");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: `Neue Anfrage über die Website: ${data.leistung}`,
        _template: "table",
        _captcha: "false",
        _replyto: data.email,
        Name: data.name,
        Telefon: data.telefon || "-",
        "E-Mail": data.email,
        Adresse: data.adresse || "-",
        Leistung: data.leistung,
        Nachricht: data.nachricht,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false || json.success === "false") throw new Error(json.message || res.status);

    form.reset();
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    setStatus("Vielen Dank! Ihre Anfrage ist bei uns eingegangen – wir melden uns zeitnah.", "ok");
  } catch (err) {
    statusEl.className = "form-status is-error";
    statusEl.innerHTML =
      `Senden hat leider nicht geklappt. <a href="${mailtoFallback(data)}">Per E-Mail senden</a> ` +
      `oder anrufen: <a href="tel:+4917672484502">0176 72484502</a>`;
  } finally {
    submitBtn.disabled = false;
  }
});
