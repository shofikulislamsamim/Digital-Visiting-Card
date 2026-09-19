/**
 * Khan Digital Solution – Digital Visiting Card & Business Profile
 * Public Frontend Application Script (Vanilla JS)
 *
 * Single public render pipeline: cloud data -> profile/business UI -> QR.
 */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Supabase Configuration Banner
  const configBanner = document.getElementById("supabaseConfigBanner");
  if (configBanner) {
    if (!window.KDS.isSupabaseConfigured()) {
      configBanner.classList.remove("hidden");
    } else {
      configBanner.classList.add("hidden");
    }
  }

  // 2. Fetch Active Site Data
  let siteData = null;
  try {
    siteData = await window.KDS.getSiteData();
  } catch (err) {
    console.error("[KDS] Error loading site data:", err);
    siteData = window.KDS.DEFAULT_SITE_DATA;
  }

  const isBusinessPage = window.location.pathname.includes("business.html");

  if (isBusinessPage) {
    renderBusinessPage(siteData);
  } else {
    renderPersonalPage(siteData);
  }
});

/**
 * Render Personal Profile (index.html)
 */
function applySiteBranding(data) {
  const b = data?.branding || data?.settings?.branding || {};
  const fallback = data?.business?.logoUrl || window.KDS.DEFAULT_SITE_DATA.business.logoUrl;
  const logo = b.logoUrl || fallback;
  const cardLogo = b.cardLogoUrl || logo;
  const favicon = b.faviconUrl || logo;

  document.querySelectorAll(".switch-logo").forEach(el => {
    el.src = cardLogo;
    el.onerror = () => { el.src = fallback; };
  });

  document.querySelectorAll('link[rel="icon"]').forEach(el => {
    el.href = favicon;
  });
}

