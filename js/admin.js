/**
 * Khan Digital Solution – Digital Visiting Card & Business Profile
 * Admin Panel Application Script (Vanilla JS + Supabase Auth & Storage)
 */

// Application State
let adminState = {
  user: null,
  isAuthorized: false,
  data: null,
  activeTab: "tab-dashboard",
  isSaving: false,
  isDirty: false,
  customPersonalSocials: [],
  customBusinessSocials: [],
  servicesList: []
};

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Supabase and check auth session
  await initAdminApp();
});

/**
 * Initialize Admin App & Auth Listener
 */
async function initAdminApp() {
  const client = window.KDS.getSupabaseClient();

  // Never open the dashboard without a real Supabase Auth session.
  setupAuthEventListeners();
  closeServiceModal();

  if (!client) {
    showAuthView();
    showToast("Admin security is unavailable until Supabase is configured.", "error");
    return;
  }

  try {
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      await handleAuthenticatedUser(session.user);
    } else {
      showAuthView();
    }
  } catch (err) {
    console.warn("[KDS Admin] Error inspecting Supabase session:", err);
    showAuthView();
  }

  setupAuthChangeListener(client);
}

function setupAuthChangeListener(client) {
  if (!client) return;
  client.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      sessionStorage.removeItem("KDS_ADMIN_LOGGED_OUT");
      await handleAuthenticatedUser(session.user);
    } else if (event === "SIGNED_OUT") {
      if (sessionStorage.getItem("KDS_ADMIN_LOGGED_OUT") === "true") {
        adminState.user = null;
        adminState.isAuthorized = false;
        showAuthView();
      }
    }
  });
}

let isDashboardLoading = false;
let isDashboardInitialized = false;

/**
 * Handle Authenticated User & Security Verification
 */
async function handleAuthenticatedUser(user) {
  if (isDashboardLoading) return;

  adminState.user = user;
  const client = window.KDS.getSupabaseClient();
  if (!client || !user?.id) {
    showAuthView();
    return;
  }

  const normalizedEmail = (user.email || "").toLowerCase().trim();
  let isAuthorized = false;

  try {
    // Authorization must come from the protected admin_users table.
    const { data, error } = await client
      .from("admin_users")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!error && data?.email) {
      isAuthorized = true;
    }
  } catch (err) {
    console.warn("[KDS Admin] Error verifying admin role:", err);
  }

  if (!isAuthorized) {
    showToast("Access Denied: This account is not an authorized administrator.", "error");
    await client.auth.signOut();
    showAuthView();
    return;
  }

  sessionStorage.removeItem("KDS_ADMIN_LOGGED_OUT");
  adminState.isAuthorized = true;
  await loadDashboard();
}

/**
 * View Switchers
 */
function showAuthView() {
  const authSection = document.getElementById("adminAuthSection");
  const dashboardSection = document.getElementById("adminDashboardSection");
  const authNotice = document.getElementById("authSupabaseNotice");
  if (authNotice) {
    if (!window.KDS.isSupabaseConfigured()) {
      authNotice.classList.remove("hidden");
    } else {
      authNotice.classList.add("hidden");
    }
  }
  if (authSection) {
    authSection.classList.remove("hidden");
    authSection.style.display = "";
  }
  if (dashboardSection) {
    dashboardSection.classList.add("hidden");
    dashboardSection.style.display = "none";
  }
}

function showDashboardView() {
  const authSection = document.getElementById("adminAuthSection");
  const dashboardSection = document.getElementById("adminDashboardSection");
  if (authSection) {
    authSection.classList.add("hidden");
    authSection.style.display = "none";
  }
  if (dashboardSection) {
    dashboardSection.classList.remove("hidden");
    dashboardSection.style.display = "";
  }
}

/**
 * Setup Login and Logout Event Listeners
 */
function setupAuthEventListeners() {
  const loginForm = document.getElementById("adminLoginForm");
  const btnLogout = document.getElementById("btnLogout");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");
      const btnSubmit = document.getElementById("btnLoginSubmit");
      const errorBox = document.getElementById("loginErrorBox");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";

      if (!email || !password) {
        if (errorBox) {
          errorBox.textContent = "Please enter both email and password.";
          errorBox.classList.remove("hidden");
        }
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner"></span> Authenticating...`;
      }
      if (errorBox) errorBox.classList.add("hidden");

      const client = window.KDS.getSupabaseClient();

      if (!client) {
        if (errorBox) {
          errorBox.textContent = "Secure login is unavailable. Please configure Supabase.";
          errorBox.classList.remove("hidden");
        }
        return;
      }

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (errorBox) {
            errorBox.textContent = error.message || "Failed to sign in. Please check your credentials.";
            errorBox.classList.remove("hidden");
          }
        } else if (data && data.user) {
          sessionStorage.removeItem("KDS_ADMIN_LOGGED_OUT");
          showToast("Login successful!", "success");
          await handleAuthenticatedUser(data.user);
        }
      } catch (err) {
        console.error("[KDS Admin] Login exception:", err);
        if (errorBox) {
          errorBox.textContent = "Network error connecting to Supabase: " + (err.message || err);
          errorBox.classList.remove("hidden");
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `Login to Dashboard`;
        }
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      const client = window.KDS.getSupabaseClient();
      sessionStorage.setItem("KDS_ADMIN_LOGGED_OUT", "true");
      if (client) {
        try {
          await client.auth.signOut();
        } catch (err) {
          console.warn("[KDS Admin] Supabase signout warning:", err);
        }
      }
      adminState.user = null;
      adminState.isAuthorized = false;
      showToast("You have been signed out.", "success");
      showAuthView();
    });
  }
}

/**
 * Load Dashboard Data and Render All Sections
 */
async function loadDashboard() {
  if (isDashboardLoading) return;
  isDashboardLoading = true;

  try {
    showDashboardView();

    // Display current user email
    const userBadge = document.getElementById("adminUserBadge");
    if (userBadge && adminState.user) {
      userBadge.textContent = adminState.user.email;
    }

    // Load site data
    showToast("Loading site configuration...", "info");
    try {
      adminState.data = await window.KDS.getSiteData();
    } catch (e) {
      console.error("[KDS Admin] Failed to fetch data:", e);
      adminState.data = JSON.parse(JSON.stringify(window.KDS.DEFAULT_SITE_DATA));
    }

    // Deep clone data to avoid direct reference mutation
    adminState.servicesList = JSON.parse(JSON.stringify(adminState.data.services || []));
    adminState.customPersonalSocials = JSON.parse(JSON.stringify((adminState.data.personalSocials || []).filter(isCustomSocial)));
    adminState.customBusinessSocials = JSON.parse(JSON.stringify((adminState.data.businessSocials || []).filter(isCustomSocial)));

    // Populate form fields
    populateAllForms(adminState.data);

    // Setup interactive components
    renderServicesManager();
    renderCustomSocials();
    renderQrPreviews();
    updateOverviewStats();

    // Setup one-time listeners
    if (!isDashboardInitialized) {
      setupTabs();
      setupImageUploads();
      setupGeneralMediaUploader();
      setupSaveActions();
      setupServiceModal();
      setupCustomSocialListeners();
      setupSettingsForm();
      isDashboardInitialized = true;
    }

    showToast("Dashboard ready.", "success");
  } finally {
    isDashboardLoading = false;
  }
}

