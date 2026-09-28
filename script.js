const portfolioSiteData = window.portfolioSiteData;

if (!portfolioSiteData) {
  throw new Error("Portfolio content data is missing. Load content-data.js before script.js.");
}

const { assets, links, content } = portfolioSiteData;

const app = document.getElementById("app");
const pageType = app?.dataset.page || "home";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderList(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderMetricPills(metrics) {
  return metrics.map((metric) => `<span>${escapeHtml(metric)}</span>`).join("");
}

function renderTags(tags) {
  return tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

function getCaseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("case") || "akademcity";
}

function caseHref(id) {
  return `./case.html?case=${encodeURIComponent(id)}`;
}

function homeHref(id) {
  const lang = document.documentElement.lang === "en" ? "en" : "ru";
  return `./${lang === "en" ? "index.en.html" : "index.html"}#${id}`;
}

function isPlaceholderHref(href) {
  return !href || href.startsWith("#needs-");
}

function renderPublicItem(title, text, href, lang) {
  const soon = lang === "ru" ? "слот готовится" : "slot in progress";

  if (isPlaceholderHref(href)) {
    return `
      <div class="public-link is-muted reveal" aria-disabled="true">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(text)}</span>
        <em>${escapeHtml(soon)}</em>
      </div>
    `;
  }

  return `
    <a class="public-link reveal" href="${href}" ${href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </a>
  `;
}

function renderActionLink(label, href, lang) {
  const soon = lang === "ru" ? "по запросу" : "on request";

  if (isPlaceholderHref(href)) {
    return `<span class="button secondary is-disabled" aria-disabled="true">${escapeHtml(label)} · ${escapeHtml(soon)}</span>`;
  }

  return `<a class="button primary" href="${href}" ${href.startsWith("http") ? 'target="_blank" rel="noreferrer"' : ""}>${escapeHtml(label)}</a>`;
}

let portfolioSector = 'all';
let portfolioSkill = 'all';

function matchesPortfolioFilters(mapping, sector, skill) {
  return (sector === 'all' || (mapping?.sectors || []).includes(sector)) &&
    (skill === 'all' || (mapping?.skills || []).includes(skill));
}

function renderPortfolioFilters(lang) {
  const ru = lang === 'ru';
  const taxonomy = portfolioSiteData.taxonomy;
  const buttons = (items, axis) => [{id:'all',ru:'Все',en:'All'}, ...items].map(item =>
    `<button type="button" data-${axis}-filter="${escapeHtml(item.id)}" aria-controls="portfolio-grid" aria-pressed="false">${escapeHtml(item[lang])}</button>`).join('');
  return `<div class="pm-filterbar">
    <p id="sector-filter-label">${ru ? 'Сфера' : 'Sector'}</p>
    <div class="pm-filters" role="group" aria-labelledby="sector-filter-label">${buttons(taxonomy.sectors,'sector')}</div>
    <p id="skill-filter-label">${ru ? 'Задачи и навыки' : 'Tasks & skills'}</p>
    <div class="pm-filters" role="group" aria-labelledby="skill-filter-label">${buttons(taxonomy.skills,'skill')}</div>
    <div class="pm-filters"><p id="portfolio-count" role="status" aria-live="polite"></p>
    <button type="button" data-reset-filters>${ru ? 'Сбросить фильтры' : 'Reset filters'}</button></div>
  </div>`;
}

function renderCatalogCard(item, t, lang, variant = "secondary") {
  const ru = lang === 'ru';
  const taxonomy = portfolioSiteData.taxonomy;
  const mapping = taxonomy.projects[item.id] || {sectors:[],skills:[]};
  const groups = mapping.sectors;
  const skillLabels = mapping.skills.map(id => taxonomy.skills.find(skill => skill.id === id)?.[lang]).filter(Boolean);
  const media = item.cover || item.evidenceImages?.[0];
  const children = t.cases.items.filter(c => c.parentId === item.id);
  const leadClass = variant === "featured" && item.id === t.featuredCaseIds?.[0] ? " is-lead" : "";
  return `<article class="pm-catalog-card is-${escapeHtml(variant)}${leadClass}" data-project-id="${escapeHtml(item.id)}" data-sectors="${groups.join(' ')}" data-skills="${mapping.skills.join(' ')}">
    <a class="pm-card-cover ${item.id === 'rec-ai' ? 'is-phone' : ''}" href="${caseHref(item.id)}" tabindex="-1" aria-hidden="true">
      ${media ? `<img src="${escapeHtml(media.src)}" alt="" loading="lazy" />` : renderVisual(item, lang)}
      <span class="pm-cover-label">${escapeHtml(item.cover?.label || (media ? (ru ? 'Материалы проекта' : 'Project materials') : (ru ? 'Схема проекта' : 'Project diagram')))}</span>
    </a>
    <div class="pm-card-body">
      <p class="eyebrow">${escapeHtml(item.domain)}</p>
      <h3><a data-case-card href="${caseHref(item.id)}">${escapeHtml(item.title)}</a></h3>
      <p>${escapeHtml(item.short)}</p>
      ${item.cardOutcome ? `<p class="pm-outcome">${escapeHtml(item.cardOutcome)}</p>` : ''}
      <ul class="pm-tags">${renderList(skillLabels)}</ul>
      ${children.length ? `<details class="pm-subprojects"><summary>${ru ? 'Проекты внутри academcity' : 'Projects within academcity'} <span>${children.length}</span></summary><ul>${children.map(c=>`<li><a href="${caseHref(c.id)}">${escapeHtml(c.title)} ↗</a></li>`).join('')}</ul></details>` : ''}
    </div>
  </article>`;
}

function renderPortfolioCatalog(t, lang) {
  const projectIds = Object.keys(portfolioSiteData.taxonomy.projects);
  const featuredIds = (t.featuredCaseIds || []).filter((id) => projectIds.includes(id));
  const orderedIds = [...featuredIds, ...projectIds.filter((id) => !featuredIds.includes(id))];
  return getCaseItemsByIds(t, orderedIds)
    .map((item) => renderCatalogCard(item, t, lang, featuredIds.includes(item.id) ? "featured" : "secondary"))
    .join("");
}

function renderHeroEvidence(t, lang) {
  const roles = (t.hero.roles || []).map((role) => `
    <span class="pm-role ${role.primary ? "is-primary" : ""}">${escapeHtml(role.label)}</span>
  `).join("");
  const proof = (t.hero.proof || []).map(([value, label]) => `
    <div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>
  `).join("");
  return `<div class="pm-hero-evidence">
    <div class="pm-role-stack" aria-label="${lang === "ru" ? "Профессиональный профиль" : "Professional profile"}">${roles}</div>
    <div class="pm-proof-strip">${proof}</div>
  </div>`;
}

function renderManagement(t, lang) {
  if (!t.management?.items?.length) return "";
  return `<section class="section-shell pm-management" id="management">
    <div class="section-title wide reveal">
      <p class="eyebrow">${escapeHtml(t.management.eyebrow)}</p>
      <h2>${escapeHtml(t.management.title)}</h2>
      <p>${escapeHtml(t.management.intro)}</p>
    </div>
    <div class="pm-management-grid">
      ${t.management.items.map((item) => `<article>
        <p class="pm-management-type">${escapeHtml(item.type)}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
        <a href="${caseHref(item.caseId)}">${lang === "ru" ? "Открыть доказательство" : "Open evidence"} <span aria-hidden="true">↗</span></a>
      </article>`).join("")}
    </div>
  </section>`;
}

function bindPortfolioFilters(lang) {
  const buttons = [...document.querySelectorAll('[data-sector-filter]')];
  const skillButtons = [...document.querySelectorAll('[data-skill-filter]')];
  if (!buttons.length) return;
  if (!buttons.some(b => b.dataset.sectorFilter === portfolioSector)) portfolioSector = 'all';
  if (!skillButtons.some(b => b.dataset.skillFilter === portfolioSkill)) portfolioSkill = 'all';
  function update() {
    let count = 0;
    document.querySelectorAll('[data-project-id]').forEach(card => {
      card.hidden = !matchesPortfolioFilters(portfolioSiteData.taxonomy.projects[card.dataset.projectId], portfolioSector, portfolioSkill);
      if (!card.hidden) count++;
    });
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sectorFilter === portfolioSector)));
    skillButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.skillFilter === portfolioSkill)));
    const output = document.querySelector('#portfolio-count');
    if (output) output.textContent = lang === 'ru' ? `Проектов: ${count}` : `${count} ${count === 1 ? 'project' : 'projects'}`;
    const empty = document.querySelector('#portfolio-empty');
    if (empty) empty.hidden = count !== 0;
    const reset = document.querySelector('[data-reset-filters]');
    if (reset) reset.disabled = portfolioSector === 'all' && portfolioSkill === 'all';
  }
  buttons.forEach(b=>b.addEventListener('click',()=>{ portfolioSector=b.dataset.sectorFilter; update(); }));
  skillButtons.forEach(b=>b.addEventListener('click',()=>{ portfolioSkill=b.dataset.skillFilter; update(); }));
  document.querySelector('[data-reset-filters]')?.addEventListener('click',()=>{
    portfolioSector='all'; portfolioSkill='all'; update();
  });
  update();
}