function renderPersonalPage(data) {
  applySiteBranding(data);
  const p = data.personal || {};
  const coverUrl = data?.branding?.coverUrl || "";
  const cover = document.getElementById("personalProfileCover");
  if (cover) {
    cover.innerHTML = "";
    if (coverUrl) {
      const img = document.createElement("img");
      img.className = "profile-cover-image";
      img.alt = "";
      img.src = coverUrl;
      img.onerror = () => {
        cover.innerHTML = '<div class="profile-cover-placeholder"></div>';
      };
      cover.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "profile-cover-placeholder";
      cover.appendChild(placeholder);
    }
  }

  // Personal Info Elements
  const elAvatar = document.getElementById("personalAvatar");
  const elName = document.getElementById("personalName");
  const elDesignation = document.getElementById("personalDesignation");
  const elCompany = document.getElementById("personalCompany");
  const elBio = document.getElementById("personalBio");

  if (elAvatar) {
    elAvatar.src = p.photoUrl || window.KDS.DEFAULT_SITE_DATA.personal.photoUrl;
    elAvatar.onerror = () => {
      elAvatar.src = window.KDS.DEFAULT_SITE_DATA.personal.photoUrl;
    };
  }
  if (elName) elName.textContent = p.name || "Shofikul Islam Samim";
  if (elDesignation) elDesignation.textContent = p.designation || "Owner & CEO";
  if (elCompany) elCompany.textContent = p.company || "Khan Digital Solution";
  if (elBio) elBio.textContent = p.bio || "";

  // Contact Action Buttons (Call, WhatsApp, Email, Save Contact)
  const phoneClean = (p.phoneFormatted || p.phone || "01744188460").replace(/[^\d+]/g, "");
  const waClean = (p.whatsappFormatted || p.whatsapp || "01744188460").replace(/[^\d]/g, "");
  const emailAddr = p.email || "samim.khanmiyaa@gmail.com";

  const btnCall = document.getElementById("btnCall");
  const btnWhatsApp = document.getElementById("btnWhatsApp");
  const btnEmail = document.getElementById("btnEmail");
  const btnVCard = document.getElementById("btnVCard");
  const btnSaveContactMain = document.getElementById("btnSaveContactMain");

  if (btnCall) btnCall.href = `tel:${phoneClean.startsWith("+") ? phoneClean : "+88" + phoneClean.replace(/^0/, "")}`;
  if (btnWhatsApp) btnWhatsApp.href = `https://wa.me/${waClean.startsWith("88") ? waClean : "88" + waClean.replace(/^0/, "")}`;
  if (btnEmail) btnEmail.href = `mailto:${emailAddr}`;


  // Render Personal Social Links (Icons only, no raw URLs)
  const socialsContainer = document.getElementById("personalSocialsList");
  if (socialsContainer && Array.isArray(data.personalSocials)) {
    socialsContainer.innerHTML = "";
    data.personalSocials
      .filter(item => {
        if (item.active === false || !item.url || !item.url.trim()) return false;
        const id = (item.id || "").toLowerCase();
        const plat = (item.platform || "").toLowerCase();
        const icon = (item.icon || "").toLowerCase();
        const url = (item.url || "").toLowerCase();
        // Do NOT show Email as a social media option
        if (id === "p_em" || plat === "email" || (icon === "mail" && url.startsWith("mailto:"))) return false;
        return true;
      })
      .forEach(item => {
        const link = document.createElement("a");
        link.href = window.KDS.normalizeUrl(item.url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "social-icon-link";
        link.setAttribute("data-platform", String(item.platform || item.icon || "").toLowerCase().trim());
        link.setAttribute("data-tooltip", item.platform);
        link.setAttribute("aria-label", item.platform);
        link.id = `social_${item.id || item.platform.toLowerCase().replace(/\s+/g, "_")}`;
        const iconKey = item.icon || window.KDS.detectSocialIcon(item.platform);
        link.innerHTML = window.KDS.getSvgIcon(iconKey, "w-5 h-5");
        socialsContainer.appendChild(link);
      });
  }

  // QR target is always the live deployed personal card URL.
  // Do not use an admin-saved publicUrl here: a stale/mistyped setting can make
  // a valid QR code open an invalid destination.
  const targetUrl = new URL("./", window.location.href).href.split("#")[0];

  // Generate QR Code
  initQrCode("personalQrCanvas", "btnDownloadQr", "btnShareCard", p.name, targetUrl);
}

/**
 * Render Business Profile (business.html)
 */
function renderBusinessPage(data) {
  const b = data.business || {};

  // Use the same cover photo system as the personal profile.
  const coverUrl = data?.branding?.businessCoverUrl || data?.branding?.coverUrl || "";
  const cover = document.getElementById("businessProfileCover");
  if (cover) {
    cover.innerHTML = "";
    if (coverUrl) {
      const img = document.createElement("img");
      img.className = "profile-cover-image";
      img.alt = "";
      img.src = coverUrl;
      img.onerror = () => { cover.innerHTML = '<div class="profile-cover-placeholder"></div>'; };
      cover.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "profile-cover-placeholder";
      cover.appendChild(placeholder);
    }
  }

  // Business Info Elements
  const elLogo = document.getElementById("businessLogo");
  const elName = document.getElementById("businessName");
  const elTagline = document.getElementById("businessTagline");
  const elAbout = document.getElementById("businessAbout");

  if (elLogo) {
    elLogo.src = b.logoUrl || window.KDS.DEFAULT_SITE_DATA.business.logoUrl;
    elLogo.onerror = () => {
      elLogo.src = window.KDS.DEFAULT_SITE_DATA.business.logoUrl;
    };
  }
  if (elName) elName.textContent = b.name || "Khan Digital Solution";
  if (elTagline) elTagline.textContent = b.tagline || "Your Growth, Our Mission";
  if (elAbout) elAbout.textContent = b.about || "";

  // Contact Action Buttons
  const phoneClean = (b.phoneFormatted || b.phone || "01744188460").replace(/[^\d+]/g, "");
  const waClean = (b.whatsappFormatted || b.whatsapp || "01744188460").replace(/[^\d]/g, "");
  const emailAddr = b.email || "samim.khanmiyaa@gmail.com";

  const btnCall = document.getElementById("btnBusinessCall");
  const btnWhatsApp = document.getElementById("btnBusinessWhatsApp");
  const btnEmail = document.getElementById("btnBusinessEmail");

  if (btnCall) btnCall.href = `tel:${phoneClean.startsWith("+") ? phoneClean : "+88" + phoneClean.replace(/^0/, "")}`;
  if (btnWhatsApp) btnWhatsApp.href = `https://wa.me/${waClean.startsWith("88") ? waClean : "88" + waClean.replace(/^0/, "")}`;
  if (btnEmail) btnEmail.href = `mailto:${emailAddr}`;

  // Render Business Social Links (Independent from personal)
  const socialsContainer = document.getElementById("businessSocialsList");
  if (socialsContainer && Array.isArray(data.businessSocials)) {
    socialsContainer.innerHTML = "";
    data.businessSocials
      .filter(item => {
        if (item.active === false || !item.url || !item.url.trim()) return false;
        const id = (item.id || "").toLowerCase();
        const plat = (item.platform || "").toLowerCase();
        const icon = (item.icon || "").toLowerCase();
        const url = (item.url || "").toLowerCase();
        // Do NOT show Email as a social media option
        if (id === "b_em" || plat === "email" || (icon === "mail" && url.startsWith("mailto:"))) return false;
        return true;
      })
      .forEach(item => {
        const link = document.createElement("a");
        link.href = window.KDS.normalizeUrl(item.url);
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "social-icon-link";
        link.setAttribute("data-platform", String(item.platform || item.icon || "").toLowerCase().trim());
        link.setAttribute("data-tooltip", item.platform);
        link.setAttribute("aria-label", item.platform);
        link.id = `biz_social_${item.id || item.platform.toLowerCase().replace(/\s+/g, "_")}`;
        const iconKey = item.icon || window.KDS.detectSocialIcon(item.platform);
        link.innerHTML = window.KDS.getSvgIcon(iconKey, "w-5 h-5");
        socialsContainer.appendChild(link);
      });
  }

  // Render Services
  const servicesContainer = document.getElementById("businessServicesList");
  if (servicesContainer && Array.isArray(data.services)) {
    servicesContainer.innerHTML = "";
    data.services
      .filter(srv => srv.active !== false)
      .forEach(srv => {
        const card = document.createElement("div");
        card.className = "service-card";
        card.id = `service_card_${srv.id}`;
        card.innerHTML = `
          <div class="service-icon-box">
            ${window.KDS.getSvgIcon(srv.icon || "trending-up", "w-5 h-5")}
          </div>
          <h3 class="service-title">${escapeHtml(srv.title)}</h3>
          <p class="service-desc">${escapeHtml(srv.description)}</p>
        `;
        servicesContainer.appendChild(card);
      });
  }

  // QR target is always this deployed business profile page.
  // This avoids stale/mistyped admin publicUrl values causing scan errors.
  const targetUrl = new URL("./business.html", window.location.href).href.split("#")[0];

  // Generate QR Code
  initQrCode("businessQrCanvas", "btnDownloadBizQr", "btnShareBizCard", b.name, targetUrl);
}

/**
 * Initialize QR Code generation and download
 */
function initQrCode(canvasId, downloadBtnId, shareBtnId, shareTitle, explicitUrl) {
  const canvas = document.getElementById(canvasId);
  const downloadBtn = document.getElementById(downloadBtnId);
  const shareBtn = document.getElementById(shareBtnId);
  if (!canvas) return;

  let currentUrl = window.location.href.split("#")[0];
  try {
    const candidate = String(explicitUrl || "").trim();
    if (candidate) {
      const parsed = new URL(candidate, window.location.href);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        parsed.hash = "";
        currentUrl = parsed.href;
      }
    }
  } catch (err) {
    console.warn("[KDS] Invalid QR target URL; using current page.", err);
  }

  // Use a plain QR image endpoint for maximum browser compatibility.
  // This avoids canvas/library timing issues on the Business Profile page.
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=" + encodeURIComponent(currentUrl);
  const img = document.createElement("img");
  img.className = "qr-generated-image";
  img.width = 220;
  img.height = 220;
  img.alt = "QR Code";
  img.loading = "eager";
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.src = qrUrl;
  img.dataset.qrUrl = currentUrl;

  const frame = canvas.parentElement;
  if (frame) {
    canvas.style.display = "none";
    frame.querySelectorAll(".qr-generated-image").forEach(el => el.remove());
    frame.appendChild(img);
  }

  if (downloadBtn) {
    downloadBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(qrUrl, { mode: "cors", cache: "no-store" });
        if (!response.ok) throw new Error("QR image request failed");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `KDS_${(shareTitle || "Digital_Card").replace(/[^\\w\\s-]/g, "").replace(/\\s+/g, "_")}_QR.png`;
        link.href = objectUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch (err) {
        // If CORS blocks the download, open the QR image directly.
        window.open(qrUrl, "_blank", "noopener,noreferrer");
      }
    };
  }

  if (shareBtn) {
    shareBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        if (navigator.share) {
          await navigator.share({ title: shareTitle || "Khan Digital Solution", url: currentUrl });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(currentUrl);
          showToast("Profile link copied.");
        } else {
          window.prompt("Copy this profile link:", currentUrl);
        }
      } catch (err) {
        if (err?.name !== "AbortError") console.error("[KDS] QR share failed:", err);
      }
    };
  }
}