function isCustomSocial(item) {
  const standardIds = ["p_fb", "p_ig", "p_li", "p_yt", "p_tt", "b_fb", "b_ig", "b_li", "b_yt", "b_tt"];
  return !standardIds.includes(item.id);
}

/**
 * Populate All Forms with Data
 */
function populateAllForms(data) {
  const p = data.personal || {};
  const b = data.business || {};
  const s = data.settings || {};
  const branding = data.branding || s.branding || {};

  // Personal Profile Fields
  setValue("admPersonalName", p.name);
  setValue("admPersonalDesignation", p.designation);
  setValue("admPersonalCompany", p.company);
  setValue("admPersonalPhone", p.phone);
  setValue("admPersonalWhatsApp", p.whatsapp);
  setValue("admPersonalEmail", p.email);
  setValue("admPersonalBio", p.bio);

  const coverUrl = branding.coverUrl || "";
  setValue("admProfileCoverUrl", coverUrl);
  const coverThumb = document.getElementById("admProfileCoverPreview");
  if (coverThumb) coverThumb.src = coverUrl || "./assets/placeholders/logo.jpg";
  setValue("admPersonalPhotoUrl", p.photoUrl);

  const personalThumb = document.getElementById("admPersonalPhotoPreview");
  if (personalThumb) {
    personalThumb.src = p.photoUrl || "./assets/placeholders/avatar.jpg";
  }

  // Business Profile Fields
  setValue("admBusinessName", b.name);
  setValue("admBusinessTagline", b.tagline);
  setValue("admBusinessAbout", b.about);
  setValue("admBusinessPhone", b.phone);
  setValue("admBusinessWhatsApp", b.whatsapp);
  setValue("admBusinessEmail", b.email);
  setValue("admBusinessLogoUrl", b.logoUrl);
  setValue("admBusinessCoverUrl", branding.businessCoverUrl || "");
  const businessCoverThumb = document.getElementById("admBusinessCoverPreview");
  if (businessCoverThumb) businessCoverThumb.src = branding.businessCoverUrl || "./assets/placeholders/logo.jpg";

  const logoThumb = document.getElementById("admBusinessLogoPreview");
  if (logoThumb) logoThumb.src = b.logoUrl || "./assets/placeholders/logo.jpg";

  setValue("admBrandLogoUrl", branding.logoUrl || b.logoUrl || "");
  setValue("admCardLogoUrl", branding.cardLogoUrl || branding.logoUrl || b.logoUrl || "");
  setValue("admFaviconUrl", branding.faviconUrl || branding.logoUrl || b.logoUrl || "");
  setValue("admAdminLogoUrl", branding.adminLogoUrl || branding.logoUrl || b.logoUrl || "");
  [["admBrandLogoPreview","admBrandLogoUrl"],["admCardLogoPreview","admCardLogoUrl"],["admFaviconPreview","admFaviconUrl"],["admAdminLogoPreview","admAdminLogoUrl"]].forEach(([img,id]) => {
    const el=document.getElementById(img), url=document.getElementById(id)?.value;
    if(el && url) el.src=url;
  });

  // Personal Social Standard Fields
  const pSocials = data.personalSocials || [];
  setSocialField(pSocials, "p_fb", "admPersonalFb", "admPersonalFbActive");
  setSocialField(pSocials, "p_ig", "admPersonalIg", "admPersonalIgActive");
  setSocialField(pSocials, "p_li", "admPersonalLi", "admPersonalLiActive");
  setSocialField(pSocials, "p_yt", "admPersonalYt", "admPersonalYtActive");
  setSocialField(pSocials, "p_tt", "admPersonalTt", "admPersonalTtActive");

  // Business Social Standard Fields
  const bSocials = data.businessSocials || [];
  setSocialField(bSocials, "b_fb", "admBusinessFb", "admBusinessFbActive");
  setSocialField(bSocials, "b_ig", "admBusinessIg", "admBusinessIgActive");
  setSocialField(bSocials, "b_li", "admBusinessLi", "admBusinessLiActive");
  setSocialField(bSocials, "b_yt", "admBusinessYt", "admBusinessYtActive");
  setSocialField(bSocials, "b_tt", "admBusinessTt", "admBusinessTtActive");

  // Settings
  setValue("admPublicUrl", s.publicUrl || window.location.origin + window.location.pathname.replace("admin.html", ""));
}

