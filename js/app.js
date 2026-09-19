/**
 * Khan Digital Solution – Digital Visiting Card & Business Profile
 * Public Frontend Application Script (Vanilla JS)
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
  const coverUrl = data?.branding?.businessCoverUrl || data?.branding?.coverUrl || "";
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
  const coverUrl = data?.branding?.coverUrl || "";
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
  let qrElement = document.getElementById(canvasId);
  const downloadBtn = document.getElementById(downloadBtnId);
  const shareBtn = document.getElementById(shareBtnId);
  if (!qrElement) return;

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

  let rendered = false;
  let rendering = false;

  const markReady = (el) => {
    if (!el) return;
    el.dataset.qrUrl = currentUrl;
    el.dataset.qrReady = "1";
    rendered = true;
    rendering = false;
    qrElement = el;
  };

  const drawFallback = () => {
    const frame = qrElement?.parentElement || document.getElementById(canvasId)?.parentElement;
    if (!frame) {
      rendering = false;
      return false;
    }

    let img = frame.querySelector('img[data-kds-qr="1"]');
    if (!img) {
      img = document.createElement("img");
      img.width = 220;
      img.height = 220;
      img.alt = "QR Code";
      img.loading = "eager";
      img.decoding = "async";
      img.dataset.kdsQr = "1";
      const oldCanvas = frame.querySelector("#" + canvasId);
      if (oldCanvas) oldCanvas.replaceWith(img);
      else frame.appendChild(img);
    }

    img.src = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&format=png&data=" +
      encodeURIComponent(currentUrl);

    img.onload = () => markReady(img);
    img.onerror = () => {
      rendering = false;
      console.warn("[KDS] QR fallback image failed; retrying.");
      setTimeout(() => renderQr(), 1200);
    };
    return true;
  };

  const renderQr = () => {
    if (rendered || rendering) return rendered;
    rendering = true;

    const canvas = document.getElementById(canvasId);
    if (canvas && typeof QRCode !== "undefined" && typeof QRCode.toCanvas === "function") {
      try {
        canvas.width = 220;
        canvas.height = 220;
        QRCode.toCanvas(canvas, currentUrl, {
          width: 220,
          margin: 4,
          errorCorrectionLevel: "H",
          color: { dark: "#0f172a", light: "#ffffff" }
        }, (error) => {
          if (error) {
            console.error("[KDS] QR generation failed:", error);
            drawFallback();
          } else {
            markReady(canvas);
          }
        });
        return true;
      } catch (err) {
        console.error("[KDS] QR generation failed:", err);
      }
    }

    return drawFallback();
  };

  // Wait for the QR library if it is still loading, then render once.
  let attempts = 0;
  const waitForQrLibrary = setInterval(() => {
    attempts += 1;
    if (renderQr() || attempts >= 30) {
      clearInterval(waitForQrLibrary);
      if (!rendered && attempts >= 30) drawFallback();
    }
  }, 150);

  renderQr();

  if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        if (!rendered) renderQr();

        const el = qrElement;
        if (el && el.tagName === "CANVAS") {
          const dataUrl = el.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `KDS_${(shareTitle || "Digital_Card").replace(/[^\\w\\s-]/g, "").replace(/\\s+/g, "_")}_QR.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else if (el && el.tagName === "IMG" && el.src) {
          const link = document.createElement("a");
          link.download = `KDS_${(shareTitle || "Digital_Card").replace(/[^\\w\\s-]/g, "").replace(/\\s+/g, "_")}_QR.png`;
          link.href = el.src;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } catch (err) {
        console.error("[KDS] Failed to download QR Code:", err);
        showToast("QR Code is not ready yet. Please try again.");
      }
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle || "Khan Digital Solution",
            text: "Connect with Khan Digital Solution – Digital Visiting Card",
            url: currentUrl
          });
        } catch (err) {}
      } else {
        try {
          await navigator.clipboard.writeText(currentUrl);
          showToast("Link copied to clipboard!");
        } catch (clipErr) {
          prompt("Copy this link:", currentUrl);
        }
      }
    });
  }
}**
 * Khan Digital Solution – Digital Visiting Card & Business Profile
 * Public Frontend Application Script (Vanilla JS)
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
  const coverUrl = data?.branding?.coverUrl || "";
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

  // Always build a valid absolute URL. If saved publicUrl is invalid or stale,
  // fall back to the current page so the QR can never encode a broken target.
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

  const renderQr = () => {
    const drawFallback = () => {
      const frame = canvas.parentElement;
      if (!frame) return false;
      const img = document.createElement("img");
      img.width = 220;
      img.height = 220;
      img.alt = "QR Code";
      img.loading = "eager";
      img.decoding = "sync";
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(currentUrl)}`;
      img.dataset.qrUrl = currentUrl;
      canvas.replaceWith(img);
      return true;
    };

    if (typeof QRCode === "undefined" || typeof QRCode.toCanvas !== "function") {
      console.warn("[KDS] QR library unavailable; using verified QR fallback.");
      return drawFallback();
    }

    try {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      QRCode.toCanvas(canvas, currentUrl, {
        width: 220,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#0f172a", light: "#ffffff" }
      }, (error) => {
        if (error) {
          console.error("[KDS] QR generation failed:", error);
          drawFallback();
          return;
        }
        canvas.dataset.qrUrl = currentUrl;
      });
      return true;
    } catch (err) {
      console.error("[KDS] QR generation failed:", err);
      return drawFallback();
    }
  };

  // qrcode.js is loaded before app.js on the public pages, so this should
  // normally render immediately. A short retry handles slow script execution.
  if (!renderQr()) {
    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      if (renderQr() || attempts >= 20) clearInterval(retry);
    }, 150);
  }

  if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        if (!canvas.dataset.qrUrl) {
          renderQr();
        }
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `KDS_${(shareTitle || "Digital_Card")
          .replace(/[^\\w\\s-]/g, "")
          .replace(/\\s+/g, "_")}_QR.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        console.error("[KDS] Failed to download QR Code:", err);
        showToast("QR Code is not ready yet. Please try again.");
      }
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle || "Khan Digital Solution",
            text: "Connect with Khan Digital Solution – Digital Visiting Card",
            url: currentUrl
          });
        } catch (err) {
          // User cancelled the native share sheet.
        }
      } else {
        try {
          await navigator.clipboard.writeText(currentUrl);
          showToast("Link copied to clipboard!");
        } catch (clipErr) {
          prompt("Copy this link:", currentUrl);
        }
      }
    });
  }
}

