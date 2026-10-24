const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');

if (menuButton && navigation) {
  menuButton.hidden = false;
  navigation.classList.add('menu-ready');
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.header')) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}

// Motion is progressive enhancement: every section is visible without JavaScript.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const motionButton = document.querySelector('.motion-toggle');
const hero = document.querySelector('.hero');
const artwork = document.querySelector('.hero-art');
const canvas = document.querySelector('.particle-field');
const context = canvas?.getContext('2d');
const progress = document.querySelector('.reading-progress');
let paused = false;
let heroVisible = true;
let frame = 0;
let scrollFrame = 0;
let lastTime = 0;
let elapsed = 0;
let lastParticleTime = 0;
let canvasWidth = 0;
let canvasHeight = 0;
const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };
const particles = Array.from({ length: 42 }, (_, index) => ({
  x: ((index * 73 + 19) % 997) / 997,
  y: ((index * 131 + 71) % 991) / 991,
  speed: 0.3 + (index % 5) * 0.13,
  radius: index % 4 === 0 ? 1.8 : 1,
}));
const motionEnabled = () => !paused && !reducedMotion.matches;

function resizeCanvas() {
  if (!canvas || !context) return;
  const bounds = canvas.getBoundingClientRect();
  canvasWidth = bounds.width;
  canvasHeight = bounds.height;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvasWidth * ratio);
  canvas.height = Math.round(canvasHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  renderParticles(elapsed);
}

function renderParticles(time) {
  if (!context) return;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  const points = particles.map((particle) => ({
    x: particle.x * canvasWidth + Math.sin(time * particle.speed + particle.y * 6) * 15,
    y: particle.y * canvasHeight + Math.cos(time * particle.speed + particle.x * 6) * 18,
    radius: particle.radius,
  }));
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    context.fillStyle = index % 4 === 0 ? '#d9f27799' : '#c9c6ff88';
    context.beginPath();
    context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    context.fill();
    for (let next = index + 1; next < points.length; next += 1) {
      const other = points[next];
      const distanceSquared = (point.x - other.x) ** 2 + (point.y - other.y) ** 2;
      if (distanceSquared < 85 ** 2) {
        context.strokeStyle = `rgba(179, 173, 255, ${0.13 * (1 - distanceSquared / 85 ** 2)})`;
        context.beginPath();
        context.moveTo(point.x, point.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }
  }
}

function animate(time) {
  frame = 0;
  if (!motionEnabled() || !heroVisible || document.hidden) return;
  const delta = lastTime ? Math.min(time - lastTime, 50) : 16;
  lastTime = time;
  elapsed += delta / 1000;
  const smoothing = 1 - Math.exp(-delta / 110);
  pointer.currentX += (pointer.x - pointer.currentX) * smoothing;
  pointer.currentY += (pointer.y - pointer.currentY) * smoothing;
  artwork?.style.setProperty('--pointer-x', `${pointer.currentX.toFixed(3)}`);
  artwork?.style.setProperty('--pointer-y', `${pointer.currentY.toFixed(3)}`);
  if (time - lastParticleTime >= 1000 / 30) {
    renderParticles(elapsed);
    lastParticleTime = time;
  }
  frame = requestAnimationFrame(animate);
}

function startMotion() {
  if (!frame && motionEnabled() && heroVisible && !document.hidden) {
    lastTime = 0;
    frame = requestAnimationFrame(animate);
  }
}

function syncMotion() {
  document.body.classList.add('motion-ready');
  document.body.classList.toggle('motion-paused', !motionEnabled());
  if (motionButton) {
    motionButton.hidden = reducedMotion.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
  }
  if (!motionEnabled()) {
    cancelAnimationFrame(frame);
    frame = 0;
    document.getAnimations().forEach((animation) => {
      if (animation.effect instanceof KeyframeEffect && animation.id === 'section-reveal') animation.finish();
    });
    pointer.x = 0;
    pointer.y = 0;
    pointer.currentX = 0;
    pointer.currentY = 0;
    artwork?.style.setProperty('--pointer-x', '0');
    artwork?.style.setProperty('--pointer-y', '0');
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
    renderParticles(elapsed);
  } else {
    startMotion();
  }
}

motionButton?.addEventListener('click', () => {
  paused = !paused;
  syncMotion();
});
reducedMotion.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else startMotion();
});

hero?.addEventListener('pointermove', (event) => {
  if (!motionEnabled() || !finePointer.matches || event.pointerType === 'touch') return;
  const bounds = hero.getBoundingClientRect();
  pointer.x = (event.clientX - bounds.left) / bounds.width - 0.5;
  pointer.y = (event.clientY - bounds.top) / bounds.height - 0.5;
});
hero?.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });

if ('ResizeObserver' in window && canvas) new ResizeObserver(resizeCanvas).observe(canvas);
else window.addEventListener('resize', resizeCanvas);
resizeCanvas();

if ('IntersectionObserver' in window) {
  if (hero) new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    hero.classList.toggle('out-of-view', !heroVisible);
    if (heroVisible) startMotion();
    else { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '80px' }).observe(hero);

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (motionEnabled()) {
        const animation = entry.target.animate([
          { opacity: 0, transform: 'translateY(30px)', filter: 'blur(3px)' },
          { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
        ], { duration: 750, delay: Number(entry.target.dataset.revealDelay || 0), easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
        animation.id = 'section-reveal';
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.section-heading, .principle, .playground-heading, .playground-shell, .experience-heading, .role, .toolkit-intro, .skill-groups > div, .credentials > div, .contact-inner > div').forEach((element) => revealObserver.observe(element));

  const decorationObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle('out-of-view', !entry.isIntersecting));
  }, { rootMargin: '80px' });
  document.querySelectorAll('.playground-section, .toolkit, .contact').forEach((element) => decorationObserver.observe(element));
}

document.querySelectorAll('.principle').forEach((card, index) => {
  card.dataset.tilt = '';
  card.dataset.revealDelay = String(index * 90);
  card.addEventListener('pointermove', (event) => {
    if (!motionEnabled() || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty('--tilt-x', `${(0.5 - y) * 7}deg`);
    card.style.setProperty('--tilt-y', `${(x - 0.5) * 7}deg`);
    card.style.setProperty('--shine-x', `${x * 100}%`);
    card.style.setProperty('--shine-y', `${y * 100}%`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

const sectionLinks = [...document.querySelectorAll('#navigation a')];
const sections = [...document.querySelectorAll('main section[id]')];
const experience = document.querySelector('.roles');
function updateScroll() {
  scrollFrame = 0;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  progress?.style.setProperty('--progress', String(maxScroll > 0 ? scrollY / maxScroll : 0));
  document.body.classList.toggle('has-scrolled', scrollY > 35);
  const active = sections.filter((section) => section.getBoundingClientRect().top <= innerHeight * 0.4).at(-1);
  sectionLinks.forEach((link) => {
    if (link.getAttribute('href') === `#${active?.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (experience) {
    const bounds = experience.getBoundingClientRect();
    const amount = Math.max(0, Math.min(1, (innerHeight * 0.65 - bounds.top) / bounds.height));
    experience.style.setProperty('--journey-progress', String(amount));
  }
}
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}, { passive: true });
window.addEventListener('resize', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); });
updateScroll();
syncMotion();