function setSocialField(list, id, urlInputId, toggleInputId) {
  const item = list.find(x => x.id === id);
  if (item) {
    setValue(urlInputId, item.url);
    const toggle = document.getElementById(toggleInputId);
    if (toggle) toggle.checked = item.active !== false;
  }
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined ? val : "";
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

/**
 * Tab Navigation
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-tab");
      if (!targetId) return;
      switchTab(targetId);
    });
  });

  // Setup quick jump buttons from Dashboard overview
  const jumpButtons = document.querySelectorAll(".quick-jump-btn");
  jumpButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-switch-tab");
      if (targetTab) {
        switchTab(targetTab);
      }
    });
  });
}

function switchTab(targetId) {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach(b => {
    if (b.getAttribute("data-tab") === targetId) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });

  tabPanes.forEach(p => {
    if (p.id === targetId) {
      p.classList.remove("hidden");
    } else {
      p.classList.add("hidden");
    }
  });

  adminState.activeTab = targetId;

  if (targetId === "tab-qr") {
    renderQrPreviews();
  }
}

/**
 * Image Upload Handling (Profile photo & Logo)
 * Directly uploads to Supabase Storage bucket 'kds-assets'
 */
function setupImageUploads() {
  // 1. Personal Avatar Upload
  setupUploader(
    "admPersonalPhotoFile",
    "admPersonalPhotoPreview",
    "admPersonalPhotoUrl",
    "avatar"
  );

  // 2. Business Logo Upload
  setupUploader("admBusinessLogoFile","admBusinessLogoPreview","admBusinessLogoUrl","logo");

  // 3-6. All other site branding assets
  setupUploader("admBrandLogoFile","admBrandLogoPreview","admBrandLogoUrl","brand_logo");
  setupUploader("admCardLogoFile","admCardLogoPreview","admCardLogoUrl","card_logo");
  setupUploader("admFaviconFile","admFaviconPreview","admFaviconUrl","favicon");
  setupUploader("admAdminLogoFile","admAdminLogoPreview","admAdminLogoUrl","admin_logo");
  // 7. Personal Profile Cover Photo Upload
  setupUploader("admProfileCoverFile","admProfileCoverPreview","admProfileCoverUrl","profile_cover");
  setupUploader("admBusinessCoverFile","admBusinessCoverPreview","admBusinessCoverUrl","business_cover");
}

function setupUploader(fileInputId, previewImgId, urlInputId, folderType) {
  const fileInput = document.getElementById(fileInputId);
  const previewImg = document.getElementById(previewImgId);
  const urlInput = document.getElementById(urlInputId);

  if (!fileInput) return;

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File is too large! Maximum allowed image size is 5MB.", "error");
      fileInput.value = "";
      return;
    }

    // Read local preview first
    const reader = new FileReader();
    reader.onload = async (event) => {
      const localDataUrl = event.target.result;
      if (previewImg) previewImg.src = localDataUrl;
      if (urlInput) urlInput.value = localDataUrl;
      markDirty();

      // Check if Supabase client is connected
      const client = window.KDS.getSupabaseClient();
      if (!client) {
        showToast("Image loaded locally. Notice: Connect Supabase in Settings for cloud CDN storage.", "info");
        return;
      }

      showToast(`Uploading ${file.name} to Supabase Storage...`, "info");

      try {
        const fileExt = file.name.split(".").pop().toLowerCase();
        const fileName = `${folderType}_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await client.storage
          .from("kds-assets")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        // Retrieve public URL
        const { data: { publicUrl } } = client.storage
          .from("kds-assets")
          .getPublicUrl(filePath);

        if (urlInput) urlInput.value = publicUrl;
        if (previewImg) previewImg.src = publicUrl;
        markDirty();
        showToast("Image uploaded successfully to Supabase Storage! Click 'Save Changes' to commit.", "success");
      } catch (uploadErr) {
        console.error("[KDS Admin] Upload error:", uploadErr);
        showToast("Storage upload failed: " + (uploadErr.message || uploadErr) + ". Retaining local image.", "error");
      }
    };
    reader.readAsDataURL(file);
  });

  // Also update preview if URL input is edited manually
  if (urlInput) {
    urlInput.addEventListener("input", () => {
      if (previewImg && urlInput.value) {
        previewImg.src = urlInput.value;
      }
      markDirty();
    });
  }
}

/**
 * General Media Uploader (Tab 6 - Tools & Media)
 */
function setupGeneralMediaUploader() {
  const fileInput = document.getElementById("mediaUploadGeneral");
  const outputDiv = document.getElementById("mediaUploadOutput");
  if (!fileInput || !outputDiv) return;

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File is too large! Maximum allowed image size is 5MB.", "error");
      fileInput.value = "";
      return;
    }

    const client = window.KDS.getSupabaseClient();
    outputDiv.innerHTML = `<span class="spinner"></span> Processing ${escapeHtml(file.name)}...`;

    if (!client) {
      const reader = new FileReader();
      reader.onload = (event) => {
        outputDiv.innerHTML = `
          <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-top: 8px; text-align: left;">
            <p style="color: var(--accent-cyan); font-weight: 600; margin-bottom: 6px;">Image Loaded Locally</p>
            <textarea readonly style="width: 100%; height: 60px; font-size: 0.75rem; background: var(--bg-dark); color: var(--text-muted); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px;">${event.target.result}</textarea>
            <p style="font-size: 0.75rem; color: var(--text-subtle); margin-top: 4px;">Connect Supabase in Settings to generate permanent hosted URLs.</p>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      const fileExt = file.name.split(".").pop().toLowerCase();
      const fileName = `media_${Date.now()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await client.storage
        .from("kds-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = client.storage
        .from("kds-assets")
        .getPublicUrl(filePath);

      outputDiv.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-top: 8px; text-align: left;">
          <p style="color: var(--accent-whatsapp); font-weight: 600; margin-bottom: 6px;">Upload Complete!</p>
          <div style="display: flex; gap: 8px; align-items: center;">
            <input type="text" readonly value="${publicUrl}" class="form-input" style="font-size: 0.8rem; flex: 1;" id="genMediaUrlCopied">
            <button type="button" class="btn btn-primary" id="btnCopyGenMedia" style="padding: 6px 14px; font-size: 0.8rem; white-space: nowrap;">Copy URL</button>
          </div>
        </div>
      `;

      const btnCopy = document.getElementById("btnCopyGenMedia");
      if (btnCopy) {
        btnCopy.addEventListener("click", () => {
          navigator.clipboard.writeText(publicUrl);
          showToast("Hosted image URL copied to clipboard!", "success");
        });
      }
    } catch (err) {
      console.error("[KDS Admin] General media upload error:", err);
      outputDiv.innerHTML = `<span style="color: #ef4444;">Upload failed: ${escapeHtml(err.message || err)}</span>`;
    }
  });
}

/**
 * Services Manager (Add, Edit, Delete, Reorder, Enable/Disable)
 */
