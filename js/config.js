/**
 * Khan Digital Solution – Digital Visiting Card & Business Profile
 * Configuration & Core Data Helper
 */

// 1. SUPABASE PROJECT CREDENTIALS
// Configured for Khan Digital Solution
const DEFAULT_SUPABASE_URL = "https://sypwzqawdxgxzmwimjbp.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_bnI3nXmXgqf9CQIfMdVR4w_rftT8yPj";

// Dynamic credentials getter to ensure immediate updates without stale references
function getActiveSupabaseUrl() {
  return DEFAULT_SUPABASE_URL;
}

function getActiveSupabaseAnonKey() {
  return DEFAULT_SUPABASE_ANON_KEY;
}

// Check if Supabase has been configured with valid URL and publishable/anon key
function isSupabaseConfigured() {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseAnonKey();
  return url.length > 10 && key.length > 20 && !url.includes("YOUR-PROJECT") && url.startsWith("https://");
}

// 2. DEFAULT FALLBACK DATA (Khan Digital Solution)
const DEFAULT_SITE_DATA = {
  personal: {
    name: "Shofikul Islam Samim",
    designation: "Owner & CEO",
    company: "Khan Digital Solution",
    phone: "01744-188460",
    phoneFormatted: "+8801744188460",
    whatsapp: "01744-188460",
    whatsappFormatted: "8801744188460",
    email: "samim.khanmiyaa@gmail.com",
    bio: "Passionate entrepreneur, creative technologist, and digital strategist dedicated to scaling modern brands through data-driven marketing, premier design, and cutting-edge web solutions.",
    photoUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='96' fill='%230f172a'/%3E%3Ccircle cx='256' cy='190' r='86' fill='%230284c7'/%3E%3Cpath d='M108 438c20-92 77-138 148-138s128 46 148 138' fill='%230284c7'/%3E%3C/svg%3E",
    website: "https://shofikulislamsamim.github.io/Digital-Visiting-Card/"
  },
  personalSocials: [
    { id: "p_fb", platform: "Facebook", icon: "facebook", url: "https://facebook.com/kds.samim", active: true },
    { id: "p_ig", platform: "Instagram", icon: "instagram", url: "https://instagram.com/kds.samim", active: true },
    { id: "p_li", platform: "LinkedIn", icon: "linkedin", url: "https://linkedin.com/in/shofikul-islam-samim", active: true },
    { id: "p_yt", platform: "YouTube", icon: "youtube", url: "https://youtube.com/@KhanDigitalSolution", active: true },
    { id: "p_tt", platform: "TikTok", icon: "tiktok", url: "https://tiktok.com/@kds_samim", active: true }
  ],
  business: {
    name: "Khan Digital Solution",
    tagline: "Your Growth, Our Mission",
    about: "Khan Digital Solution (KDS) is a premier full-service digital agency empowering businesses, startups, and personal brands worldwide. We engineer growth through high-performance digital marketing, world-class graphic branding, cinematic video production, responsive web development, and dependable IT solutions.",
    phone: "01744-188460",
    phoneFormatted: "+8801744188460",
    whatsapp: "01744-188460",
    whatsappFormatted: "8801744188460",
    email: "samim.khanmiyaa@gmail.com",
    logoUrl: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='96' fill='%230f172a'/%3E%3Ctext x='256' y='290' text-anchor='middle' font-family='Arial,sans-serif' font-size='170' font-weight='700' fill='%230284c7'%3EKDS%3C/text%3E%3C/svg%3E",
    website: "https://shofikulislamsamim.github.io/Digital-Visiting-Card/business.html"
  },
  businessSocials: [
    { id: "b_fb", platform: "Facebook", icon: "facebook", url: "https://facebook.com/KhanDigitalSolution", active: true },
    { id: "b_ig", platform: "Instagram", icon: "instagram", url: "https://instagram.com/KhanDigitalSolution", active: true },
    { id: "b_li", platform: "LinkedIn", icon: "linkedin", url: "https://linkedin.com/company/khan-digital-solution", active: true },
    { id: "b_yt", platform: "YouTube", icon: "youtube", url: "https://youtube.com/@KhanDigitalSolution", active: true },
    { id: "b_tt", platform: "TikTok", icon: "tiktok", url: "https://tiktok.com/@KhanDigitalSolution", active: true }
  ],
  services: [
    {
      id: "srv_1",
      title: "Digital Marketing",
      description: "Data-driven SEO, Google & Meta advertising campaigns, audience targeting, content strategy, and conversion-focused growth funnels.",
      icon: "trending-up",
      active: true
    },
    {
      id: "srv_2",
      title: "Graphic Design",
      description: "Signature brand identities, bespoke logos, high-impact marketing collateral, UI visual kits, and print-ready creative assets.",
      icon: "palette",
      active: true
    },
    {
      id: "srv_3",
      title: "Video Editing",
      description: "Cinematic commercial edits, reels, YouTube production, color grading, sound design, and dynamic motion graphics that hook audiences.",
      icon: "video",
      active: true
    },
    {
      id: "srv_4",
      title: "Web Design & Development",
      description: "Modern, responsive, ultra-fast websites, landing pages, e-commerce stores, and custom web applications engineered for performance.",
      icon: "code",
      active: true
    },
    {
      id: "srv_5",
      title: "IT Solutions",
      description: "Custom business automation, cloud infrastructure, domain & hosting architecture, system maintenance, and strategic tech consulting.",
      icon: "cpu",
      active: true
    }
  ],
  settings: {
    publicUrl: "https://shofikulislamsamim.github.io/Digital-Visiting-Card/",
    themeColor: "#0f172a",
    accentColor: "#0284c7"
  }
};

