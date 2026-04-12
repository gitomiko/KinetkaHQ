const ICON_CDN = "https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/svg";

const DEFAULT_PORTAL_CONFIG = {
  shell: {
    pageTitle: "Kinetika HQ",
    description: "Kinetika HQ portal template for internal tool launch and navigation.",
    eyebrow: "KINETIKA CONTROL PLANE",
    title: "Kinetika HQ",
    lead: "Configurable launcher template for internal tools, apps, and service navigation.",
    locationPill: "Template Build",
    modePill: "Public-safe Demo",
    versionLabel: "Public Template 1.0",
  },
  routing: {
    privateSuffix: ".internal.example",
    publicSuffix: ".example.com",
  },
  groups: [
    {
      title: "Operations",
      note: "Example administrative surfaces for an internal team portal.",
      items: [
        {
          name: "Admin Console",
          description: "Example control surface for operational workflows.",
          href: "https://example.com/admin-console",
          mark: "AC",
          status: "live",
        },
        {
          name: "Identity",
          description: "Example entry point for authentication and access flows.",
          href: "https://example.com/identity",
          mark: "ID",
          status: "live",
        },
        {
          name: "Observability",
          description: "Example metrics and status dashboard.",
          href: "https://example.com/observability",
          mark: "OB",
          status: "live",
        },
      ],
    },
    {
      title: "Workspace",
      note: "Example productivity and collaboration destinations.",
      items: [
        {
          name: "Files",
          description: "Example document and file workspace.",
          href: "https://example.com/files",
          mark: "FL",
          status: "live",
        },
        {
          name: "Photos",
          description: "Example media gallery destination.",
          href: "https://example.com/photos",
          mark: "PH",
          status: "live",
        },
        {
          name: "Requests",
          description: "Example service request surface.",
          href: "https://example.com/requests",
          mark: "RQ",
          status: "live",
        },
      ],
    },
    {
      title: "Automation",
      note: "Example queueing, jobs, and process lanes.",
      items: [
        {
          name: "Automations",
          description: "Example workflow and job launcher.",
          href: "https://example.com/automations",
          mark: "AU",
          status: "live",
        },
        {
          name: "Scheduled Jobs",
          description: "Example scheduled background process lane.",
          href: "https://example.com/jobs",
          mark: "JB",
          status: "live",
        },
        {
          name: "Upcoming Service",
          description: "Placeholder card showing the planned state.",
          mark: "SO",
          status: "soon",
        },
      ],
    },
  ],
};

let appGroups = DEFAULT_PORTAL_CONFIG.groups;
let PRIVATE_SUFFIX = DEFAULT_PORTAL_CONFIG.routing.privateSuffix;
let PUBLIC_SUFFIX = DEFAULT_PORTAL_CONFIG.routing.publicSuffix;

const groupsHost = document.getElementById("groups");
const searchInput = document.getElementById("searchInput");
const clock = document.getElementById("clock");
const themeToggle = document.getElementById("themeToggle");
const eyebrowText = document.getElementById("eyebrowText");
const titleText = document.getElementById("titleText");
const leadText = document.getElementById("leadText");
const locationPill = document.getElementById("locationPill");
const modePill = document.getElementById("modePill");
const footerVersion = document.getElementById("footerVersion");
const descriptionMeta = document.querySelector('meta[name="description"]');
const THEME_STORAGE_KEY = "kinetika-hq-theme";
const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

function systemTheme() {
  return darkMediaQuery.matches ? "dark" : "light";
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return systemTheme();
}

function updateThemeToggle(theme) {
  if (!themeToggle) return;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const nextLabel = nextTheme === "dark" ? "Dark" : "Light";
  themeToggle.textContent = `Theme: ${theme === "dark" ? "Dark" : "Light"}`;
  themeToggle.setAttribute("aria-label", `Switch to ${nextLabel} mode`);
  themeToggle.title = `Switch to ${nextLabel} mode`;
}

function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalized);
  updateThemeToggle(normalized);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
}

function formatNow() {
  const now = new Date();
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(now);
}