function renderFocusSections(t, lang) {
  return (t.focusSections || []).map(section => `
    <section class="section-shell pm-extra" id="${escapeHtml(section.id)}" aria-labelledby="${escapeHtml(section.id)}-title">
      <h2 id="${escapeHtml(section.id)}-title">${escapeHtml(section.title)}</h2>
      <p>${escapeHtml(section.intro)}</p>
      <div class="pm-extra-list">
        ${section.items.map(item => `<a href="${caseHref(item.caseId)}">
          <strong>${escapeHtml(item.label)}</strong>
          <div class="pm-extra-copy"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div>
          <span>${lang === 'ru' ? 'Кейс' : 'Case'} <span aria-hidden="true">↗</span></span>
        </a>`).join('')}
      </div>
    </section>`).join('');
}

function renderHeader(t, lang, page = "home") {
  const externalPage = page !== "home";
  const navPrefix = externalPage ? (lang === "en" ? "./index.en.html" : "./index.html") : "";
  const brandHref = externalPage ? `${navPrefix}#top` : "#top";
  const skipTarget = page === "case" ? "#case-content" : page === "sales" ? "#sales-content" : "#about";

  return `
    <a class="skip-link" href="${skipTarget}">${escapeHtml(t.skip)}</a>
    <header class="site-header">
      <a class="brand" href="${brandHref}" aria-label="${escapeHtml(t.brand)}">
        <span class="brand-mark">MI</span>
        <span>${escapeHtml(t.brand)}</span>
      </a>
      <nav class="top-nav" aria-label="Main navigation">
        ${t.nav.map(([id, label]) => `<a href="${navPrefix}#${id}">${escapeHtml(label)}</a>`).join("")}
      </nav>
      <div class="language-switch" aria-label="Language">
        <button type="button" data-lang-switch="ru" ${lang === "ru" ? 'class="active"' : ""}>RU</button>
        <button type="button" data-lang-switch="en" ${lang === "en" ? 'class="active"' : ""}>EN</button>
      </div>
    </header>
  `;
}