function renderServicesManager() {
  const container = document.getElementById("admServicesContainer");
  if (!container) return;

  container.innerHTML = "";

  if (adminState.servicesList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px; color: var(--text-muted);">
        No services configured. Click "Add Service" below to create one.
      </div>
    `;
    return;
  }

  adminState.servicesList.forEach((srv, index) => {
    const card = document.createElement("div");
    card.className = "admin-service-card";
    card.id = `adm_srv_${srv.id}`;

    const isFirst = index === 0;
    const isLast = index === adminState.servicesList.length - 1;

    card.innerHTML = `
      <div class="service-card-top">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="service-icon-box" style="width: 36px; height: 36px;">
            ${window.KDS.getSvgIcon(srv.icon || "trending-up", "w-4 h-4")}
          </div>
          <div>
            <strong style="font-size: 0.96rem; color: var(--text-main);">${escapeHtml(srv.title)}</strong>
            <span style="font-size: 0.76rem; color: var(--text-muted); margin-left: 6px;">#${index + 1}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <!-- Active Toggle -->
          <label class="switch-label" title="Enable or disable this service">
            <input type="checkbox" class="switch-input srv-toggle" data-index="${index}" ${srv.active !== false ? "checked" : ""}>
            <span class="switch-slider"></span>
          </label>

          <!-- Reorder Up/Down -->
          <button type="button" class="btn-icon srv-move-up" data-index="${index}" ${isFirst ? "disabled style='opacity:0.3;cursor:default;'" : ""} title="Move Up">
            ${window.KDS.getSvgIcon("up", "w-4 h-4")}
          </button>
          <button type="button" class="btn-icon srv-move-down" data-index="${index}" ${isLast ? "disabled style='opacity:0.3;cursor:default;'" : ""} title="Move Down">
            ${window.KDS.getSvgIcon("down", "w-4 h-4")}
          </button>

          <!-- Edit Button -->
          <button type="button" class="btn-icon srv-edit" data-index="${index}" title="Edit Service">
            ${window.KDS.getSvgIcon("settings", "w-4 h-4")}
          </button>

          <!-- Delete Button -->
          <button type="button" class="btn-icon btn-danger srv-delete" data-index="${index}" title="Delete Service">
            ${window.KDS.getSvgIcon("trash", "w-4 h-4")}
          </button>
        </div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
        ${escapeHtml(srv.description)}
      </p>
    `;

    container.appendChild(card);
  });

  // Attach event listeners for reordering, toggling, edit, delete
  container.querySelectorAll(".srv-toggle").forEach(input => {
    input.addEventListener("change", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"), 10);
      adminState.servicesList[idx].active = e.target.checked;
      markDirty();
    });
  });

  container.querySelectorAll(".srv-move-up").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      if (idx > 0) {
        const temp = adminState.servicesList[idx];
        adminState.servicesList[idx] = adminState.servicesList[idx - 1];
        adminState.servicesList[idx - 1] = temp;
        renderServicesManager();
        markDirty();
      }
    });
  });

  container.querySelectorAll(".srv-move-down").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      if (idx < adminState.servicesList.length - 1) {
        const temp = adminState.servicesList[idx];
        adminState.servicesList[idx] = adminState.servicesList[idx + 1];
        adminState.servicesList[idx + 1] = temp;
        renderServicesManager();
        markDirty();
      }
    });
  });

  container.querySelectorAll(".srv-edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      openServiceModal(idx);
    });
  });

  container.querySelectorAll(".srv-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      const target = adminState.servicesList[idx];
      if (confirm(`Are you sure you want to delete service "${target.title}"?`)) {
        adminState.servicesList.splice(idx, 1);
        renderServicesManager();
        markDirty();
        showToast("Service deleted.", "info");
      }
    });
  });
}

/**
 * Service Edit / Add Modal
 */
let editingServiceIndex = -1;

function closeServiceModal() {
  const modal = document.getElementById("serviceModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }
}

function openServiceModal(index) {
  editingServiceIndex = index;
  const modal = document.getElementById("serviceModal");
  const titleEl = document.getElementById("serviceModalHeading");

  if (index >= 0) {
    const srv = adminState.servicesList[index];
    if (titleEl) titleEl.textContent = "Edit Service";
    setValue("modalServiceTitle", srv ? srv.title : "");
    setValue("modalServiceDesc", srv ? srv.description : "");
    setValue("modalServiceIcon", (srv && srv.icon) ? srv.icon : "trending-up");
  } else {
    if (titleEl) titleEl.textContent = "Add New Service";
    setValue("modalServiceTitle", "");
    setValue("modalServiceDesc", "");
    setValue("modalServiceIcon", "trending-up");
  }

  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    const titleInput = document.getElementById("modalServiceTitle");
    if (titleInput) titleInput.focus();
  }
}

function setupServiceModal() {
  const btnAddService = document.getElementById("btnAddService");
  const modal = document.getElementById("serviceModal");
  const form = document.getElementById("serviceModalForm");
  const btnClose = document.getElementById("btnCloseServiceModal");
  const btnCancel = document.getElementById("btnCancelServiceModal");

  // Guarantee modal is strictly hidden on initialization
  closeServiceModal();

  if (btnAddService) {
    btnAddService.addEventListener("click", () => {
      openServiceModal(-1);
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", (e) => {
      e.preventDefault();
      closeServiceModal();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", (e) => {
      e.preventDefault();
      closeServiceModal();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeServiceModal();
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none" && !modal.classList.contains("hidden")) {
        closeServiceModal();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = getValue("modalServiceTitle");
      const desc = getValue("modalServiceDesc");
      const icon = getValue("modalServiceIcon") || "trending-up";

      if (!title || !desc) {
        showToast("Please provide both title and description for the service.", "error");
        return;
      }

      if (editingServiceIndex >= 0) {
        // Edit existing
        adminState.servicesList[editingServiceIndex].title = title;
        adminState.servicesList[editingServiceIndex].description = desc;
        adminState.servicesList[editingServiceIndex].icon = icon;
        showToast("Service updated.", "success");
      } else {
        // Add new
        const newSrv = {
          id: `srv_${Date.now()}`,
          title,
          description: desc,
          icon,
          active: true
        };
        adminState.servicesList.push(newSrv);
        showToast("New service added.", "success");
      }

      closeServiceModal();
      renderServicesManager();
      markDirty();
    });
  }
}

/**
 * Custom Social Media Links Manager
 */
function renderCustomSocials() {
  renderCustomSocialList("admPersonalCustomSocials", adminState.customPersonalSocials, "personal");
  renderCustomSocialList("admBusinessCustomSocials", adminState.customBusinessSocials, "business");
}

function renderCustomSocialList(containerId, list, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-subtle); padding: 8px 0;">No custom links added yet.</div>`;
    return;
  }

  list.forEach((item, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.marginBottom = "10px";

    const currentIcon = item.icon || window.KDS.detectSocialIcon(item.platform);

    row.innerHTML = `
      <div class="custom-icon-display" data-index="${index}" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 6px; flex-shrink: 0;">
        ${window.KDS.getSvgIcon(currentIcon, "w-4 h-4")}
      </div>
      <input type="text" class="form-input custom-plat" data-index="${index}" data-type="${type}" placeholder="Platform" value="${escapeHtml(item.platform)}" style="width: 130px;">
      <input type="url" class="form-input custom-url" data-index="${index}" data-type="${type}" placeholder="https://..." value="${escapeHtml(item.url)}" style="flex: 1;">
      <label class="switch-label" title="Active">
        <input type="checkbox" class="switch-input custom-toggle" data-index="${index}" data-type="${type}" ${item.active !== false ? "checked" : ""}>
        <span class="switch-slider"></span>
      </label>
      <button type="button" class="btn-icon btn-danger custom-delete" data-index="${index}" data-type="${type}" title="Remove">
        ${window.KDS.getSvgIcon("trash", "w-4 h-4")}
      </button>
    `;

    container.appendChild(row);
  });

  // Attach listeners
  container.querySelectorAll(".custom-plat").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"), 10);
      const platVal = e.target.value.trim();
      list[idx].platform = e.target.value;
      const detectedIcon = window.KDS.detectSocialIcon(platVal);
      list[idx].icon = detectedIcon;

      // Dynamically update icon display in real-time
      const row = inp.closest("div");
      const iconBox = row ? row.querySelector(".custom-icon-display") : null;
      if (iconBox) {
        iconBox.innerHTML = window.KDS.getSvgIcon(detectedIcon, "w-4 h-4");
      }
      markDirty();
    });
  });

  container.querySelectorAll(".custom-url").forEach(inp => {
    inp.addEventListener("input", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"), 10);
      list[idx].url = e.target.value;
      markDirty();
    });
  });

  container.querySelectorAll(".custom-toggle").forEach(inp => {
    inp.addEventListener("change", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"), 10);
      list[idx].active = e.target.checked;
      markDirty();
    });
  });

  container.querySelectorAll(".custom-delete").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      list.splice(idx, 1);
      renderCustomSocials();
      markDirty();
    });
  });
}

