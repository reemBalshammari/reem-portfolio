(function () {
  "use strict";

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const safeUrl = (value = "") => {
    const url = String(value || "").trim();
    if (!url) return "";
    if (/^(https?:|mailto:|assets\/|\.\/|\/)/i.test(url)) return escapeHtml(url);
    return "";
  };

  const langText = (ar, en) => {
    const lang = document.documentElement.lang || "ar";
    return lang === "en" ? en || ar || "" : ar || en || "";
  };

  const bilingual = (ar, en) =>
    `data-ar="${escapeHtml(ar || "")}" data-en="${escapeHtml(en || ar || "")}"`;

  const configured = () =>
    typeof window.reemCmsConfigured === "function" &&
    window.reemCmsConfigured() &&
    window.supabase;

  function applySettings(settings) {
    if (!settings) return;

    const availability = document.querySelector(".availability [data-ar]");
    if (availability) {
      availability.dataset.ar = settings.availability_ar || "";
      availability.dataset.en = settings.availability_en || "";
    }

    const nameParts = document.querySelectorAll(".hero-name span");
    const arabicParts = (settings.full_name_ar || "").split(" ");
    const englishParts = (settings.full_name_en || "").split(" ");
    if (nameParts[0]) {
      nameParts[0].dataset.ar = arabicParts.slice(0, 2).join(" ");
      nameParts[0].dataset.en = englishParts.slice(0, 2).join(" ");
    }
    if (nameParts[1]) {
      nameParts[1].dataset.ar = arabicParts.slice(2).join(" ");
      nameParts[1].dataset.en = englishParts.slice(2).join(" ");
    }

    const role = document.querySelector(".hero-role");
    if (role) {
      role.dataset.ar = settings.headline_ar || "";
      role.dataset.en = settings.headline_en || "";
    }

    const lead = document.querySelector(".hero-lead");
    if (lead) {
      lead.dataset.ar = settings.bio_ar || "";
      lead.dataset.en = settings.bio_en || "";
    }

    const heroLinks = document.querySelectorAll(".hero-actions a");
    if (heroLinks[1] && settings.cv_url) heroLinks[1].href = settings.cv_url;
    if (heroLinks[2] && settings.linkedin) heroLinks[2].href = settings.linkedin;

    const contactLinks = document.querySelectorAll(".contact-links a");
    if (contactLinks[0] && settings.email) contactLinks[0].href = `mailto:${settings.email}`;
    if (contactLinks[1] && settings.linkedin) contactLinks[1].href = settings.linkedin;

    const footerLinks = document.querySelectorAll(".footer a");
    if (footerLinks[0] && settings.email) footerLinks[0].href = `mailto:${settings.email}`;
    if (footerLinks[1] && settings.linkedin) footerLinks[1].href = settings.linkedin;
    if (footerLinks[2] && settings.github) footerLinks[2].href = settings.github;

    const technical = document.querySelector(".skills-board .skill-panel:first-child .skill-list");
    if (technical && Array.isArray(settings.technical_skills)) {
      technical.innerHTML = settings.technical_skills
        .map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`)
        .join("");
    }

    const soft = document.querySelector(".skills-board .skill-panel:nth-child(2) .skill-list");
    if (soft && Array.isArray(settings.soft_skills_ar)) {
      soft.innerHTML = settings.soft_skills_ar
        .map((skill, index) => {
          const en = settings.soft_skills_en?.[index] || skill;
          return `<span class="chip" ${bilingual(skill, en)}>${escapeHtml(langText(skill, en))}</span>`;
        })
        .join("");
    }

    const education = settings.education || {};
    const degree = document.querySelector(".degree");
    const university = document.querySelector(".edu-university");
    const year = document.querySelector(".edu-year");
    if (degree) {
      degree.dataset.ar = education.degree_ar || "";
      degree.dataset.en = education.degree_en || "";
    }
    if (university) {
      university.dataset.ar = education.university_ar || "";
      university.dataset.en = education.university_en || "";
    }
    if (year && education.graduation_year) year.textContent = education.graduation_year;

    applyCurrentLanguage();
  }

  function projectCard(item, index) {
    const details = item.details || {};
    const facts = Array.isArray(details.facts) ? details.facts : [];
    const image = safeUrl(item.image_url) || "assets/images/project-nabbihni.png";
    return `
      <article class="project-card reveal visible" data-cms-id="${escapeHtml(item.id || "")}">
        <div class="project-media" data-image="${image}">
          <span class="project-type" ${bilingual(item.badge_ar, item.badge_en)}>
            ${escapeHtml(langText(item.badge_ar, item.badge_en))}
          </span>
          <img src="${image}" alt="${escapeHtml(item.title_ar)}" loading="lazy">
        </div>
        <div class="project-body">
          <span class="project-index">${escapeHtml(item.date_label || String(index + 1).padStart(2, "0"))}</span>
          <h3 class="project-title" ${bilingual(item.title_ar, item.title_en)}>
            ${escapeHtml(langText(item.title_ar, item.title_en))}
          </h3>
          <p class="project-summary" ${bilingual(item.description_ar, item.description_en)}>
            ${escapeHtml(langText(item.description_ar, item.description_en))}
          </p>
          ${details.quote_ar || details.quote_en ? `
            <p class="project-quote" ${bilingual(details.quote_ar, details.quote_en)}>
              ${escapeHtml(langText(details.quote_ar, details.quote_en))}
            </p>` : ""}
          <div class="project-facts">
            ${facts.map((fact) => `
              <div class="fact">
                <b ${bilingual(fact.label_ar, fact.label_en)}>${escapeHtml(langText(fact.label_ar, fact.label_en))}</b>
                <span ${bilingual(fact.value_ar, fact.value_en)}>${escapeHtml(langText(fact.value_ar, fact.value_en))}</span>
              </div>`).join("")}
          </div>
          <div class="tools">
            ${(item.tags || []).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="project-actions">
            ${item.primary_url ? `<a class="btn view-project" href="${safeUrl(item.primary_url)}" target="_blank" rel="noopener">عرض المشروع</a>` : ""}
            ${item.secondary_url ? `<a class="btn btn-soft" href="${safeUrl(item.secondary_url)}" target="_blank" rel="noopener">عرض إضافي</a>` : ""}
          </div>
        </div>
      </article>`;
  }

  function trainingCard(item) {
    return `
      <article class="training-card reveal visible" data-cms-id="${escapeHtml(item.id || "")}">
        <div class="logo-box">${item.logo_url ? `<img src="${safeUrl(item.logo_url)}" alt="">` : ""}</div>
        <div>
          <h3 ${bilingual(item.title_ar, item.title_en)}>${escapeHtml(langText(item.title_ar, item.title_en))}</h3>
          <p ${bilingual(item.description_ar, item.description_en)}>${escapeHtml(langText(item.description_ar, item.description_en))}</p>
        </div>
        <time class="training-date">${escapeHtml(item.date_label || "")}</time>
      </article>`;
  }

  function volunteerCard(item) {
    return `
      <article class="volunteer-item reveal visible" data-cms-id="${escapeHtml(item.id || "")}">
        <div class="volunteer-logo">${item.logo_url ? `<img src="${safeUrl(item.logo_url)}" alt="">` : ""}</div>
        <div>
          <div class="volunteer-meta">
            <span ${bilingual(item.organization_ar, item.organization_en)}>${escapeHtml(langText(item.organization_ar, item.organization_en))}</span>
            <time>${escapeHtml(item.date_label || "")}</time>
          </div>
          <h3 ${bilingual(item.title_ar, item.title_en)}>${escapeHtml(langText(item.title_ar, item.title_en))}</h3>
          <p ${bilingual(item.description_ar, item.description_en)}>${escapeHtml(langText(item.description_ar, item.description_en))}</p>
          ${item.badge_ar || item.badge_en ? `<span class="volunteer-badge" ${bilingual(item.badge_ar, item.badge_en)}>${escapeHtml(langText(item.badge_ar, item.badge_en))}</span>` : ""}
        </div>
      </article>`;
  }

  function certificateCard(item) {
    return `
      <article class="cert reveal visible" data-cms-id="${escapeHtml(item.id || "")}">
        <small>${escapeHtml(item.date_label || "")}</small>
        <h3 ${bilingual(item.title_ar, item.title_en)}>${escapeHtml(langText(item.title_ar, item.title_en))}</h3>
        <p ${bilingual(item.organization_ar, item.organization_en)}>${escapeHtml(langText(item.organization_ar, item.organization_en))}</p>
      </article>`;
  }

  function renderItems(items) {
    const groups = Object.groupBy
      ? Object.groupBy(items, (item) => item.section)
      : items.reduce((acc, item) => {
          (acc[item.section] ||= []).push(item);
          return acc;
        }, {});

    if (groups.projects?.length) {
      const grid = document.getElementById("projectsGrid");
      grid.innerHTML = groups.projects.map(projectCard).join("");
      const kicker = document.querySelector(".folder-kicker");
      if (kicker) kicker.textContent = `SELECTED WORK / ${String(groups.projects.length).padStart(2, "0")}`;
    }

    if (groups.training?.length) {
      document.querySelector("#experience .timeline").innerHTML =
        groups.training.map(trainingCard).join("");
    }

    if (groups.volunteer?.length) {
      document.querySelector("#leadership .volunteer-timeline").innerHTML =
        groups.volunteer.map(volunteerCard).join("");
    }

    if (groups.certificates?.length) {
      document.getElementById("certTrack").innerHTML =
        groups.certificates.map(certificateCard).join("");
      const count = document.querySelector(".cert-toolbar strong");
      if (count) count.textContent = groups.certificates.length;
    }

    applyCurrentLanguage();
  }

  function applyCurrentLanguage() {
    const lang = document.documentElement.lang || "ar";
    document.querySelectorAll("[data-ar][data-en]").forEach((element) => {
      element.textContent = element.dataset[lang] || element.dataset.ar;
    });
  }

  function initCertificates() {
    const marquee = document.getElementById("certMarquee");
    const track = document.getElementById("certTrack");
    const next = document.getElementById("certNext");
    const previous = document.getElementById("certPrev");
    if (!marquee || !track || !next || !previous || next.dataset.cmsReady) return;
    next.dataset.cmsReady = "true";
    const move = (direction) => {
      const card = track.querySelector(".cert");
      const distance = card ? card.getBoundingClientRect().width + 14 : 280;
      marquee.scrollBy({ left: direction * distance, behavior: "smooth" });
    };
    next.addEventListener("click", () => move(document.documentElement.dir === "rtl" ? -1 : 1));
    previous.addEventListener("click", () => move(document.documentElement.dir === "rtl" ? 1 : -1));
    track.addEventListener("click", (event) => {
      const card = event.target.closest(".cert");
      if (!card) return;
      track.querySelectorAll(".cert").forEach((item) => item.classList.toggle("is-active", item === card));
    });
  }

  async function loadCms() {
    if (!configured()) return;

    const client = window.supabase.createClient(
      window.REEM_CONFIG.SUPABASE_URL,
      window.REEM_CONFIG.SUPABASE_PUBLISHABLE_KEY
    );
    window.reemSupabase = client;

    const [{ data: settingsRow, error: settingsError }, { data: items, error: itemsError }] =
      await Promise.all([
        client.from("site_settings").select("data").eq("id", 1).maybeSingle(),
        client.from("portfolio_items").select("*").eq("is_visible", true).order("section").order("display_order")
      ]);

    if (settingsError) console.warn("CMS settings:", settingsError.message);
    if (itemsError) console.warn("CMS items:", itemsError.message);
    if (settingsRow?.data) applySettings(settingsRow.data);
    if (items?.length) renderItems(items);
    initCertificates();
  }

  document.addEventListener("click", (event) => {
    const media = event.target.closest(".project-media");
    if (!media) return;
    const image = media.dataset.image || media.querySelector("img")?.src;
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightboxImage");
    if (image && lightbox && lightboxImage) {
      lightboxImage.src = image;
      lightbox.classList.add("open");
    }
  });

  window.addEventListener("DOMContentLoaded", () => {
    initCertificates();
    loadCms();
  });
})();
