(function () {
  "use strict";

  const loginView = document.getElementById("loginView");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginStatus = document.getElementById("loginStatus");
  const configWarning = document.getElementById("configWarning");
  const profileForm = document.getElementById("profileForm");
  const itemForm = document.getElementById("itemForm");
  const itemsList = document.getElementById("itemsList");
  const messagesList = document.getElementById("messagesList");
  const sectionFilter = document.getElementById("sectionFilter");
  let client;
  let items = [];
  let activeUploads = 0;

  const labels = {
    projects: "مشروع",
    certificates: "شهادة",
    training: "تدريب أو برنامج",
    volunteer: "خبرة تطوعية"
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function status(element, message, type = "") {
    element.textContent = message;
    element.className = `status ${type}`;
  }

  function arrayValue(value) {
    return String(value || "")
      .split(/[,،\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function showDashboard() {
    loginView.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  function showLogin() {
    dashboard.classList.add("hidden");
    loginView.classList.remove("hidden");
  }

  function openPanel(id) {
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === id));
    document.querySelectorAll(".side-button[data-panel]").forEach((button) => button.classList.toggle("active", button.dataset.panel === id));
    if (id === "messagesPanel") loadMessages();
  }

  async function ensureAdmin() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      showLogin();
      return;
    }
    const { data, error } = await client.from("admin_users").select("user_id").eq("user_id", session.user.id).maybeSingle();
    if (error || !data) {
      await client.auth.signOut();
      status(loginStatus, "هذا الحساب غير مسجل كمسؤول للموقع.", "error");
      showLogin();
      return;
    }
    showDashboard();
    await Promise.all([loadProfile(), loadItems()]);
  }

  async function loadProfile() {
    const { data, error } = await client.from("site_settings").select("data").eq("id", 1).maybeSingle();
    if (error) return status(document.getElementById("profileStatus"), error.message, "error");
    const settings = data?.data || window.REEM_SEED?.settings || {};
    const education = settings.education || {};
    const values = {
      ...settings,
      technical_skills: (settings.technical_skills || []).join("، "),
      soft_skills_ar: (settings.soft_skills_ar || []).join("، "),
      soft_skills_en: (settings.soft_skills_en || []).join(", "),
      degree_ar: education.degree_ar || "",
      degree_en: education.degree_en || "",
      university_ar: education.university_ar || "",
      university_en: education.university_en || "",
      graduation_year: education.graduation_year || ""
    };
    Object.entries(values).forEach(([key, value]) => {
      if (profileForm.elements[key]) profileForm.elements[key].value = value || "";
    });
  }

  async function loadItems() {
    const { data, error } = await client.from("portfolio_items").select("*").order("section").order("display_order");
    if (error) {
      itemsList.innerHTML = `<div class="empty">${error.message}</div>`;
      return;
    }
    items = data || [];
    renderItems();
  }

  function renderItems() {
    const filter = sectionFilter.value;
    const filtered = filter === "all" ? items : items.filter((item) => item.section === filter);
    if (!filtered.length) {
      itemsList.innerHTML = '<div class="empty">لا توجد عناصر هنا بعد.</div>';
      return;
    }
    itemsList.innerHTML = filtered.map((item) => `
      <article class="item">
        ${item.image_url || item.logo_url
          ? `<img class="item-thumb" src="${escapeHtml(item.image_url || item.logo_url)}" alt="">`
          : '<div class="item-thumb"></div>'}
        <div>
          <h3>${escapeHtml(item.title_ar || item.title_en || "بدون عنوان")}</h3>
          <p>${escapeHtml(labels[item.section] || item.section)} · الترتيب ${Number(item.display_order) || 0}</p>
          <span class="badge ${item.is_visible ? "" : "off"}">${item.is_visible ? "ظاهر بالموقع" : "مخفي"}</span>
        </div>
        <div class="item-actions">
          <button class="icon-action" type="button" data-edit="${item.id}" title="تعديل">✎</button>
          <button class="icon-action" type="button" data-toggle="${item.id}" title="إظهار أو إخفاء">◉</button>
          <button class="icon-action delete" type="button" data-delete="${item.id}" title="حذف">×</button>
        </div>
      </article>
    `).join("");
  }

  function resetItemForm() {
    itemForm.reset();
    itemForm.elements.id.value = "";
    itemForm.elements.display_order.value = 1;
    itemForm.elements.is_visible.checked = true;
    document.getElementById("imagePreview").removeAttribute("src");
    document.getElementById("logoPreview").removeAttribute("src");
    status(document.getElementById("itemStatus"), "");
  }

  function openItemForm(item = null) {
    itemForm.classList.remove("hidden");
    resetItemForm();
    if (item) {
      Object.entries(item).forEach(([key, value]) => {
        const input = itemForm.elements[key];
        if (!input) return;
        if (input.type === "checkbox") input.checked = Boolean(value);
        else if (key === "tags") input.value = (value || []).join("، ");
        else input.value = typeof value === "object" ? "" : value || "";
      });
      if (item.image_url) document.getElementById("imagePreview").src = item.image_url;
      if (item.logo_url) document.getElementById("logoPreview").src = item.logo_url;
    }
    itemForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function uploadFile(type, file) {
    if (!file) return;
    activeUploads++;
    const extension = file.name.split(".").pop().toLowerCase();
    const path = `${type}/${crypto.randomUUID()}.${extension}`;
    const { error } = await client.storage.from("portfolio-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });
    activeUploads--;
    if (error) throw error;
    const { data } = client.storage.from("portfolio-media").getPublicUrl(path);
    const field = type === "projects" ? "image_url" : "logo_url";
    itemForm.elements[field].value = data.publicUrl;
    document.getElementById(type === "projects" ? "imagePreview" : "logoPreview").src = data.publicUrl;
  }

  async function loadMessages() {
    messagesList.innerHTML = '<div class="empty">جارٍ تحميل الرسائل...</div>';
    const { data, error } = await client.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) {
      messagesList.innerHTML = `<div class="empty">${error.message}</div>`;
      return;
    }
    if (!data?.length) {
      messagesList.innerHTML = '<div class="empty">لا توجد رسائل حتى الآن.</div>';
      return;
    }
    messagesList.innerHTML = data.map((message) => `
      <article class="message">
        <div class="message-top">
          <div><h3>${escapeHtml(message.name)}</h3><a href="mailto:${escapeHtml(message.email)}">${escapeHtml(message.email)}</a></div>
          <time>${new Date(message.created_at).toLocaleString("ar-SA")}</time>
        </div>
        <p>${escapeHtml(message.message)}</p>
      </article>
    `).join("");
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("loginButton");
    button.disabled = true;
    status(loginStatus, "جارٍ التحقق...");
    const { error } = await client.auth.signInWithPassword({
      email: document.getElementById("loginEmail").value.trim(),
      password: document.getElementById("loginPassword").value
    });
    button.disabled = false;
    if (error) return status(loginStatus, "البريد أو كلمة المرور غير صحيحة.", "error");
    await ensureAdmin();
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(profileForm);
    const current = window.REEM_SEED?.settings || {};
    const data = {
      ...current,
      full_name_ar: form.get("full_name_ar"),
      full_name_en: form.get("full_name_en"),
      headline_ar: form.get("headline_ar"),
      headline_en: form.get("headline_en"),
      bio_ar: form.get("bio_ar"),
      bio_en: form.get("bio_en"),
      availability_ar: form.get("availability_ar"),
      availability_en: form.get("availability_en"),
      email: form.get("email"),
      cv_url: form.get("cv_url"),
      linkedin: form.get("linkedin"),
      github: form.get("github"),
      certificates_url: form.get("certificates_url"),
      technical_skills: arrayValue(form.get("technical_skills")),
      soft_skills_ar: arrayValue(form.get("soft_skills_ar")),
      soft_skills_en: arrayValue(form.get("soft_skills_en")),
      education: {
        degree_ar: form.get("degree_ar"),
        degree_en: form.get("degree_en"),
        university_ar: form.get("university_ar"),
        university_en: form.get("university_en"),
        graduation_year: form.get("graduation_year")
      }
    };
    const { error } = await client.from("site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
    status(document.getElementById("profileStatus"), error ? error.message : "تم الحفظ والنشر بنجاح.", error ? "error" : "success");
  });

  itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (activeUploads) return status(document.getElementById("itemStatus"), "انتظري حتى يكتمل رفع الصورة.", "error");
    const form = new FormData(itemForm);
    const id = form.get("id");
    const existing = items.find((item) => item.id === id);
    const record = {
      section: form.get("section"),
      title_ar: form.get("title_ar"),
      title_en: form.get("title_en"),
      organization_ar: form.get("organization_ar"),
      organization_en: form.get("organization_en"),
      description_ar: form.get("description_ar"),
      description_en: form.get("description_en"),
      date_label: form.get("date_label"),
      badge_ar: form.get("badge_ar"),
      badge_en: form.get("badge_en"),
      image_url: form.get("image_url"),
      logo_url: form.get("logo_url"),
      primary_url: form.get("primary_url"),
      secondary_url: form.get("secondary_url"),
      tags: arrayValue(form.get("tags")),
      details: existing?.details || {},
      display_order: Number(form.get("display_order") || 0),
      is_visible: form.get("is_visible") === "on",
      updated_at: new Date().toISOString()
    };
    const query = id
      ? client.from("portfolio_items").update(record).eq("id", id)
      : client.from("portfolio_items").insert(record);
    const { error } = await query;
    if (error) return status(document.getElementById("itemStatus"), error.message, "error");
    status(document.getElementById("itemStatus"), "تم حفظ العنصر ونشره.", "success");
    await loadItems();
    setTimeout(() => itemForm.classList.add("hidden"), 650);
  });

  itemsList.addEventListener("click", async (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    const toggleId = event.target.dataset.toggle;
    if (editId) openItemForm(items.find((item) => item.id === editId));
    if (toggleId) {
      const item = items.find((entry) => entry.id === toggleId);
      await client.from("portfolio_items").update({ is_visible: !item.is_visible }).eq("id", toggleId);
      await loadItems();
    }
    if (deleteId && confirm("متأكدة من حذف هذا العنصر؟")) {
      await client.from("portfolio_items").delete().eq("id", deleteId);
      await loadItems();
    }
  });

  document.querySelectorAll("[data-upload]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.upload === "image" ? "imageUpload" : "logoUpload").click());
  });
  document.getElementById("imageUpload").addEventListener("change", (event) =>
    uploadFile("projects", event.target.files[0]).catch((error) => status(document.getElementById("itemStatus"), error.message, "error"))
  );
  document.getElementById("logoUpload").addEventListener("change", (event) =>
    uploadFile("logos", event.target.files[0]).catch((error) => status(document.getElementById("itemStatus"), error.message, "error"))
  );

  document.querySelectorAll(".side-button[data-panel]").forEach((button) => button.addEventListener("click", () => openPanel(button.dataset.panel)));
  document.getElementById("newItemButton").addEventListener("click", () => openItemForm());
  document.getElementById("cancelItemButton").addEventListener("click", () => itemForm.classList.add("hidden"));
  sectionFilter.addEventListener("change", renderItems);
  document.getElementById("logoutButton").addEventListener("click", async () => {
    await client.auth.signOut();
    showLogin();
  });

  document.getElementById("importSeedButton").addEventListener("click", async () => {
    if (!window.REEM_SEED || !confirm("سيتم استيراد محتوى التصميم الحالي إلى لوحة التحكم. هل نكمل؟")) return;
    const { count } = await client.from("portfolio_items").select("*", { count: "exact", head: true });
    if (count > 0 && !confirm("يوجد محتوى محفوظ مسبقًا. الاستيراد مرة أخرى قد يكرر العناصر. هل نكمل؟")) return;
    const settingsResult = await client.from("site_settings").upsert({ id: 1, data: window.REEM_SEED.settings });
    const itemsResult = await client.from("portfolio_items").insert(window.REEM_SEED.items);
    if (settingsResult.error || itemsResult.error) {
      alert(settingsResult.error?.message || itemsResult.error?.message);
      return;
    }
    alert("تم استيراد محتوى الموقع الحالي. الآن يمكنك تعديله من اللوحة.");
    await Promise.all([loadProfile(), loadItems()]);
  });

  async function start() {
    if (!window.reemCmsConfigured?.()) {
      configWarning.classList.remove("hidden");
      loginForm.querySelector("button").disabled = true;
      return;
    }
    client = window.supabase.createClient(
      window.REEM_CONFIG.SUPABASE_URL,
      window.REEM_CONFIG.SUPABASE_PUBLISHABLE_KEY
    );
    await ensureAdmin();
  }

  start();
})();