function setupCustomSocialListeners() {
  const btnAddPersonal = document.getElementById("btnAddPersonalCustomSocial");
  const btnAddBusiness = document.getElementById("btnAddBusinessCustomSocial");

  if (btnAddPersonal) {
    btnAddPersonal.addEventListener("click", () => {
      adminState.customPersonalSocials.push({
        id: `custom_p_${Date.now()}`,
        platform: "Website",
        icon: "globe",
        url: "",
        active: true
      });
      renderCustomSocials();
      markDirty();
    });
  }

  if (btnAddBusiness) {
    btnAddBusiness.addEventListener("click", () => {
      adminState.customBusinessSocials.push({
        id: `custom_b_${Date.now()}`,
        platform: "Website",
        icon: "globe",
        url: "",
        active: true
      });
      renderCustomSocials();
      markDirty();
    });
  }
}

/**
 * QR Code Previews
 */
function renderQrPreviews() {
  const publicUrl = getValue("admPublicUrl") || window.location.origin + window.location.pathname.replace("admin.html", "");
  const personalUrl = publicUrl;
  const businessUrl = publicUrl.endsWith("/") ? publicUrl + "business.html" : publicUrl + "/business.html";

  const pCanvas = document.getElementById("admPersonalQrPreview");
  const bCanvas = document.getElementById("admBusinessQrPreview");

  if (typeof QRCode !== "undefined") {
    if (pCanvas) {
      QRCode.toCanvas(pCanvas, personalUrl, { width: 140, margin: 1 });
    }
    if (bCanvas) {
      QRCode.toCanvas(bCanvas, businessUrl, { width: 140, margin: 1 });
    }
  }

  // Setup Download buttons
  const btnDownP = document.getElementById("btnAdmDownloadPersonalQr");
  const btnDownB = document.getElementById("btnAdmDownloadBusinessQr");

  if (btnDownP && pCanvas) {
    btnDownP.onclick = () => {
      const a = document.createElement("a");
      a.download = "KDS_Personal_Card_QR.png";
      a.href = pCanvas.toDataURL("image/png");
      a.click();
    };
  }
  if (btnDownB && bCanvas) {
    btnDownB.onclick = () => {
      const a = document.createElement("a");
      a.download = "KDS_Business_Profile_QR.png";
      a.href = bCanvas.toDataURL("image/png");
      a.click();
    };
  }
}

/**
 * Setup Save and Discard Actions
 */
function setupSaveActions() {
  const btnSave = document.getElementById("btnSaveChanges");
  const btnDiscard = document.getElementById("btnDiscardChanges");

  if (btnSave) {
    btnSave.addEventListener("click", async () => {
      await saveAllChanges();
    });
  }

  if (btnDiscard) {
    btnDiscard.addEventListener("click", () => {
      if (confirm("Discard all unsaved changes and reload current saved settings?")) {
        populateAllForms(adminState.data);
        adminState.servicesList = JSON.parse(JSON.stringify(adminState.data.services || []));
        adminState.customPersonalSocials = JSON.parse(JSON.stringify((adminState.data.personalSocials || []).filter(isCustomSocial)));
        adminState.customBusinessSocials = JSON.parse(JSON.stringify((adminState.data.businessSocials || []).filter(isCustomSocial)));
        renderServicesManager();
        renderCustomSocials();
        clearDirty();
        showToast("Changes discarded.", "info");
      }
    });
  }

  // Detect changes on any input
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", markDirty);
    el.addEventListener("change", markDirty);
  });
}

function markDirty() {
  adminState.isDirty = true;
  const dot = document.querySelector(".save-status-dot");
  const text = document.getElementById("saveStatusText");
  if (dot) dot.classList.add("dirty");
  if (text) text.textContent = "Unsaved changes";
}

function clearDirty() {
  adminState.isDirty = false;
  const dot = document.querySelector(".save-status-dot");
  const text = document.getElementById("saveStatusText");
  if (dot) dot.classList.remove("dirty");
  if (text) text.textContent = "All changes saved";
}

/**
 * SAVE ALL CHANGES TO SUPABASE
 * Full validation, async/await, try/catch, detailed feedback
 */
