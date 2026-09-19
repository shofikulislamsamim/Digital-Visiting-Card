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

  // Save Contact / vCard handler
  const handleVCardDownload = (e) => {
    if (e) e.preventDefault();
    window.KDS.downloadVCard(p);
  };

  if (btnVCard) btnVCard.addEventListener("click", handleVCardDownload);
  if (btnSaveContactMain) btnSaveContactMain.addEventListener("click", handleVCardDownload);

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
        link.setAttribute("data-tooltip", item.platform);
        link.setAttribute("aria-label", item.platform);
        link.id = `social_${item.id || item.platform.toLowerCase().replace(/\s+/g, "_")}`;
        const iconKey = item.icon || window.KDS.detectSocialIcon(item.platform);
        link.innerHTML = window.KDS.getSvgIcon(iconKey, "w-5 h-5");
        socialsContainer.appendChild(link);
      });
  }

  // Determine QR Code URL
  let targetUrl = window.location.href.split("#")[0];
  if (data.settings && data.settings.publicUrl && data.settings.publicUrl.trim().startsWith("http")) {
    const base = data.settings.publicUrl.trim().replace(/\/+$/, "");
    targetUrl = `${base}/`;
  }

  // Generate QR Code
  initQrCode("personalQrCanvas", "btnDownloadQr", "btnShareCard", p.name, targetUrl);
}

/**
 * Render Business Profile (business.html)
 */
function renderBusinessPage(data) {
  const b = data.business || {};

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

  // Determine QR Code URL for Business
  let targetUrl = window.location.href.split("#")[0];
  if (data.settings && data.settings.publicUrl && data.settings.publicUrl.trim().startsWith("http")) {
    const base = data.settings.publicUrl.trim().replace(/\/+$/, "");
    targetUrl = `${base}/business.html`;
  }

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

  // Determine active public URL
  const currentUrl = explicitUrl || window.location.href.split("#")[0];

  // Check if QRCode library is available
  if (typeof QRCode !== "undefined") {
    // Generate high-resolution QR
    QRCode.toCanvas(canvas, currentUrl, {
      width: 180,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    }, (error) => {
      if (error) console.error("[KDS] Error rendering QR Code:", error);
    });
  } else {
    // Fallback QR code via API if library hasn't loaded yet
    console.warn("[KDS] QRCode library not loaded, using fallback");
    const parent = canvas.parentElement;
    if (parent) {
      const img = document.createElement("img");
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}&margin=1`;
      img.alt = "QR Code";
      img.width = 180;
      img.height = 180;
      canvas.replaceWith(img);
    }
  }

  // Download QR Code button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        let dataUrl = "";
        const activeCanvas = document.getElementById(canvasId);
        if (activeCanvas && activeCanvas.toDataURL) {
          dataUrl = activeCanvas.toDataURL("image/png");
        } else {
          dataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(currentUrl)}`;
        }
        const link = document.createElement("a");
        link.download = `KDS_${(shareTitle || "Digital_Card").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_")}_QR.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("[KDS] Failed to download QR Code:", err);
      }
    });
  }

  // Web Share API
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
          // User cancelled or aborted share
        }
      } else {
        // Fallback: copy to clipboard
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

function showToast(message) {
  let toast = document.getElementById("publicToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "publicToast";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#0284c7";
    toast.style.color = "#ffffff";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "0.9rem";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
    toast.style.zIndex = "9999";
    toast.style.transition = "opacity 0.3s ease";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2500);
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
