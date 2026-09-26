(() => {
  const CONTRACT = "0x8dac5f5a1c9925c3d8fafa1e87a831804faf45c4";
  const DEX_ARC = "https://dexscreener.com/arc";
  const UNISWAP_ARC = "https://app.uniswap.org/swap?chain=arc";
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
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxTitle = document.getElementById("lightbox-title");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (CONTRACT) {
    caText.textContent = CONTRACT;
    const pairUrl = `${DEX_ARC}/${CONTRACT}`;
    embed.src = `${pairUrl}?embed=1&theme=dark&trades=0&info=0&chartTheme=dark`;
    document.querySelectorAll('a[href="https://dexscreener.com/arc"]').forEach((link) => {
      link.href = pairUrl;
    });
    const swapUrl = `${UNISWAP_ARC}&outputCurrency=${CONTRACT}`;
    document.querySelectorAll(`a[href="${UNISWAP_ARC}"]`).forEach((link) => {
      link.href = swapUrl;
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
    toggle.setAttribute("aria-expanded", String(drawer.classList.contains("open")));
  });

  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      drawer.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll(".gallery-card").forEach((card) => {
    card.addEventListener("click", () => {
      const image = card.querySelector("img");
      const title = card.querySelector(".gallery-meta strong");
      lightboxImage.src = card.dataset.full;
      lightboxImage.alt = image.alt;
      lightboxTitle.textContent = title.textContent;
      lightbox.showModal();
    });
  });

  document.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });

  const CHAT_MEMORY_KEY = "archan-chat-v1";
  const CHAT_ENDPOINT = "/api/chat";
  const chatLaunch = document.getElementById("chat-launch");
  const chatShell = document.getElementById("arc-chat");
  const chatClose = document.getElementById("chat-close");
  const chatFeed = document.getElementById("chat-feed");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatSend = chatForm.querySelector(".chat-send");
  const suggestions = chatFeed.querySelector(".chat-suggestions");
  let chatBusy = false;
  let chatHistory = [];

  try {
    const saved = JSON.parse(sessionStorage.getItem(CHAT_MEMORY_KEY) || "[]");
    if (Array.isArray(saved)) chatHistory = saved.slice(-12);
  } catch {
    chatHistory = [];
  }

  function scrollChat() {
    requestAnimationFrame(() => {
      chatFeed.scrollTop = chatFeed.scrollHeight;
    });
  }

  function addChatMessage(role, text, state = "") {
    const row = document.createElement("div");
    row.className = `chat-message ${role}${state ? ` ${state}` : ""}`;

    if (role === "agent") {
      const avatar = document.createElement("span");
      avatar.className = "message-avatar";
      const image = document.createElement("img");
      image.src = "assets/logo.png";
      image.alt = "";
      avatar.appendChild(image);
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    chatFeed.insertBefore(row, suggestions);
    scrollChat();
    return row;
  }

  function addTypingMessage() {
    const row = addChatMessage("agent", "");
    row.classList.add("typing");
    row.querySelector(".message-bubble").innerHTML =
      '<span class="typing-dots" aria-label="Arc Chan is typing"><i></i><i></i><i></i></span>';
    return row;
  }

  function setChatOpen(open) {
    chatShell.classList.toggle("open", open);
    chatLaunch.classList.toggle("hidden", open);
    chatShell.setAttribute("aria-hidden", String(!open));
    chatLaunch.setAttribute("aria-expanded", String(open));
    if (open) {
      window.setTimeout(() => chatInput.focus(), 180);
      scrollChat();
    }
  }

  chatHistory.forEach((message) => {
    if (message?.role === "user" || message?.role === "assistant") {
      addChatMessage(message.role === "user" ? "user" : "agent", String(message.content || ""));
    }
  });

  chatLaunch.addEventListener("click", () => setChatOpen(true));
  chatClose.addEventListener("click", () => setChatOpen(false));

  suggestions.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      chatInput.value = button.textContent;
      chatForm.requestSubmit();
    });
  });

  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 110)}px`;
  });

  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message || chatBusy) return;

    chatBusy = true;
    chatSend.disabled = true;
    chatInput.disabled = true;
    chatInput.value = "";
    chatInput.style.height = "auto";
    suggestions.hidden = true;
    addChatMessage("user", message);
    chatHistory.push({ role: "user", content: message });
    const typing = addTypingMessage();
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ messages: chatHistory.slice(-12) }),
      });
      const data = await response.json().catch(() => ({}));
      const reply = String(data?.reply || "").trim();
      if (!response.ok || !reply) {
        throw new Error(data?.error || `Chat returned ${response.status}`);
      }

      typing.remove();
      addChatMessage("agent", reply);
      chatHistory.push({ role: "assistant", content: reply });
      chatHistory = chatHistory.slice(-12);
      sessionStorage.setItem(CHAT_MEMORY_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      typing.remove();
      const timedOut = error?.name === "AbortError";
      addChatMessage(
        "agent",
        timedOut
          ? "The signal timed out. Try transmitting again in a moment."
          : "My Grok relay is busy right now. Please try again shortly ✦",
        "error",
      );
    } finally {
      window.clearTimeout(requestTimeout);
      chatBusy = false;
      chatSend.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
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