// 3. SUPABASE CLIENT SINGLETON
let _supabaseClient = null;
let _cachedUrl = null;
let _cachedKey = null;

function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    _supabaseClient = null;
    return null;
  }

  const currentUrl = getActiveSupabaseUrl();
  const currentKey = getActiveSupabaseAnonKey();

  // If credentials changed or not yet initialized, instantiate a new client
  if (!_supabaseClient || _cachedUrl !== currentUrl || _cachedKey !== currentKey) {
    if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
      try {
        _supabaseClient = window.supabase.createClient(currentUrl, currentKey);
        _cachedUrl = currentUrl;
        _cachedKey = currentKey;
      } catch (e) {
        console.error("[KDS] Error initializing Supabase client:", e);
        return null;
      }
    } else {
      return null;
    }
  }
  return _supabaseClient;
}

// 4. DATA PERSISTENCE LAYER WITH DEEP MERGING
function deepMergeSiteData(loaded) {
  if (!loaded || typeof loaded !== "object") {
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
  }

  const sanitizeSocials = (list, defaultList) => {
    const src = Array.isArray(list) && list.length > 0 ? list : defaultList;
    return src.filter(item => {
      if (!item) return false;
      const id = (item.id || "").toLowerCase();
      const plat = (item.platform || "").toLowerCase();
      const icon = (item.icon || "").toLowerCase();
      const url = (item.url || "").toLowerCase();
      // Completely exclude any email as social media option
      if (id === "p_em" || id === "b_em" || plat === "email" || (icon === "mail" && url.startsWith("mailto:"))) {
        return false;
      }
      return true;
    });
  };

  const merged = {
    personal: Object.assign({}, DEFAULT_SITE_DATA.personal, loaded.personal || {}),
    business: Object.assign({}, DEFAULT_SITE_DATA.business, loaded.business || {}),
    settings: Object.assign({}, DEFAULT_SITE_DATA.settings, loaded.settings || {}),
    branding: Object.assign({
      logoUrl: "",
      cardLogoUrl: "",
      faviconUrl: "",
      adminLogoUrl: "",
      coverUrl: ""
    }, loaded.branding || (loaded.settings && loaded.settings.branding) || {}),
    personalSocials: sanitizeSocials(loaded.personalSocials, DEFAULT_SITE_DATA.personalSocials),
    businessSocials: sanitizeSocials(loaded.businessSocials, DEFAULT_SITE_DATA.businessSocials),
    services: Array.isArray(loaded.services) && loaded.services.length > 0 
      ? loaded.services 
      : JSON.parse(JSON.stringify(DEFAULT_SITE_DATA.services))
  };

  return merged;
}

async function getSiteData() {
  const client = getSupabaseClient();
  if (!client) {
    console.error("[KDS] Supabase is not configured. Public data cannot be synced.");
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
  }

  try {
    const { data, error } = await client
      .from("site_data")
      .select("data, updated_at")
      .eq("id", "kds_main")
      .maybeSingle();

    if (error) {
      console.error("[KDS] Supabase fetch error:", error.message);
      return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
    }

    if (data && data.data) {
      return deepMergeSiteData(data.data);
    }

    console.warn("[KDS] No cloud site_data record found; using defaults.");
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
  } catch (err) {
    console.error("[KDS] Network error fetching from Supabase:", err);
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
  }
}