function renderConstructionFlow(lang) {
  const ru = lang === "ru";
  const steps = ru
    ? [["Смета объекта", "Позиции и объёмы материалов"], ["Заявка прораба", "Что нужно на конкретной стройке"], ["Снабжение", "Получение и обработка заявки"]]
    : [["Project estimate", "Material items and quantities"], ["Site request", "What a particular site needs"], ["Procurement", "Receiving and processing the request"]];
  return `<div class="pm-flow"><p class="eyebrow">${ru ? "Сценарий заказа материалов" : "Material ordering workflow"}</p><ol>${steps.map(([title, text]) => `<li><strong>${title}</strong><span>${text}</span></li>`).join("")}</ol><p class="pm-flow-note">${ru ? "Схема по описанию проекта, не интерфейс системы." : "Reconstructed from the project description, not the system interface."}</p></div>`;
}

function renderVisual(caseItem, lang = "ru") {
  const ru = lang === "ru";
  if (caseItem.cover) return `<figure class="pm-generated-cover"><img src="${escapeHtml(caseItem.cover.src)}" alt="${escapeHtml(caseItem.title)}" /><figcaption>${escapeHtml(caseItem.cover.label)}</figcaption></figure>`;
  if (caseItem.workflow) {
    return `<div class="pm-flow"><p class="eyebrow">${escapeHtml(caseItem.workflowLabel)}</p><ol>${caseItem.workflow.map(([title, text]) => `<li><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></li>`).join("")}</ol><p class="pm-flow-note">${escapeHtml(caseItem.workflowNote)}</p></div>`;
  }
  if (caseItem.id === "construction-control") return renderConstructionFlow(lang);

  if (["akademcity", "rec-ai"].includes(caseItem.id) && caseItem.evidenceImages?.length) {
    const screens = caseItem.evidenceImages.slice(0, caseItem.id === "rec-ai" ? 2 : 1);
    return `<div class="pm-case-screens ${caseItem.id === "rec-ai" ? "is-mobile" : ""}">${screens.map(screen => `<img src="${escapeHtml(screen.src)}" alt="${escapeHtml(screen.alt)}" />`).join("")}</div>`;
  }

  if (caseItem.visual === "akademcity") {
    const labels = ru
      ? [
          ["Платформа", "путь студента и новые программы"],
          ["Рефералка", "новый канал привлечения"],
          ["Тренажёры", "практика, награды и рекомендации"],
          ["Карьера", "переход от обучения к практике"],
        ]
      : [
          ["Platform", "student journey and new programmes"],
          ["Referrals", "a new acquisition channel"],
          ["Practice", "exercises, rewards and recommendations"],
          ["Careers", "from learning to professional practice"],
        ];

    return `
      <div class="visual visual-akademcity" aria-label="${escapeHtml(caseItem.domain)}">
        ${labels
          .map(
            ([metric, label]) => `
              <div>
                <strong>${escapeHtml(metric)}</strong>
                <span>${escapeHtml(label)}</span>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  if (caseItem.visual === "uom") {
    return `
      <div class="visual visual-uom" aria-label="${escapeHtml(caseItem.domain)}">
        <img src="${assets.sppHero}" alt="Фрагмент страницы программы СПП" />
        <img src="${assets.sportsNutrition}" alt="Фрагмент доказательства по спортивной нутрициологии" />
      </div>
    `;
  }

  if (caseItem.visual === "rec-ai") {
    return `
      <div class="visual visual-phone" aria-label="${escapeHtml(caseItem.domain)}">
        <div class="phone-frame">
          <div class="phone-top"></div>
          <div class="phone-screen">
            <span>REC AI</span>
            <strong>${ru ? "Подписка" : "Paid screen"}</strong>
            <small>${ru ? "первый опыт -> предложение -> оплата" : "onboarding -> offer -> subscription"}</small>
          </div>
        </div>
        <a class="small-link" href="${links.recAi}" target="_blank" rel="noreferrer">App Store</a>
      </div>
    `;
  }

  if (caseItem.visual === "omnisim") {
    const stages = ru
      ? [["Рынок", "карта сегментов"], ["Компании", "приоритетные заказчики"], ["ЛПР", "лица, принимающие решение"], ["Диалоги", "выявление задачи"], ["КП", "следующий коммерческий шаг"]]
      : [["Market", "segment map"], ["Companies", "priority accounts"], ["DMs", "decision makers"], ["Conversations", "problem discovery"], ["Proposals", "the next commercial step"]];
    return `
      <div class="visual visual-funnel" aria-label="${escapeHtml(caseItem.domain)}">
        ${stages.map(([stage, label]) => `<div><strong>${escapeHtml(stage)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}
      </div>
    `;
  }

  if (caseItem.visual === "construction") {
    return `
      <div class="visual visual-construction" aria-label="${escapeHtml(caseItem.domain)}">
        <div><strong>${ru ? "смета" : "estimate"}</strong><span>${ru ? "данные объекта" : "object data"}</span></div>
        <div><strong>${ru ? "роли" : "roles"}</strong><span>${ru ? "около 5 ролей" : "around 5 roles"}</span></div>
        <div><strong>${ru ? "доски" : "boards"}</strong><span>${ru ? "задачи и статусы" : "tasks and statuses"}</span></div>
        <div><strong>${ru ? "материалы" : "materials"}</strong><span>${ru ? "заказ и контроль" : "order and control"}</span></div>
      </div>
    `;
  }

  if (caseItem.visual === "proptech") {
    return `
      <div class="visual visual-proptech" aria-label="${escapeHtml(caseItem.domain)}">
        <div><span>${ru ? "старая модель" : "old model"}</span><strong>${ru ? "комиссия" : "commission"}</strong></div>
        <div><span>${ru ? "новая модель" : "new model"}</span><strong>${ru ? "подписка" : "subscription"}</strong></div>
        <div><span>${ru ? "логика" : "logic"}</span><strong>${ru ? "ценность" : "value"}</strong></div>
      </div>
    `;
  }

  if (caseItem.visual === "igaming") {
    return `
      <div class="visual visual-flow" aria-label="${escapeHtml(caseItem.domain)}">
        <span>${ru ? "игра" : "play"}</span>
        <span>${ru ? "триггер" : "trigger"}</span>
        <span>${ru ? "магазин" : "store"}</span>
        <span>${ru ? "пригласить / купить" : "invite / buy"}</span>
      </div>
    `;
  }

  if (caseItem.visual === "vibecoding") {
    return `
      <div class="visual visual-tools" aria-label="${escapeHtml(caseItem.domain)}">
        <a href="${links.vibe}" target="_blank" rel="noreferrer">${ru ? "микросайт про вайбкодинг" : "validation microsite"}</a>
        <a href="${links.sales}">${ru ? "версия под B2B-продажи" : "B2B sales version"}</a>
        <span>${ru ? "парсер компаний" : "market parser"}</span>
        <span>${ru ? "CRM-дайджест" : "CRM digest"}</span>
      </div>
    `;
  }

  return `
    <div class="visual visual-system" aria-label="${escapeHtml(caseItem.domain)}">
      <div>${ru ? "рынок" : "research"}</div>
      <div>${ru ? "гипотеза" : "hypothesis"}</div>
      <div>${ru ? "проверка" : "test"}</div>
      <div>${ru ? "результат" : "result"}</div>
    </div>
  `;
}

function renderCaseIndex(items, casePageLabels, cardLabels) {
  return items
    .map(
      (caseItem, index) => {
        const preview = caseItem.evidenceImages?.[0];
        const number = String(index + 1).padStart(2, "0");

        return `
        <a class="case-card reveal" id="${escapeHtml(caseItem.id)}" data-case-card href="${caseHref(caseItem.id)}">
          <div class="case-card-head">
            <span class="case-domain">${escapeHtml(caseItem.domain)}</span>
            <span class="case-card-number">${escapeHtml(number)}</span>
          </div>
          ${
            preview
              ? `
                <figure class="case-card-media">
                  <img src="${escapeHtml(preview.src)}" alt="${escapeHtml(preview.alt)}" />
                </figure>
              `
              : ""
          }
          <h3>${escapeHtml(caseItem.title)}</h3>
          <div class="case-card-metrics">${renderMetricPills(caseItem.metrics.slice(0, 4))}</div>
          <div class="case-card-section">
            <span>${escapeHtml(casePageLabels.problem || casePageLabels.context)}</span>
            <p>${escapeHtml(caseItem.problem || caseItem.short)}</p>
          </div>
          <div class="case-card-section case-card-proof">
            <span>${escapeHtml(cardLabels.proof)}</span>
            <p>${escapeHtml(caseItem.whyItMatters || caseItem.result)}</p>
          </div>
          <span class="case-card-action">${escapeHtml(casePageLabels.openCase)}</span>
        </a>
      `;
      }
    )
    .join("");
}

function renderCases(items, labels, lang) {
  return items
    .map(
      (caseItem) => `
        <article class="case-detail section-shell reveal" id="${caseItem.id}">
          <div class="case-copy">
            <p class="eyebrow">${escapeHtml(caseItem.domain)}</p>
            <h3>${escapeHtml(caseItem.title)}</h3>
            <p>${escapeHtml(caseItem.short)}</p>
            <div class="metric-pills">${renderMetricPills(caseItem.metrics)}</div>
            <dl>
              <div>
                <dt>${escapeHtml(labels.role)}</dt>
                <dd>${escapeHtml(caseItem.role)}</dd>
              </div>
              <div>
                <dt>${escapeHtml(labels.actions)}</dt>
                <dd><ul>${renderList(caseItem.actions)}</ul></dd>
              </div>
              <div>
                <dt>${escapeHtml(labels.proof)}</dt>
                <dd>${escapeHtml(caseItem.result)}</dd>
              </div>
            </dl>
            <div class="tag-row">${renderTags(caseItem.tags)}</div>
          </div>
          ${renderVisual(caseItem, lang)}
        </article>
      `
    )
    .join("");
}

function renderProductScope(scope) {
  if (!scope?.items?.length) {
    return "";
  }

  return `
    <section class="section-shell product-scope-section" id="product-scope">
      <div class="section-title wide reveal">
        <p class="eyebrow">${escapeHtml(scope.eyebrow)}</p>
        <h2>${escapeHtml(scope.title)}</h2>
        <p>${escapeHtml(scope.intro)}</p>
      </div>
      <div class="scope-grid">
        ${scope.items
          .map(
            (item) => `
              <article class="scope-card reveal">
                <span>${escapeHtml(item.number)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.text)}</p>
                <strong>${escapeHtml(item.proof)}</strong>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPositioning(positioning) {
  if (!positioning?.items?.length) {
    return "";
  }

  return `
    <section class="positioning-section section-shell" id="positioning">
      <div class="section-title wide reveal">
        <p class="eyebrow">${escapeHtml(positioning.eyebrow)}</p>
        <h2>${escapeHtml(positioning.title)}</h2>
        <p>${escapeHtml(positioning.intro)}</p>
      </div>
      <div class="positioning-grid">
        ${positioning.items
          .map(
            (item) => `
              <article class="positioning-card reveal">
                <span class="positioning-role">${escapeHtml(item.role)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.text)}</p>
                <div class="positioning-cases">
                  ${item.cases.map((caseName) => `<span>${escapeHtml(caseName)}</span>`).join("")}
                </div>
                <ul>${renderList(item.pitch)}</ul>
                ${
                  item.href
                    ? `<a class="positioning-link" href="${escapeHtml(item.href)}">${escapeHtml(item.linkLabel || item.title)}</a>`
                    : ""
                }
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderExperienceMap(experienceMap) {
  if (!experienceMap?.items?.length) {
    return "";
  }

  return `
    <section class="section-shell experience-section" id="experience">
      <div class="section-title wide reveal">
        <p class="eyebrow">${escapeHtml(experienceMap.eyebrow)}</p>
        <h2>${escapeHtml(experienceMap.title)}</h2>
        <p>${escapeHtml(experienceMap.intro)}</p>
      </div>
      <div class="experience-grid">
        ${experienceMap.items
          .map((item, index) => {
            const actionLabel = item.actionLabel || (item.caseId ? experienceMap.openCase : experienceMap.openSection);
            return `
              <a class="experience-card reveal" href="${escapeHtml(item.href || caseHref(item.caseId))}">
                <span class="experience-number">${String(index + 1).padStart(2, "0")}</span>
                <span class="experience-period">${escapeHtml(item.period)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.text)}</p>
                <span class="experience-action">${escapeHtml(actionLabel)}</span>
              </a>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderVideoPreview(item, lang) {
  let id;
  try {
    const url = new URL(item.href);
    if (url.protocol !== 'https:') return '';
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com'].includes(url.hostname) && url.pathname === '/watch') id = url.searchParams.get('v');
  } catch { return ''; }
  if (/^[A-Za-z0-9_-]{11}$/.test(id || '')) {
    const label = lang === 'ru' ? 'Смотреть на YouTube' : 'Watch on YouTube';
    return `<a class="pm-video-cover" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label + ': ' + item.title)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${escapeHtml(item.title)}" width="480" height="360" loading="lazy" /><span aria-hidden="true">▶</span></a>`;
  }
  if (!item.thumbnail) return '';
  const label = lang === 'ru' ? 'Открыть материал' : 'Open post';
  return `<a class="pm-video-cover is-social" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label + ': ' + item.title)}"><img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)}" width="720" height="900" loading="lazy" /><span aria-hidden="true">↗</span></a>`;
}

function renderEvidenceGallery(caseItem, labels) {
  const images = caseItem.evidenceImages || [];

  if (!images.length) {
    return "";
  }

  return `
    <section class="section-shell evidence-gallery reveal" aria-label="${escapeHtml(labels.evidence)}">
      <div class="section-title wide">
        <p class="eyebrow">${escapeHtml(labels.evidence)}</p>
        <h2>${escapeHtml(caseItem.domain)}</h2>
      </div>
      <div class="evidence-gallery-grid">
        ${images
          .map((image) => {
            const figureClass = image.kind === "phone" ? ' class="is-phone"' : "";
            return `
              <figure${figureClass}>
                <a class="evidence-original" href="${escapeHtml(image.src)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(image.alt)}"><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" loading="lazy" /></a>
                <figcaption>${escapeHtml(image.caption)}</figcaption>
              </figure>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderEvidenceLinks(caseItem, lang = "ru") {
  const sourceLinks = caseItem.evidenceLinks || [];

  if (!sourceLinks.length) {
    return "";
  }

  const title = lang === "ru" ? "Публичные подтверждения" : "Public evidence";
  const eyebrow = lang === "ru" ? "источники" : "sources";

  return `
    <section class="section-shell evidence-links reveal" aria-label="${escapeHtml(title)}">
      <div class="section-title wide">
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="evidence-link-grid">
        ${sourceLinks
          .map(
            (source) => `
              <a class="public-link reveal" href="${escapeHtml(source.href)}" target="_blank" rel="noreferrer">
                <strong>${escapeHtml(source.title)}</strong>
                <span>${escapeHtml(source.text)}</span>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderCaseStoryCard(label, value, options = {}) {
  if (!value || (Array.isArray(value) && !value.length)) {
    return "";
  }

  const body = Array.isArray(value)
    ? `<ul>${renderList(value)}</ul>`
    : `<p>${escapeHtml(value)}</p>`;

  return `
    <article class="case-story ${options.wide ? "case-story-wide" : ""} reveal">
      <p class="eyebrow">${escapeHtml(label)}</p>
      ${body}
    </article>
  `;
}

function compactTalkText(value, maxLength = 220) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  const sentences = text.match(/.+?(?:[.!?](?=\s|$)|$)/g) || [];
  let result = "";

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    const next = `${result} ${cleanSentence}`.trim();
    if (next.length > maxLength) {
      break;
    }
    result = next;
  }

  if (result.length > 80) {
    return result;
  }

  const slice = text.slice(0, maxLength + 1);
  const breakpoints = [slice.lastIndexOf(". "), slice.lastIndexOf("; "), slice.lastIndexOf(", "), slice.lastIndexOf(" ")];
  const cutAt = Math.max(...breakpoints.filter((index) => index > 80), 0) || maxLength;
  return `${text.slice(0, cutAt).trim()}...`;
}

function compactTalkActions(actions = []) {
  const text = actions
    .slice(0, 2)
    .map((item) => String(item).replace(/[.!?]$/g, ""))
    .join("; ");
  return compactTalkText(text, 230);
}

function getCaseTalkTrackItems(caseItem, labels) {
  if (caseItem.talkTrack) {
    return [
      [labels.situation, caseItem.talkTrack.situation],
      [labels.task, caseItem.talkTrack.task],
      [labels.talkActions, caseItem.talkTrack.actions],
      [labels.talkResult, caseItem.talkTrack.result],
    ].filter(([, text]) => text);
  }

  const actions = compactTalkActions(caseItem.actions);

  return [
    [labels.situation, compactTalkText(caseItem.scope || caseItem.short)],
    [labels.task, compactTalkText(caseItem.problem || caseItem.short)],
    [labels.talkActions, actions || caseItem.role],
    [labels.talkResult, compactTalkText(caseItem.result, 240)],
  ].filter(([, text]) => text);
}

/* The talk track is a speaking aid for Marat, not reader content.
   It stays available but folded, so the case is told once on the page. */
function renderCaseTalkTrack(caseItem, labels) {
  const items = getCaseTalkTrackItems(caseItem, labels);

  if (!items.length) {
    return "";
  }

  return `
    <section class="section-shell reveal" id="case-talk-track">
      <details class="case-talk">
        <summary>${escapeHtml(labels.talkTrack)}: ${escapeHtml(labels.talkTrackIntro)}</summary>
        <div class="case-talk-body">
          ${items
            .map(
              ([label, text]) => `
                <div class="case-talk-item">
                  <span>${escapeHtml(label)}</span>
                  <p>${escapeHtml(text)}</p>
                </div>
              `
            )
            .join("")}
        </div>
      </details>
    </section>
  `;
}

/* One block of the single pass: a quiet label plus text or a list. */
function renderCaseBlock(label, value, options = {}) {
  const values = (Array.isArray(value) ? value : [value]).filter(
    (item) => item && String(item).trim()
  );

  if (!values.length) {
    return "";
  }

  const body = options.list
    ? `<ul class="case-did">${values
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
    : values
        .map(
          (item) =>
            `<p class="case-block-text${options.quote ? " is-quote" : ""}">${escapeHtml(item)}</p>`
        )
        .join("");

  return `
    <section class="section-shell case-block reveal">
      <p class="case-block-label">${escapeHtml(label)}</p>
      ${body}
    </section>
  `;
}

function renderCasePage(lang = "ru") {
  const t = content[lang] || content.ru;
  const labels = t.casePage || content.ru.casePage;
  const requestedId = getCaseIdFromUrl();
  const caseItem = t.cases.items.find((item) => item.id === requestedId) || t.cases.items[0];
  const evidence = caseItem.evidence || [];
  /* Captions under the screenshots already say what each one proves,
     so the text list only earns its place when there are no images. */
  const hasEvidenceImages = Boolean((caseItem.evidenceImages || []).length);

  document.documentElement.lang = lang;
  document.title = `${caseItem.title} - ${t.brand}`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", caseItem.short);

  app.innerHTML = `
    ${renderHeader(t, lang, "case")}

    <main class="case-page">
      <section class="case-page-hero section-shell" id="top">
        <div class="case-page-intro reveal">
          <a class="back-link" href="${homeHref("cases")}">${escapeHtml(labels.back)}</a>
          <p class="eyebrow">${escapeHtml(caseItem.domain)}</p>
          <h1>${escapeHtml(caseItem.title)}</h1>
          <p class="case-page-lead">${escapeHtml(caseItem.short)}</p>
          <div class="metric-pills">${renderMetricPills(caseItem.metrics)}</div>
          <div class="tag-row">${renderTags(caseItem.tags)}</div>
        </div>
        <div class="case-page-visual reveal">
          ${renderVisual(caseItem, lang)}
        </div>
      </section>

      <div id="case-content">
        ${renderCaseBlock(labels.problem || labels.context, [
          caseItem.problem || caseItem.short,
          caseItem.scope,
        ])}
        ${renderCaseBlock(labels.role, caseItem.role, { quote: true })}
        ${renderCaseBlock(labels.actions, [...(caseItem.decisions || []), ...(caseItem.actions || [])], {
          list: true,
        })}
        ${renderCaseBlock(labels.result, [caseItem.result, caseItem.whyItMatters])}
      </div>

      ${renderEvidenceLinks(caseItem, lang)}
      ${renderEvidenceGallery(caseItem, labels)}
      ${hasEvidenceImages ? "" : renderCaseBlock(labels.evidence, evidence, { list: true })}

      <section class="band" id="cases">
        <div class="section-shell">
          <div class="section-title wide reveal">
            <p class="eyebrow">${escapeHtml(labels.moreCases)}</p>
            <h2>${escapeHtml(labels.homeCta)}</h2>
          </div>
          <div class="case-page-links">
            ${getCaseItemsByIds(t, [...new Set([...t.featuredCaseIds, ...(t.catalog?.groups || []).flatMap(group => group.caseIds), ...(t.business?.caseIds || []), ...t.extraCaseIds])])
              .map(
                (item) => `
                  <a class="public-link reveal ${item.id === caseItem.id ? "is-current" : ""}" href="${caseHref(item.id)}">
                    <strong>${escapeHtml(item.domain)}</strong>
                    <span>${escapeHtml(item.title)}</span>
                  </a>
                `
              )
              .join("")}
          </div>
        </div>
      </section>
    </main>
  `;

  bindLanguageSwitches();
  initReveal();
}

function getCaseItemsByIds(t, ids = []) {
  return ids.map((id) => t.cases.items.find((item) => item.id === id)).filter(Boolean);
}

function renderSalesEvidence(block) {
  if (!block) {
    return "";
  }

  return `
    <section class="section-shell sales-evidence" id="sales-evidence">
      <div class="section-title wide reveal">
        <p class="eyebrow">${escapeHtml(block.eyebrow)}</p>
        <h2>${escapeHtml(block.title)}</h2>
        <p>${escapeHtml(block.intro)}</p>
      </div>
      <div class="sales-evidence-grid">
        ${block.items
          .map(
            (item) => `
              <article class="sales-evidence-card reveal">
                <div class="sales-evidence-top">
                  <span>${escapeHtml(item.number)}</span>
                  <strong>${escapeHtml(item.metric)}</strong>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.text)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSalesPage(lang = "ru") {
  const t = content[lang] || content.ru;
  const sales = t.salesPage || content.ru.salesPage;
  const mainCase = t.cases.items.find((item) => item.id === "omnisim") || t.cases.items[0];
  const salesCases = getCaseItemsByIds(t, sales.cases.caseIds);

  document.documentElement.lang = lang;
  document.title = sales.metaTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", sales.metaDescription);

  app.innerHTML = `
    ${renderHeader(t, lang, "sales")}

    <main class="sales-page">
      <section class="sales-hero section-shell" id="top">
        <div class="sales-hero-copy reveal">
          <p class="eyebrow">${escapeHtml(sales.hero.eyebrow)}</p>
          <h1>${escapeHtml(sales.hero.title)}</h1>
          <p class="hero-lead">${escapeHtml(sales.hero.lead)}</p>
          <div class="expertise-row">
            ${sales.hero.chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join("")}
          </div>
          <div class="hero-actions">
            <a class="button primary" href="#sales-cases">${escapeHtml(sales.hero.primary)}</a>
            <a class="button secondary" href="./index.html">${escapeHtml(sales.hero.secondary)}</a>
          </div>
        </div>

        <aside class="sales-proof-card reveal">
          <div class="section-title">
            <p class="eyebrow">${escapeHtml(sales.hero.proofTitle)}</p>
            <h2>${escapeHtml(sales.hero.proofText)}</h2>
          </div>
          <div class="sales-proof-list">
            ${sales.hero.proof
              .map(
                ([metric, label]) => `
                  <div>
                    <strong>${escapeHtml(metric)}</strong>
                    <span>${escapeHtml(label)}</span>
                  </div>
                `
              )
              .join("")}
          </div>
          ${renderVisual(mainCase, lang)}
        </aside>
      </section>

      ${renderSalesEvidence(sales.salesEvidence)}

      <section class="section-shell sales-fit" id="sales-content">
        <div class="section-title wide reveal">
          <p class="eyebrow">${escapeHtml(sales.fit.eyebrow)}</p>
          <h2>${escapeHtml(sales.fit.title)}</h2>
          <p>${escapeHtml(sales.fit.intro)}</p>
        </div>
        <div class="sales-fit-grid">
          ${sales.fit.items
            .map(
              (item) => `
                <article class="task-card reveal">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.text)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="band" id="sales-work">
        <div class="section-shell">
          <div class="section-title wide reveal">
            <p class="eyebrow">${escapeHtml(sales.work.eyebrow)}</p>
            <h2>${escapeHtml(sales.work.title)}</h2>
            <p>${escapeHtml(sales.work.intro)}</p>
          </div>
          <div class="scope-grid">
            ${sales.work.items
              .map(
                (item) => `
                  <article class="scope-card reveal">
                    <span>${escapeHtml(item.number)}</span>
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.text)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="section-shell" id="sales-cases">
        <div class="section-title wide reveal">
          <p class="eyebrow">${escapeHtml(sales.cases.eyebrow)}</p>
          <h2>${escapeHtml(sales.cases.title)}</h2>
          <p>${escapeHtml(sales.cases.intro)}</p>
        </div>
        <div class="case-index sales-case-index">
          ${renderCaseIndex(salesCases, t.casePage, t.cases.labels)}
        </div>
      </section>

      <section class="band dark" id="sales-start">
        <div class="section-shell">
          <div class="section-title reveal">
            <p class="eyebrow">${escapeHtml(sales.firstWeeks.eyebrow)}</p>
            <h2>${escapeHtml(sales.firstWeeks.title)}</h2>
          </div>
          <div class="method-grid">
            ${sales.firstWeeks.items
              .map(
                ([number, title, text]) => `
                  <article class="method-step reveal">
                    <span>${escapeHtml(number)}</span>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(text)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="contact-section" id="contact">
        <div class="section-shell contact-panel reveal">
          <p class="eyebrow">${escapeHtml(sales.contact.eyebrow)}</p>
          <h2>${escapeHtml(sales.contact.title)}</h2>
          <p>${escapeHtml(sales.contact.text)}</p>
          <div class="contact-links">
            ${sales.contact.actions.map(([label, href]) => renderActionLink(label, href, lang)).join("")}
          </div>
        </div>
      </section>
    </main>
  `;

  bindLanguageSwitches();
  initReveal();
}

function render(lang = "ru") {
  const t = content[lang] || content.ru;
  document.body.classList.add("product-portfolio");
  if (pageType === "case") {
    renderCasePage(lang);
    return;
  }
  if (pageType === "sales") {
    renderSalesPage(lang);
    return;
  }

  document.documentElement.lang = lang;
  document.title = t.metaTitle;
  document.querySelector('meta[name="description"]')?.setAttribute("content", t.metaDescription);


  app.innerHTML = `
    ${renderHeader(t, lang, "home")}

    <main class="pm-home">
      <section class="pm-intro section-shell" id="top">
        <div class="pm-intro-grid">
          <div class="pm-intro-copy reveal">
            <div class="pm-identity">
              <p>${escapeHtml(t.hero.eyebrow)}</p>
            </div>
            <h1>${escapeHtml(t.hero.title)}</h1>
            <p class="pm-lead">${escapeHtml(t.hero.lead)}</p>
            ${renderHeroEvidence(t, lang)}
            <div class="hero-actions">
              <a class="button primary" href="#cases">${escapeHtml(t.hero.primary)}</a>
              <a class="pm-text-link" href="#contact">${escapeHtml(t.hero.secondary)} <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <figure class="pm-portrait reveal">
            <img src="${assets.photo}" alt="${escapeHtml(t.brand)}" width="720" height="900" />
            <figcaption><strong>${escapeHtml(t.brand)}</strong><span>Product manager</span></figcaption>
          </figure>
        </div>
      </section>

      <section class="section-shell pm-work" id="cases">
        <span id="catalog" class="pm-anchor"></span>
        <div class="section-title wide reveal">
          <p class="eyebrow">${escapeHtml(t.cases.eyebrow)}</p>
          <h2>${escapeHtml(t.cases.title)}</h2>
        </div>
        ${renderPortfolioFilters(lang)}
        <div class="pm-catalog-grid" id="portfolio-grid">${renderPortfolioCatalog(t, lang)}</div>
        <p id="portfolio-empty" hidden>${lang === 'ru' ? 'Нет проектов с таким сочетанием фильтров.' : 'No projects match these filters.'}</p>
      </section>


      ${renderFocusSections(t,lang)}

      <section class="section-shell pm-about" id="about">
        <div><p class="eyebrow">${escapeHtml(t.about.eyebrow)}</p><h2>${escapeHtml(t.about.title)}</h2></div>
        <p>${escapeHtml(t.about.text)}</p>
      </section>

      ${renderManagement(t, lang)}

      <section class="pm-method" id="method">
        <div class="section-shell">
          <div class="section-title reveal">
            <p class="eyebrow">${escapeHtml(t.method.eyebrow)}</p>
            <h2>${escapeHtml(t.method.title)}</h2>
          </div>
          <div class="method-grid">
            ${t.method.steps
              .map(
                ([number, title, text]) => `
                  <article class="method-step reveal">
                    <span>${escapeHtml(number)}</span>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(text)}</p>
                  </article>
                `
              )
              .join("")}
          </div>
        </div>
      </section>


      ${t.feed ? `<section class="section-shell pm-extra" id="thoughts">
        <p class="eyebrow">${escapeHtml(t.feed.eyebrow)}</p>
        <h2>${escapeHtml(t.feed.title)}</h2>
        <div class="pm-feed">
          ${[...t.feed.items.filter(item => item.thumbnail), ...t.feed.items.filter(item => !item.thumbnail)].map(item => `<article class="pm-feed-item">
            ${renderVideoPreview(item, lang)}
            <p class="pm-feed-meta">${escapeHtml(item.platform)}${item.date ? ` <span aria-hidden="true">/</span> <time datetime="${escapeHtml(item.date)}">${new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(item.date))}</time>` : ''}</p>
            <h3><a data-feed-link href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)} <span aria-hidden="true">↗</span></a></h3>
            <p>${escapeHtml(item.description)}</p>
          </article>`).join("")}
        </div>
      </section>` : ""}

      ${t.public ? `<section class="section-shell pm-extra" id="publications">
        <p class="eyebrow">${escapeHtml(t.public.eyebrow)}</p>
        <h2>${escapeHtml(t.public.title)}</h2>
        <div class="pm-extra-list">
          ${t.public.items.map(item => `<article class="pm-publication ${item.thumbnail ? 'has-video' : ''}">${renderVideoPreview(item,lang)}<div class="pm-extra-copy"><p class="pm-feed-meta">${escapeHtml(item.type)}</p><h3><a data-publication href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)} <span aria-hidden="true">↗</span></a></h3><p>${escapeHtml(item.description)}</p></div></article>`).join("")}
        </div>
      </section>` : ""}

      <section class="contact-section" id="contact">
        <div class="section-shell contact-panel reveal">
          <p class="eyebrow">${escapeHtml(t.contact.eyebrow)}</p>
          <h2>${escapeHtml(t.contact.title)}</h2>
          <p>${escapeHtml(t.contact.text)}</p>
          <div class="contact-links">
            ${t.contact.actions
              .map(([label, href]) => renderActionLink(label, href, lang))
              .join("")}
          </div>
          <a class="pm-text-link" href="${links.linkedin}" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>
  `;

  bindLanguageSwitches();
  bindPortfolioFilters(lang);
  initReveal();
}

function bindLanguageSwitches() {
  document.querySelectorAll("[data-lang-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLang = button.getAttribute("data-lang-switch") || "ru";
      localStorage.setItem("portfolio-lang", nextLang);
      render(nextLang);
    });
  });
}

function initReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach((element) => observer.observe(element));
}

const requestedLang = new URLSearchParams(location.search).get("lang");
const initialLang = requestedLang === "en" || (requestedLang !== "ru" && localStorage.getItem("portfolio-lang") === "en") ? "en" : "ru";
localStorage.setItem("portfolio-lang", initialLang);
render(initialLang);
