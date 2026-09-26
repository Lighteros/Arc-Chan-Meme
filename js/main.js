(() => {
  const CONTRACT = "";
  const DEX_ARC = "https://dexscreener.com/arc";
  const DEX_EMBED =
    "https://dexscreener.com/arc?embed=1&theme=dark&trades=0&info=0&chartTheme=dark";

  const canvas = document.getElementById("field");
  const ctx = canvas.getContext("2d", { alpha: true });
  const halo = document.querySelector(".cursor-halo");
  const toggle = document.querySelector(".menu-toggle");
  const drawer = document.getElementById("drawer");
  const caText = document.getElementById("ca-text");
  const copyBtn = document.getElementById("copy-ca");
  const embed = document.getElementById("dex-embed");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (CONTRACT) {
    caText.textContent = CONTRACT;
    const pairUrl = `${DEX_ARC}/${CONTRACT}`;
    embed.src = `${pairUrl}?embed=1&theme=dark&trades=0&info=0&chartTheme=dark`;
    document.querySelectorAll('a[href="https://dexscreener.com/arc"]').forEach((link) => {
      link.href = pairUrl;
    });
  } else {
    embed.src = DEX_EMBED;
  }

  copyBtn.addEventListener("click", async () => {
    const value = CONTRACT || "Arc Chan pair pending on Arc Chain";
    try {
      await navigator.clipboard.writeText(value);
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Failed";
    }
    window.setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 1400);
  });

  toggle.addEventListener("click", () => {
    drawer.classList.toggle("open");
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => drawer.classList.remove("open"));
  });

  let mouseX = window.innerWidth * 0.7;
  let mouseY = window.innerHeight * 0.3;
  let haloX = mouseX;
  let haloY = mouseY;

  window.addEventListener("pointermove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  const particles = [];
  const filaments = [];

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function seed() {
    particles.length = 0;
    filaments.length = 0;
    const count = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        a: Math.random() * 0.6 + 0.15,
      });
    }
    for (let i = 0; i < 7; i += 1) {
      filaments.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        len: 80 + Math.random() * 160,
        ang: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.004,
        hue: 186 + Math.random() * 18,
      });
    }
  }

  function tick() {
    haloX += (mouseX - haloX) * 0.08;
    haloY += (mouseY - haloY) * 0.08;
    halo.style.transform = `translate(${haloX}px, ${haloY}px)`;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const aura = ctx.createRadialGradient(haloX, haloY, 0, haloX, haloY, 240);
    aura.addColorStop(0, "rgba(78, 232, 255, 0.10)");
    aura.addColorStop(1, "rgba(78, 232, 255, 0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    filaments.forEach((line) => {
      line.ang += line.spin;
      ctx.save();
      ctx.translate(line.x, line.y);
      ctx.rotate(line.ang);
      const grad = ctx.createLinearGradient(-line.len, 0, line.len, 0);
      grad.addColorStop(0, "rgba(78, 232, 255, 0)");
      grad.addColorStop(0.5, "rgba(78, 232, 255, 0.18)");
      grad.addColorStop(1, "rgba(78, 232, 255, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-line.len, 0);
      ctx.quadraticCurveTo(0, Math.sin(line.ang * 3) * 18, line.len, 0);
      ctx.stroke();
      ctx.restore();
    });

    particles.forEach((dot, index) => {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0) dot.x = window.innerWidth;
      if (dot.x > window.innerWidth) dot.x = 0;
      if (dot.y < 0) dot.y = window.innerHeight;
      if (dot.y > window.innerHeight) dot.y = 0;

      ctx.beginPath();
      ctx.fillStyle = `rgba(180, 236, 255, ${dot.a})`;
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = dot.x - other.x;
        const dy = dot.y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          ctx.strokeStyle = `rgba(78, 232, 255, ${0.09 * (1 - dist / 110)})`;
          ctx.beginPath();
          ctx.moveTo(dot.x, dot.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });

    if (!reduceMotion) {
      requestAnimationFrame(tick);
    }
  }

  resize();
  seed();
  window.addEventListener("resize", () => {
    resize();
    seed();
  });

  if (reduceMotion) {
    tick();
  } else {
    requestAnimationFrame(tick);
  }
})();
