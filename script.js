/* ===========================
   PARTICLE NEURAL NETWORK
   Full-screen · HiDPI · Mouse repulsion
   =========================== */

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

const DPR = window.devicePixelRatio || 1;
let W, H;

// Mouse state
const mouse = { x: -9999, y: -9999, active: false };

/* ── Resize handler ─────────────────────────────────── */
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(DPR, DPR);
}

/* ── Particle factory ───────────────────────────────── */
function makeParticle() {
    const speed = Math.random() * 0.4 + 0.1;
    const angle = Math.random() * Math.PI * 2;
    return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.8 + 0.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        // base alpha
        a: Math.random() * 0.5 + 0.2,
    };
}

let particles = [];

function initParticles() {
    // Density: ~1 particle per 8 000 px²
    const count = Math.floor((W * H) / 8000);
    particles = Array.from({ length: Math.min(count, 200) }, makeParticle);
}

/* ── Draw loop ──────────────────────────────────────── */
const MAX_DIST = 150;   // max connection distance
const MOUSE_REPEL_R = 160;   // repulsion radius
const MOUSE_REPEL_STR = 3.5;   // repulsion strength
const MOUSE_GLOW_R = 200;   // glow radius around cursor

function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Mouse glow */
    if (mouse.active) {
        const grad = ctx.createRadialGradient(
            mouse.x, mouse.y, 0,
            mouse.x, mouse.y, MOUSE_GLOW_R
        );
        grad.addColorStop(0, 'rgba(74,254,138,0.07)');
        grad.addColorStop(0.5, 'rgba(74,254,138,0.03)');
        grad.addColorStop(1, 'rgba(74,254,138,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    /* Update + draw particles */
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion
        if (mouse.active) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < MOUSE_REPEL_R && dist > 0) {
                const force = (1 - dist / MOUSE_REPEL_R) * MOUSE_REPEL_STR;
                p.vx += (dx / dist) * force * 0.08;
                p.vy += (dy / dist) * force * 0.08;
            }
        }

        // Damping (so particles don't fly off forever)
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Minimum drift so they keep moving
        const speed = Math.hypot(p.vx, p.vy);
        if (speed < 0.08) {
            p.vx += (Math.random() - 0.5) * 0.05;
            p.vy += (Math.random() - 0.5) * 0.05;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }

        // Draw connections to all particles ahead in array
        for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.hypot(dx, dy);
            if (dist < MAX_DIST) {
                const alpha = (1 - dist / MAX_DIST) * 0.25;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.strokeStyle = `rgba(74,254,138,${alpha})`;
                ctx.lineWidth = (1 - dist / MAX_DIST) * 1.2;
                ctx.stroke();
            }
        }

        // Draw dot
        // Boost alpha when near mouse
        let alpha = p.a;
        if (mouse.active) {
            const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
            if (d < MOUSE_REPEL_R) alpha = Math.min(1, p.a + (1 - d / MOUSE_REPEL_R) * 0.7);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74,254,138,${alpha})`;
        ctx.fill();

        // Glow on larger particles
        if (p.r > 1.4) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(74,254,138,${alpha * 0.12})`;
            ctx.fill();
        }
    }

    requestAnimationFrame(draw);
}

/* ── Mouse tracking ─────────────────────────────────── */
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
}, { passive: true });

window.addEventListener('mouseleave', () => { mouse.active = false; });

// Touch support
window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;
    mouse.active = true;
}, { passive: true });
window.addEventListener('touchend', () => { mouse.active = false; });

/* ── Init ───────────────────────────────────────────── */
resize();
initParticles();
draw();

window.addEventListener('resize', () => {
    resize();
    initParticles();
}, { passive: true });


/* ===========================
   TYPEWRITER EFFECT
   =========================== */
const roles = [
    'Cybersecurity Enthusiast',
    'Information Systems Engineering Student',
    'Python Developer',
    'Problem Solver',
];
let roleIdx = 0;
let charIdx = 0;
let deleting = false;
const typeEl = document.getElementById('typewriter');

function type() {
    const current = roles[roleIdx];
    if (!deleting) {
        typeEl.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) {
            deleting = true;
            setTimeout(type, 1800);
            return;
        }
    } else {
        typeEl.textContent = current.slice(0, --charIdx);
        if (charIdx === 0) {
            deleting = false;
            roleIdx = (roleIdx + 1) % roles.length;
        }
    }
    setTimeout(type, deleting ? 55 : 95);
}
type();


/* ===========================
   NAVBAR SCROLL BEHAVIOUR
   =========================== */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveLink();
}, { passive: true });


/* ===========================
   ACTIVE NAV LINK
   =========================== */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveLink() {
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 160) current = sec.id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === current);
    });
}
updateActiveLink();


/* ===========================
   HAMBURGER MENU
   =========================== */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
});

navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
    });
});


/* ===========================
   SCROLL REVEAL
   =========================== */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const siblings = [...entry.target.parentElement.children]
                    .filter(el => el.classList.contains('reveal'));
                const delay = siblings.indexOf(entry.target) * 80;
                setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);
revealEls.forEach(el => observer.observe(el));


/* ===========================
   SKILL CARDS STAGGER
   =========================== */
const skillCards = document.querySelectorAll('.skill-card');
const skillObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            skillCards.forEach((card, i) => {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 60);
            });
            skillObserver.disconnect();
        }
    });
}, { threshold: 0.2 });

skillCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity .5s ease, transform .5s ease';
});
if (skillCards.length) skillObserver.observe(skillCards[0].closest('.skills-wrap'));


/* ===========================
   PROJECT CARDS POP-IN
   =========================== */
const cardPopEls = document.querySelectorAll('.card-pop');
const cardPopObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            cardPopEls.forEach(card => card.classList.add('popped'));
            cardPopObserver.disconnect();
        }
    });
}, { threshold: 0.08 });
if (cardPopEls.length) cardPopObserver.observe(cardPopEls[0].closest('.projects-grid'));
