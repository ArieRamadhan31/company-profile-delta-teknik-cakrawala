// ===== Mode gelap / terang =====
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
function updateThemeIcon() {
  const dark = currentTheme() === 'dark';
  themeToggle.textContent = dark ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
  themeToggle.title = themeToggle.getAttribute('aria-label');
}
themeToggle.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  updateThemeIcon();
});
// Ikuti perubahan tema sistem jika pengunjung belum memilih sendiri
darkQuery.addEventListener('change', updateThemeIcon);
updateThemeIcon();

// ===== Navbar: efek scroll & tombol ke atas =====
const navbar = document.getElementById('navbar');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
  toTop.classList.toggle('show', window.scrollY > 600);
}, { passive: true });

// ===== Menu mobile =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
function toggleMenu(force) {
  const open = typeof force === 'boolean' ? force : !navLinks.classList.contains('open');
  navLinks.classList.toggle('open', open);
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('menu-open', open);
}
hamburger.addEventListener('click', () => toggleMenu());
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

// ===== Link aktif sesuai section =====
const sections = document.querySelectorAll('section[id]');
const linkObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.querySelectorAll('a').forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => linkObserver.observe(s));

// ===== Animasi muncul saat scroll =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 0.08 + 's';
  revealObserver.observe(el);
});

// ===== Counter angka statistik =====
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    const start = performance.now();
    const dur = 1600;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ===== Filter portofolio =====
document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.work').forEach(w => {
      w.classList.toggle('hide', f !== 'all' && w.dataset.cat !== f);
    });
  });
});

// ===== Form kontak: kirim ke Email (Web3Forms) + buka WhatsApp =====
// Access key didapat gratis dari https://web3forms.com (masukkan email info.contact@pt-dtc.com)
const WEB3FORMS_KEY = 'ISI_ACCESS_KEY_DI_SINI';
const WA_NUMBER = '6282218129785';

const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('formMsg');
  const btn = form.querySelector('button[type="submit"]');
  const d = Object.fromEntries(new FormData(form));

  // Abaikan jika honeypot terisi (bot spam)
  if (d.botcheck) return;

  // 1) Buka WhatsApp dengan pesan yang sudah terisi
  //    (dibuka langsung saat klik agar tidak diblokir popup blocker)
  const waText =
    `Halo PT Delta Teknik Cakrawala, saya ingin meminta penawaran.\n\n` +
    `Nama: ${d.nama}\n` +
    (d.perusahaan ? `Perusahaan: ${d.perusahaan}\n` : '') +
    `Email: ${d.email}\n` +
    (d.telepon ? `No. Telp/WA: ${d.telepon}\n` : '') +
    `Layanan: ${d.layanan}\n\n` +
    `Detail pekerjaan:\n${d.pesan}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`, '_blank');

  // 2) Kirim salinan ke email lewat Web3Forms
  if (WEB3FORMS_KEY === 'ISI_ACCESS_KEY_DI_SINI') {
    console.warn('Web3Forms access key belum diisi di script.js, email tidak dikirim.');
    msg.style.color = '';
    msg.textContent = '✅ Silakan lanjutkan pengiriman pesan di WhatsApp.';
    form.reset();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Mengirim...';
  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Permintaan Penawaran: ${d.layanan} (${d.nama})`,
        from_name: 'Website PT Delta Teknik Cakrawala',
        replyto: d.email,
        Nama: d.nama,
        Email: d.email,
        Perusahaan: d.perusahaan || '-',
        'No. Telp/WA': d.telepon || '-',
        Layanan: d.layanan,
        'Detail Pekerjaan': d.pesan
      })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    msg.style.color = '';
    msg.textContent = '✅ Terima kasih! Permintaan Anda sudah terkirim. Silakan lanjutkan di WhatsApp.';
    form.reset();
  } catch (err) {
    console.error(err);
    msg.style.color = '#dc2626';
    msg.textContent = '⚠️ Gagal mengirim email. Silakan hubungi kami lewat WhatsApp.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim Permintaan';
    setTimeout(() => (msg.textContent = ''), 8000);
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