async function canReach(url, timeoutMs = 1400) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function toPublicHref(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(PRIVATE_SUFFIX)) return "";
    const prefix = parsed.hostname.slice(0, -PRIVATE_SUFFIX.length);
    parsed.hostname = `${prefix}${PUBLIC_SUFFIX}`;
    return parsed.toString();
  } catch {
    return "";
  }
}

function isIpv4Host(hostname) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function resolvePortFromUrl(url, allowDefaultForDirectIp = false) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.port) return parsed.port;
    if (!allowDefaultForDirectIp || !isIpv4Host(parsed.hostname)) return "";
    if (parsed.protocol === "http:") return "80";
    if (parsed.protocol === "https:") return "443";
    return "";
  } catch {
    return "";
  }
}

function resolveNodePort(item) {
  const candidates = [item.fallbackHref, item.homeHref, item.href, item.publicHref];

  for (const candidate of candidates) {
    const port = resolvePortFromUrl(candidate);
    if (port) return port;
  }

  for (const candidate of candidates) {
    const port = resolvePortFromUrl(candidate, true);
    if (port) return port;
  }

  return "";
}

function resolveTargets(item) {
  const privatePreferred =
    typeof window !== "undefined" &&
    PRIVATE_SUFFIX &&
    window.location.hostname.endsWith(PRIVATE_SUFFIX);
  const homeHref = item.homeHref || item.href || "";
  const publicHref = item.publicHref || toPublicHref(homeHref);
  const targets = [];

  if (privatePreferred) {
    if (homeHref) targets.push(homeHref);
    if (publicHref && !targets.includes(publicHref)) targets.push(publicHref);
  } else {
    if (publicHref) targets.push(publicHref);
    if (homeHref && !targets.includes(homeHref)) targets.push(homeHref);
  }

  if (privatePreferred && item.fallbackHref && !targets.includes(item.fallbackHref)) {
    targets.push(item.fallbackHref);
  }

  return targets;
}

async function pickHref(item) {
  const targets = resolveTargets(item);
  if (targets.length === 0) return "";
  if (targets.length === 1) return targets[0];

  for (const candidate of targets) {
    if (await canReach(candidate, 3000)) return candidate;
  }

  return targets[0];
}

const INFRA_LEAK_RE = /\bnode\s*\d+\b|\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/gi;

function safeText(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(INFRA_LEAK_RE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-–—,.:]+/, "")
    .trim();
}

function makeCard(item) {
  const live = item.status === "live";
  const card = document.createElement(live ? "a" : "article");
  card.className = `card${live ? "" : " card-disabled"}`;

  if (live) {
    const targets = resolveTargets(item);
    const defaultHref = targets[0] || item.href || "#";

    card.href = defaultHref;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    card.addEventListener("click", (event) => {
      event.preventDefault();
      const popup = window.open("about:blank", "_blank");
      if (popup) popup.opener = null;

      pickHref(item).then((target) => {
        const finalTarget = target || defaultHref;
        if (popup && !popup.closed) {
          popup.location.replace(finalTarget);
          return;
        }
        window.open(finalTarget, "_blank", "noopener,noreferrer");
      });
    });
  }

  const statusClass = live ? "tag-live" : "tag-soon";
  const statusText = live ? "LIVE" : "SOON";

  card.innerHTML = `
    <div class="card-banner"></div>
    <div class="card-main">
      <div class="mark${item.logo ? "" : " mark-fallback"}" data-mark="${item.mark}">
        ${
          item.logo
            ? `<img class="mark-icon" src="${item.logo}" alt="${item.name} logo" loading="lazy" referrerpolicy="no-referrer" />`
            : item.mark
        }
      </div>
      <div>
        <h3>${safeText(item.name)}</h3>
        <p class="desc">${safeText(item.description)}</p>
        <div class="tags">
          <span class="tag ${statusClass}">${statusText}</span>
        </div>
      </div>
    </div>
  `;

  return card;
}