async function saveAllChanges() {
  if (adminState.isSaving) return;

  const btnSave = document.getElementById("btnSaveChanges");
  const originalHtml = btnSave ? btnSave.innerHTML : "Save Changes";

  try {
    adminState.isSaving = true;
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.innerHTML = `<span class="spinner"></span> Saving to Supabase...`;
    }

    // 1. Collect & Validate Personal Data
    const personalName = getValue("admPersonalName");
    const personalPhone = getValue("admPersonalPhone");
    const personalEmail = getValue("admPersonalEmail");
    const personalWa = getValue("admPersonalWhatsApp");

    if (!personalName) {
      throw new Error("Personal Name is required.");
    }
    if (!personalEmail || !personalEmail.includes("@")) {
      throw new Error("Valid Personal Email address is required.");
    }

    const cleanPhone = (phone) => {
      if (!phone) return "";
      const raw = phone.replace(/[^\d+]/g, "");
      return raw.startsWith("+") ? raw : "+88" + raw.replace(/^0/, "");
    };

    const cleanWa = (wa) => {
      if (!wa) return "";
      const digits = wa.replace(/[^\d]/g, "");
      return digits.startsWith("88") ? digits : "88" + digits.replace(/^0/, "");
    };

    const normUrl = (u) => {
      if (!u || !u.trim()) return "";
      return window.KDS.normalizeUrl(u.trim());
    };

    const personal = {
      name: personalName,
      designation: getValue("admPersonalDesignation"),
      company: getValue("admPersonalCompany"),
      phone: personalPhone,
      phoneFormatted: cleanPhone(personalPhone),
      whatsapp: personalWa,
      whatsappFormatted: cleanWa(personalWa),
      email: personalEmail,
      bio: getValue("admPersonalBio"),
      photoUrl: getValue("admPersonalPhotoUrl") || "./assets/placeholders/avatar.jpg",
      website: getValue("admPublicUrl") || window.location.origin
    };

    // 2. Collect & Validate Business Data
    const businessName = getValue("admBusinessName");
    const businessPhone = getValue("admBusinessPhone");
    const businessWa = getValue("admBusinessWhatsApp");

    if (!businessName) {
      throw new Error("Business Name is required.");
    }

    const business = {
      name: businessName,
      tagline: getValue("admBusinessTagline"),
      about: getValue("admBusinessAbout"),
      phone: businessPhone,
      phoneFormatted: cleanPhone(businessPhone),
      whatsapp: businessWa,
      whatsappFormatted: cleanWa(businessWa),
      email: getValue("admBusinessEmail"),
      logoUrl: getValue("admBusinessLogoUrl") || "./assets/placeholders/logo.jpg",
      website: getValue("admPublicUrl") ? getValue("admPublicUrl").replace(/\/+$/, "") + "/business.html" : window.location.origin + "/business.html"
    };

    // 3. Assemble Personal Socials (Standard + Custom - Facebook, Instagram, LinkedIn, YouTube, TikTok only for standard)
    const personalSocials = [
      { id: "p_fb", platform: "Facebook", icon: "facebook", url: normUrl(getValue("admPersonalFb")), active: document.getElementById("admPersonalFbActive")?.checked !== false },
      { id: "p_ig", platform: "Instagram", icon: "instagram", url: normUrl(getValue("admPersonalIg")), active: document.getElementById("admPersonalIgActive")?.checked !== false },
      { id: "p_li", platform: "LinkedIn", icon: "linkedin", url: normUrl(getValue("admPersonalLi")), active: document.getElementById("admPersonalLiActive")?.checked !== false },
      { id: "p_yt", platform: "YouTube", icon: "youtube", url: normUrl(getValue("admPersonalYt")), active: document.getElementById("admPersonalYtActive")?.checked !== false },
      { id: "p_tt", platform: "TikTok", icon: "tiktok", url: normUrl(getValue("admPersonalTt")), active: document.getElementById("admPersonalTtActive")?.checked !== false },
      ...adminState.customPersonalSocials
        .filter(item => item && (item.id || "").toLowerCase() !== "p_em" && (item.platform || "").toLowerCase() !== "email")
        .map(item => ({
          ...item,
          url: normUrl(item.url),
          icon: item.icon || window.KDS.detectSocialIcon(item.platform)
        }))
    ];

    // 4. Assemble Business Socials (Standard + Custom - Facebook, Instagram, LinkedIn, YouTube, TikTok only for standard)
    const businessSocials = [
      { id: "b_fb", platform: "Facebook", icon: "facebook", url: normUrl(getValue("admBusinessFb")), active: document.getElementById("admBusinessFbActive")?.checked !== false },
      { id: "b_ig", platform: "Instagram", icon: "instagram", url: normUrl(getValue("admBusinessIg")), active: document.getElementById("admBusinessIgActive")?.checked !== false },
      { id: "b_li", platform: "LinkedIn", icon: "linkedin", url: normUrl(getValue("admBusinessLi")), active: document.getElementById("admBusinessLiActive")?.checked !== false },
      { id: "b_yt", platform: "YouTube", icon: "youtube", url: normUrl(getValue("admBusinessYt")), active: document.getElementById("admBusinessYtActive")?.checked !== false },
      { id: "b_tt", platform: "TikTok", icon: "tiktok", url: normUrl(getValue("admBusinessTt")), active: document.getElementById("admBusinessTtActive")?.checked !== false },
      ...adminState.customBusinessSocials
        .filter(item => item && (item.id || "").toLowerCase() !== "b_em" && (item.platform || "").toLowerCase() !== "email")
        .map(item => ({
          ...item,
          url: normUrl(item.url),
          icon: item.icon || window.KDS.detectSocialIcon(item.platform)
        }))
    ];

    // 5. Settings
    const settings = {
      publicUrl: getValue("admPublicUrl"),
      themeColor: "#0f172a",
      accentColor: "#0284c7"
    };

    // Full JSON payload
    const updatedSiteData = {
      personal,
      personalSocials,
      business,
      businessSocials,
      services: adminState.servicesList,
      branding: {
        logoUrl: getValue("admBrandLogoUrl") || getValue("admBusinessLogoUrl") || "",
        cardLogoUrl: getValue("admCardLogoUrl") || getValue("admBrandLogoUrl") || "",
        faviconUrl: getValue("admFaviconUrl") || getValue("admBrandLogoUrl") || "",
        adminLogoUrl: getValue("admAdminLogoUrl") || getValue("admBrandLogoUrl") || "",
        coverUrl: getValue("admProfileCoverUrl") || "",
        businessCoverUrl: getValue("admBusinessCoverUrl") || ""
      },
      settings
    };

    // Always commit to Local Storage first for reliable local state preservation

    adminState.data = updatedSiteData;

    // 6. Save to Supabase Database if client is configured
    const client = window.KDS.getSupabaseClient();
    if (!client) {
      throw new Error("Supabase is not connected. Cloud sync is required to save changes for everyone.");
    }

    const { error: upsertError } = await client
      .from("site_data")
      .upsert({
        id: "kds_main",
        data: updatedSiteData,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error("[KDS Admin] Supabase write error:", upsertError);
      throw new Error("Cloud sync failed: " + upsertError.message);
    }

    clearDirty();
    showToast("Changes saved to Supabase. Everyone will see the updated card.", "success");
    updateOverviewStats();
    renderQrPreviews();

  } catch (err) {
    console.error("[KDS Admin] Save failed:", err);
    showToast("Save failed: " + (err.message || err), "error");
  } finally {
    adminState.isSaving = false;
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.innerHTML = originalHtml;
    }
  }
}

/**
 * Settings Tab: Supabase Connection, Export, Import, Reset
 */
