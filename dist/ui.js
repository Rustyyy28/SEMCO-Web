export const escapeHTML = (v='') => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = (n=0) => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2,minimumFractionDigits:0}).format(Number(n)||0);
const paths={
grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
document:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
wallet:'<path d="M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M20 11h-5v6h5"/><path d="M17 14h.01"/>',
chart:'<path d="M3 3v18h18M7 14l4-4 4 3 6-8"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8"/><circle cx="9" cy="7" r="4"/>',
help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
settings:'<path d="m12 2 2 3 3-.3.6 3.3 2.8 2-1.4 3 1.4 3-2.8 2-.6 3.3-3-.3-2 3-2-3-3 .3-.6-3.3-2.8-2 1.4-3-1.4-3 2.8-2L7 4.7l3 .3Z"/><circle cx="12" cy="13" r="3"/>',
shield:'<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z"/><path d="m8 12 3 3 5-6"/>',
check:'<path d="m5 12 4 4L19 6"/>',
'check-circle':'<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>',
clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
'arrow-right':'<path d="M4 12h16m-6-6 6 6-6 6"/>',
'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
search:'<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
filter:'<path d="M4 4h16l-6 8v7l-4 2v-9Z"/>',
'chevron-right':'<path d="m9 5 7 7-7 7"/>',
'chevron-down':'<path d="m6 9 6 6 6-6"/>',
calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
x:'<path d="m6 6 12 12M6 18 18 6"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12s9 6 18 0M12 12v4"/>',
receipt:'<path d="M4 3v18l4-2 4 2 4-2 4 2V3l-4 2-4-2-4 2Z"/><path d="M8 9h8M8 13h8M8 17h4"/>',
history:'<path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2"/>',
activity:'<path d="M2 12h4l3-9 6 18 3-9h4"/>',
bank:'<path d="m3 8 9-6 9 6M3 8h18M5 10v8M10 10v8M15 10v8M20 10v8M2 21h20"/>',
percent:'<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m21 3-18 18"/>',
mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10M10 22h4"/>',
logout:'<path d="M9 21H3V3h6M9 12h12m-5-5 5 5-5 5"/>',
menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
leaf:'<path d="M20 3s-13-3-16 7 9 16 14 7c3-5 2-14 2-14ZM6 18 15 9"/>',
sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4M18 4h4"/>'
};
export function icon(name,cls=''){return `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.document}</svg>`;}
export function badge(status){let color=/Approved|Verified|Active|Posted|Recommended|Completed/.test(status)?'green':/Rejected|Not recommended|Suspended/.test(status)?'red':/Pending|review|revision/.test(status)?'amber':'blue';return `<span class="pill ${color}"><span class="pill-dot"></span>${escapeHTML(status)}</span>`;}
export function pageHeading(eyebrow,title,description,actions=''){return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;}
export function statCard(label,value,name,detail=''){return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon">${icon(name)}</span></div><div class="stat-value">${value}</div><div class="stat-detail">${detail}</div></div>`;}