function wireMarkFallbacks(root = groupsHost) {
  root.querySelectorAll(".mark-icon").forEach((img) => {
    img.addEventListener(
      "error",
      () => {
        const holder = img.closest(".mark");
        if (!holder) return;
        holder.classList.add("mark-fallback");
        holder.textContent = holder.dataset.mark || "";
      },
      { once: true },
    );
  });
}

function renderGroups(filter = "") {
  const keyword = filter.trim().toLowerCase();
  groupsHost.innerHTML = "";

  let totalVisible = 0;

  for (const group of appGroups) {
    const matched = group.items.filter((item) => {
      if (!keyword) return true;
      return [
        safeText(item.name),
        safeText(item.description),
        safeText(group.title),
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    if (matched.length === 0) continue;

    totalVisible += matched.length;

    const wrapper = document.createElement("section");
    wrapper.className = "group";

    const head = document.createElement("div");
    head.className = "group-head";
    head.innerHTML = `
      <div>
        <h2 class="group-title">${safeText(group.title)}</h2>
        <p class="group-note">${safeText(group.note)}</p>
      </div>
      <span class="group-count">${matched.length} apps</span>
    `;

    const cards = document.createElement("div");
    cards.className = "cards";
    matched.forEach((item) => cards.appendChild(makeCard(item)));

    wrapper.appendChild(head);
    wrapper.appendChild(cards);
    groupsHost.appendChild(wrapper);
  }

  if (totalVisible === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No apps matched this search.";
    groupsHost.appendChild(empty);
  }

  wireMarkFallbacks(groupsHost);
}

function tickClock() {
  clock.textContent = formatNow();
}

function applyShell(shell) {
  document.title = shell.pageTitle || DEFAULT_PORTAL_CONFIG.shell.pageTitle;
  if (descriptionMeta) {
    descriptionMeta.setAttribute(
      "content",
      shell.description || DEFAULT_PORTAL_CONFIG.shell.description,
    );
  }
  const setOrHide = (el, value) => {
    if (!el) return;
    const clean = safeText(value);
    el.textContent = clean;
    el.hidden = !clean;
  };

  if (eyebrowText) eyebrowText.textContent = safeText(shell.eyebrow);
  if (titleText) titleText.textContent = safeText(shell.title);
  if (leadText) leadText.textContent = safeText(shell.lead);
  setOrHide(locationPill, shell.locationPill);
  setOrHide(modePill, shell.modePill);
  if (footerVersion) footerVersion.textContent = safeText(shell.versionLabel);
}

function normalizeConfig(override) {
  const config = override && typeof override === "object" ? override : {};
  const shell = { ...DEFAULT_PORTAL_CONFIG.shell, ...(config.shell || {}) };
  const routing = { ...DEFAULT_PORTAL_CONFIG.routing, ...(config.routing || {}) };
  const groups =
    Array.isArray(config.groups) && config.groups.length > 0
      ? config.groups
      : DEFAULT_PORTAL_CONFIG.groups;

  return { shell, routing, groups };
}

function loadLocalConfig() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "config.local.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

searchInput.addEventListener("input", (event) => {
  renderGroups(event.target.value);
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "k") {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

const handleSystemThemeChange = () => {
  if (localStorage.getItem(THEME_STORAGE_KEY)) return;
  applyTheme(systemTheme());
};

if (typeof darkMediaQuery.addEventListener === "function") {
  darkMediaQuery.addEventListener("change", handleSystemThemeChange);
} else if (typeof darkMediaQuery.addListener === "function") {
  darkMediaQuery.addListener(handleSystemThemeChange);
}

async function bootstrap() {
  await loadLocalConfig();

  const config = normalizeConfig(window.KINETIKA_HQ_CONFIG);
  appGroups = config.groups;
  PRIVATE_SUFFIX = config.routing.privateSuffix;
  PUBLIC_SUFFIX = config.routing.publicSuffix;

  applyShell(config.shell);
  applyTheme(loadTheme());
  renderGroups();
  tickClock();
  setInterval(tickClock, 1000);
}

bootstrap();