function setupSettingsForm() {
  const urlInput = document.getElementById("cfgSupabaseUrl");
  const keyInput = document.getElementById("cfgSupabaseAnonKey");
  const btnToggleKey = document.getElementById("btnToggleAnonKeyVisibility");
  const btnSaveConfig = document.getElementById("btnSaveSupabaseConfig");
  const btnTestConn = document.getElementById("btnTestSupabaseConn");
  const btnDisconnect = document.getElementById("btnDisconnectSupabase");
  const btnExport = document.getElementById("btnExportJson");
  const fileImport = document.getElementById("fileImportJson");
  const btnReset = document.getElementById("btnResetDefaults");
  const statusBadge = document.getElementById("cfgConnectionBadge");
  const statusText = document.getElementById("cfgConnectionStatusText");

  // Pre-fill Project URL with the project URL or saved value
  const savedUrl = localStorage.getItem("KDS_SUPABASE_URL");
  if (urlInput) {
    urlInput.value = savedUrl || window.KDS.DEFAULT_SUPABASE_URL || "https://sypwzqawdxgxzmwimjbp.supabase.co";
  }

  // Pre-fill Anon Key from storage if available
  const savedKey = localStorage.getItem("KDS_SUPABASE_ANON_KEY");
  if (keyInput) {
    keyInput.value = savedKey || "";
  }

  // Toggle Anon Key Visibility
  if (btnToggleKey && keyInput) {
    btnToggleKey.addEventListener("click", () => {
      if (keyInput.type === "password") {
        keyInput.type = "text";
        btnToggleKey.textContent = "Hide";
      } else {
        keyInput.type = "password";
        btnToggleKey.textContent = "Show";
      }
    });
  }

  // Helper to check if a JWT is a service_role secret key
  const isSecretServiceRoleKey = (key) => {
    try {
      const parts = key.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload.role === "service_role";
      }
    } catch (e) {}
    return false;
  };

  // Helper to produce friendly, safe error messages without leaking internals
  const getFriendlyErrorMessage = (err, context) => {
    const msg = (err && (err.message || String(err))) || "";
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      return "Database connection failure: Unable to reach the Supabase project. Verify that the Project URL is correct and active.";
    }
    if (msg.includes("Invalid JWT") || msg.includes("JWT") || err?.code === "PGRST301") {
      return "Authentication failure: The provided Anon Key is invalid or expired. Check your Supabase API settings.";
    }
    if (msg.includes("42P01") || msg.includes("relation \"site_data\" does not exist")) {
      return "Database table error: 'site_data' table does not exist. Please run supabase.sql in your Supabase SQL Editor.";
    }
    return context ? `${context}: ${msg}` : msg;
  };

  // Update visual Connection Status indicator
  async function refreshConnectionStatusUI() {
    const activeUrl = urlInput ? urlInput.value.trim().replace(/\/+$/, "") : "";
    const activeKey = keyInput ? keyInput.value.trim() : "";

    if (!activeUrl || !activeKey) {
      if (statusBadge) {
        statusBadge.textContent = "Not Configured";
        statusBadge.style.background = "rgba(245, 158, 11, 0.15)";
        statusBadge.style.color = "#f59e0b";
        statusBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
      }
      if (statusText) {
        statusText.innerHTML = `Supabase is not configured yet. Enter your public Anon/Publishable Key above and click <strong>Save Supabase Configuration</strong> to connect to <code>${escapeHtml(activeUrl || "https://sypwzqawdxgxzmwimjbp.supabase.co")}</code>.`;
      }
      return;
    }

    if (statusBadge) {
      statusBadge.textContent = "Verifying...";
      statusBadge.style.background = "rgba(56, 189, 248, 0.15)";
      statusBadge.style.color = "#38bdf8";
      statusBadge.style.borderColor = "rgba(56, 189, 248, 0.3)";
    }
    if (statusText) {
      statusText.textContent = "Connecting to Supabase and probing 'site_data' table...";
    }

    try {
      if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
        throw new Error("Supabase library not loaded in browser.");
      }

      const client = window.supabase.createClient(activeUrl, activeKey);
      const { data, error } = await client
        .from("site_data")
        .select("id, updated_at")
        .eq("id", "kds_main")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (statusBadge) {
        statusBadge.textContent = "● Connected";
        statusBadge.style.background = "rgba(34, 197, 94, 0.15)";
        statusBadge.style.color = "#22c55e";
        statusBadge.style.borderColor = "rgba(34, 197, 94, 0.3)";
      }
      if (statusText) {
        const lastUpdated = data?.updated_at ? new Date(data.updated_at).toLocaleString() : "Active";
        statusText.innerHTML = `<span style="color:#22c55e; font-weight:700;">✓ Connected Successfully</span> to Supabase (<code style="color:var(--accent-cyan);">${escapeHtml(activeUrl)}</code>). Table <code>site_data</code> verified (record <code>kds_main</code> ${data ? "found, last updated: " + lastUpdated : "ready for saving"}).`;
      }

      const overviewSupabaseStatus = document.getElementById("statSupabaseStatus");
      if (overviewSupabaseStatus) {
        overviewSupabaseStatus.textContent = "Connected (Cloud RLS)";
        overviewSupabaseStatus.style.color = "var(--accent-whatsapp)";
      }
    } catch (err) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Connection error");
      if (statusBadge) {
        statusBadge.textContent = "Connection Error";
        statusBadge.style.background = "rgba(239, 68, 68, 0.15)";
        statusBadge.style.color = "#f87171";
        statusBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
      }
      if (statusText) {
        statusText.innerHTML = `<span style="color:#f87171; font-weight:700;">✕ ${escapeHtml(friendlyMsg)}</span>`;
      }
    }
  }

  // Initial status check on setup
  refreshConnectionStatusUI();

  // SAVE SUPABASE CONFIGURATION
  if (btnSaveConfig) {
    btnSaveConfig.addEventListener("click", async () => {
      const newUrl = urlInput ? urlInput.value.trim().replace(/\/+$/, "") : "";
      const newKey = keyInput ? keyInput.value.trim() : "";

      if (!newUrl) {
        showToast("Please provide the Supabase Project URL.", "error");
        return;
      }

      if (!newUrl.startsWith("https://")) {
        showToast("Invalid Supabase URL: URL must start with https:// (e.g. https://sypwzqawdxgxzmwimjbp.supabase.co)", "error");
        return;
      }

      if (!newKey) {
        showToast("Please enter your Supabase Public Anon / Publishable Key.", "error");
        return;
      }

      if (isSecretServiceRoleKey(newKey)) {
        showToast("Security Block: You entered a Supabase service_role key! Never use the service_role secret in the frontend. Use the public Anon key only.", "error");
        return;
      }

      if (newKey.length < 20) {
        showToast("Invalid Supabase Key: The Anon key is too short. Please copy the full anon key from your Supabase API settings.", "error");
        return;
      }

      btnSaveConfig.disabled = true;
      btnSaveConfig.innerHTML = `<span class="spinner"></span> Connecting...`;

      try {
        // Save to LocalStorage
        localStorage.setItem("KDS_SUPABASE_URL", newUrl);
        localStorage.setItem("KDS_SUPABASE_ANON_KEY", newKey);

        // Initialize / Refresh the Supabase client
        const client = window.KDS.getSupabaseClient();
        if (!client) {
          throw new Error("Failed to initialize Supabase client with the provided credentials.");
        }

        // Test connection and attempt to fetch existing kds_main data
        const { data, error } = await client
          .from("site_data")
          .select("data, updated_at")
          .eq("id", "kds_main")
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data && data.data) {
          // Load the existing kds_main data from Supabase into the Admin Panel!
          adminState.data = data.data;
          adminState.servicesList = JSON.parse(JSON.stringify(data.data.services || []));
          adminState.customPersonalSocials = JSON.parse(JSON.stringify((data.data.personalSocials || []).filter(isCustomSocial)));
          adminState.customBusinessSocials = JSON.parse(JSON.stringify((data.data.businessSocials || []).filter(isCustomSocial)));
          populateAllForms(data.data);
          renderServicesManager();
          renderCustomSocials();
          renderQrPreviews();
          updateOverviewStats();

          showToast("Supabase connected! Existing site data (kds_main) loaded successfully.", "success");
        } else {
          // Table is accessible, but kds_main row doesn't exist yet - upsert initial data
          const initialPayload = adminState.data || window.KDS.DEFAULT_SITE_DATA;
          await client.from("site_data").upsert({
            id: "kds_main",
            data: initialPayload,
            updated_at: new Date().toISOString()
          });
          showToast("Supabase connected! Initialized 'kds_main' row in database.", "success");
        }

        await refreshConnectionStatusUI();

        // Update Overview status
        const elSupabaseStatus = document.getElementById("statSupabaseStatus");
        if (elSupabaseStatus) {
          elSupabaseStatus.textContent = "Connected (Cloud RLS)";
          elSupabaseStatus.style.color = "var(--accent-whatsapp)";
        }

      } catch (err) {
        console.error("[KDS Admin] Save Supabase config error:", err);
        const friendlyMsg = getFriendlyErrorMessage(err, "Failed to connect to Supabase");
        showToast(friendlyMsg, "error");
        await refreshConnectionStatusUI();
      } finally {
        btnSaveConfig.disabled = false;
        btnSaveConfig.innerHTML = `Save Supabase Configuration`;
      }
    });
  }

  // TEST CONNECTION BUTTON
  if (btnTestConn) {
    btnTestConn.addEventListener("click", async () => {
      btnTestConn.disabled = true;
      btnTestConn.innerHTML = `<span class="spinner"></span> Testing...`;

      const testUrl = urlInput ? urlInput.value.trim().replace(/\/+$/, "") : "";
      const testKey = keyInput ? keyInput.value.trim() : "";

      if (!testUrl || !testKey) {
        showToast("Please enter both Supabase URL and Anon Key to test.", "error");
        btnTestConn.disabled = false;
        btnTestConn.innerHTML = "Test Connection";
        return;
      }

      if (!testUrl.startsWith("https://")) {
        showToast("Invalid Supabase URL: URL must start with https:// (e.g. https://sypwzqawdxgxzmwimjbp.supabase.co)", "error");
        btnTestConn.disabled = false;
        btnTestConn.innerHTML = "Test Connection";
        return;
      }

      if (isSecretServiceRoleKey(testKey)) {
        showToast("Security Block: You entered a Supabase service_role secret key! Use the public Anon key instead.", "error");
        btnTestConn.disabled = false;
        btnTestConn.innerHTML = "Test Connection";
        return;
      }

      try {
        if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
          throw new Error("Supabase JS library is not loaded. Check your internet connection.");
        }

        const testClient = window.supabase.createClient(testUrl, testKey);
        const { data, error } = await testClient
          .from("site_data")
          .select("id, updated_at")
          .eq("id", "kds_main")
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        showToast("Supabase Connection Successful! Database table 'site_data' is fully accessible.", "success");
        await refreshConnectionStatusUI();
      } catch (connErr) {
        console.error("[KDS Admin] Connection test error:", connErr);
        const friendlyMsg = getFriendlyErrorMessage(connErr, "Connection failed");
        showToast(friendlyMsg, "error");
        await refreshConnectionStatusUI();
      } finally {
        btnTestConn.disabled = false;
        btnTestConn.innerHTML = "Test Connection";
      }
    });
  }

  // DISCONNECT SUPABASE
  if (btnDisconnect) {
    btnDisconnect.addEventListener("click", () => {
      if (confirm("Disconnect Supabase? The application will fall back to local storage and offline mode.")) {
        localStorage.removeItem("KDS_SUPABASE_URL");
        localStorage.removeItem("KDS_SUPABASE_ANON_KEY");
        if (keyInput) keyInput.value = "";
        showToast("Supabase disconnected. Operating in local mode.", "info");
        refreshConnectionStatusUI();
        updateOverviewStats();
      }
    });
  }

  // EXPORT JSON BACKUP
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(adminState.data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `KDS_SiteData_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Data exported as JSON file.", "success");
    });
  }

  // IMPORT JSON BACKUP
  if (fileImport) {
    fileImport.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (!imported.personal || !imported.business) {
            throw new Error("Invalid backup file format.");
          }
          adminState.data = imported;
          adminState.servicesList = JSON.parse(JSON.stringify(imported.services || []));
          adminState.customPersonalSocials = JSON.parse(JSON.stringify((imported.personalSocials || []).filter(isCustomSocial)));
          adminState.customBusinessSocials = JSON.parse(JSON.stringify((imported.businessSocials || []).filter(isCustomSocial)));
          populateAllForms(imported);
          renderServicesManager();
          renderCustomSocials();
          markDirty();
          showToast("Data imported successfully! Click 'Save Changes' to commit.", "success");
        } catch (jsonErr) {
          showToast("Failed to parse JSON file: " + jsonErr.message, "error");
        }
      };
      reader.readAsText(file);
    });
  }

  // RESET DEFAULTS
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("Reset all settings to initial Khan Digital Solution defaults? This will overwrite unsaved changes.")) {
        adminState.data = JSON.parse(JSON.stringify(window.KDS.DEFAULT_SITE_DATA));
        adminState.servicesList = JSON.parse(JSON.stringify(adminState.data.services));
        adminState.customPersonalSocials = [];
        adminState.customBusinessSocials = [];
        populateAllForms(adminState.data);
        renderServicesManager();
        renderCustomSocials();
        markDirty();
        showToast("Reset to defaults. Remember to click 'Save Changes'!", "info");
      }
    });
  }
}

/**
 * Overview Stats
 */
function updateOverviewStats() {
  const elSrvCount = document.getElementById("statServicesCount");
  const elSocialCount = document.getElementById("statSocialCount");
  const elSupabaseStatus = document.getElementById("statSupabaseStatus");

  if (elSrvCount) {
    elSrvCount.textContent = adminState.servicesList.length;
  }
  if (elSocialCount) {
    const pCount = (adminState.data?.personalSocials || []).filter(x => x.active !== false).length;
    const bCount = (adminState.data?.businessSocials || []).filter(x => x.active !== false).length;
    elSocialCount.textContent = `${pCount} Personal / ${bCount} Business`;
  }
  if (elSupabaseStatus) {
    if (window.KDS.isSupabaseConfigured()) {
      elSupabaseStatus.textContent = "Connected (Cloud RLS)";
      elSupabaseStatus.style.color = "var(--accent-whatsapp)";
    } else {
      elSupabaseStatus.textContent = "Not Configured (Local Mode)";
      elSupabaseStatus.style.color = "#f59e0b";
    }
  }
}

/**
 * Toast Notification System
 */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? window.KDS.getSvgIcon("check", "w-4 h-4") : (type === "error" ? window.KDS.getSvgIcon("trash", "w-4 h-4") : window.KDS.getSvgIcon("sparkles", "w-4 h-4"))}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