// 5. URL NORMALIZATION HELPER
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (
    trimmed.startsWith("http://") || 
    trimmed.startsWith("https://") || 
    trimmed.startsWith("mailto:") || 
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

// 6. VCARD GENERATOR (RFC 2426 Compliant)
function downloadVCard(personalData, socialData) {
  const p = personalData || DEFAULT_SITE_DATA.personal;
  const socials = Array.isArray(socialData) && socialData.length
    ? socialData
    : (DEFAULT_SITE_DATA.personalSocials || []);
  const fullName = (p.name || "Shofikul Islam Samim").trim();
  const org = p.company || "Khan Digital Solution";
  const title = p.designation || "Owner & CEO";
  const phone = p.phoneFormatted || p.phone || "+8801744188460";
  const wa = p.whatsappFormatted ? `+${p.whatsappFormatted}` : phone;
  const email = p.email || "samim.khanmiyaa@gmail.com";
  const url = normalizeUrl(p.website) || window.location.href;

  const nameParts = fullName.split(/\s+/);
  const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const givenName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : fullName;

  const esc = (value) => String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

  // Keep social profiles inside the vCard, but do not create clickable social buttons/actions.
  const activeSocials = socials
    .filter(item => item && item.active !== false && item.url)
    .map(item => ({ platform: item.platform || "Social", url: normalizeUrl(item.url) }))
    .filter(item => item.url);

  const socialNote = activeSocials.map(item => `${item.platform}: ${item.url}`).join("\n");
  const noteParts = [
    (p.bio || "Khan Digital Solution – Digital Visiting Card").replace(/\r?\n/g, " "),
    socialNote ? `Social Profiles:\n${socialNote}` : ""
  ].filter(Boolean);

  const vCardLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(fullName)}`,
    `N:${esc(familyName)};${esc(givenName)};;;`,
    `ORG:${esc(org)}`,
    `TITLE:${esc(title)}`,
    `TEL;TYPE=CELL,VOICE:${esc(phone)}`,
    `TEL;TYPE=WORK,VOICE:${esc(wa)}`,
    `EMAIL;TYPE=INTERNET,PREF:${esc(email)}`,
    `URL:${esc(url)}`,
    `NOTE:${esc(noteParts.join("\n\n"))}`,
    "REV:" + new Date().toISOString(),
    "END:VCARD"
  ];

  const vCardContent = vCardLines.join("\r\n");
  const blob = new Blob([vCardContent], { type: "text/vcard;charset=utf-8;" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", `${fullName.replace(/[^\\w\\s-]/g, "").replace(/\\s+/g, "_")}_KDS.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}

// 7. SVG ICONS DICTIONARY
// Crisp inline SVG icons for instant rendering without font dependency
const SVG_ICONS = {
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`,
  "user-plus": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.019 4.388 11.022 10.125 11.927v-8.431H7.078v-3.496h3.047V9.414c0-3.021 1.791-4.691 4.533-4.691 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.93-1.956 1.885v2.276h3.328l-.532 3.496h-2.796V24C19.612 23.095 24 18.092 24 12.073Z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17.25" cy="6.75" r="1.25" fill="currentColor"/></svg>`,
  instagramoriginal: `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="instagramOriginalGradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFDD55"/><stop offset=".28" stop-color="#FF543E"/><stop offset=".55" stop-color="#C837AB"/><stop offset="1" stop-color="#405DE6"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="5" fill="url(#instagramOriginalGradient)"/><circle cx="12" cy="12" r="4.25" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.25" cy="6.75" r="1.25" fill="#fff"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.556v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.347V8.997h3.414v1.563h.047c.476-.9 1.637-1.848 3.37-1.848 3.606 0 4.27 2.373 4.27 5.467v6.273ZM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123ZM3.555 8.997h3.564v11.455H3.555V8.997Z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.009 3.009 0 0 0-2.117-2.127C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.381.514A3.009 3.009 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.009 3.009 0 0 0 2.117 2.127c1.876.514 9.381.514 9.381.514s7.505 0 9.381-.514a3.009 3.009 0 0 0 2.117-2.127C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.589 7.186a4.602 4.602 0 0 1-2.672-.844A4.63 4.63 0 0 1 15.063 3h-3.286v12.125a2.706 2.706 0 1 1-1.858-2.579V9.212a6.05 6.05 0 1 0 5.144 5.913V9.587a7.879 7.879 0 0 0 4.526 1.421V7.186Z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16m0-16L4 20"></path></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
  telegram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
  "trending-up": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>`,
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
  down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`
};

function getSvgIcon(iconName, customClass = "w-5 h-5") {
  const normalized = (iconName || "globe").toLowerCase().trim();
  const rawSvg = SVG_ICONS[normalized] || SVG_ICONS.globe;
  return rawSvg.replace("<svg ", `<svg class="${customClass}" `);
}

function detectSocialIcon(name) {
  if (!name) return "globe";
  const lower = name.toLowerCase().trim();
  if (lower.includes("face") || lower.includes("fb")) return "facebook";
  if (lower.includes("insta") || lower.includes("ig")) return "instagram";
  if (lower.includes("link") || lower.includes("li")) return "linkedin";
  if (lower.includes("you") || lower.includes("yt")) return "youtube";
  if (lower.includes("tik") || lower.includes("tt")) return "tiktok";
  if (lower.includes("twit") || lower === "x") return "x";
  if (lower.includes("git")) return "github";
  if (lower.includes("tele") || lower.includes("tg")) return "telegram";
  if (lower.includes("what") || lower.includes("wa")) return "whatsapp";
  if (lower.includes("mail") || lower.includes("email")) return "mail";
  return "globe";
}

// Export to window for vanilla JS access across pages
window.KDS = {
  isSupabaseConfigured,
  getActiveSupabaseUrl,
  getActiveSupabaseAnonKey,
  getSupabaseClient,
  getSiteData,
  downloadVCard,
  normalizeUrl,
  getSvgIcon,
  detectSocialIcon,
  SVG_ICONS,
  DEFAULT_SITE_DATA,
  DEFAULT_SUPABASE_URL
};
