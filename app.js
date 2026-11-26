const WHATSAPP_NUMBER = "917990683272";
const CART_KEY = "globalSnackCart";
// Add your deployed Google Apps Script Web App URL here after setup.
const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxkJVuqA7VxnUPyHfvU6PKt5drix-hd1xO8Kh-LoYAM1CABE6HZYavsNCqj3t-PXjk4/exec";
let products = [];
let cart = {};
try {
  const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
  if (savedCart && typeof savedCart === "object" && !Array.isArray(savedCart)) cart = savedCart;
} catch (error) {
  console.warn("Saved enquiry list was unreadable; starting with an empty list.", error);
}
let activeDrawer = null;
let toastTimer;
const $ = id => document.getElementById(id);
const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const unique = values => [...new Set(values.map(v => String(v || "").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const cartQuantity = () => Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
const productById = id => products.find(product => String(product.id) === String(id));

function showToast(message) {
  const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function persistCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartCount(); renderCart(); }
function updateCartCount() {
  const count = cartQuantity(); $("cartCount").textContent = count; $("drawerCount").textContent = `(${count} pcs)`;
  $("cartOpen").classList.toggle("has-items", count > 0);
}
function openDrawer(which) {
  closeDrawer(false); activeDrawer = which;
  $("drawerOverlay").classList.remove("hidden");
  const drawer = which === "cart" ? $("cartDrawer") : $("menuDrawer");
  drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("drawer-open");
  if (which === "menu") $("menuOpen").setAttribute("aria-expanded", "true");
}
function closeDrawer(reset = true) {
  ["cartDrawer", "menuDrawer"].forEach(id => { $(id).classList.remove("open"); $(id).setAttribute("aria-hidden", "true"); });
  $("drawerOverlay").classList.add("hidden"); document.body.classList.remove("drawer-open");
  $("menuOpen").setAttribute("aria-expanded", "false"); if (reset) activeDrawer = null;
}
function add(id, amount) {
  const qty = Math.max(1, Math.min(999, Number(amount) || 1));
  cart[id] = Math.min(9999, (Number(cart[id]) || 0) + qty); persistCart();
  showToast(`${qty} ${qty === 1 ? "piece" : "pieces"} added to your enquiry`);
}
function setCartQty(id, qty) {
  qty = Math.max(0, Math.min(9999, Number(qty) || 0));
  if (qty === 0) delete cart[id]; else cart[id] = qty;
  persistCart();
}
function canonicalBrand(value) {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();
  if (!raw) return "Global Snack";
  if (lower.startsWith("cadbury") || lower.includes("cadbury")) return "Cadbury";
  if (lower === "malteser" || lower === "maltesers") return "Maltesers";
  if (lower === "fox burten company") return "Fox's";
  if (lower === "m&m's" || lower === "m & m's") return "M&M's";
  if (lower === "hershey's") return "Hershey's";
  if (lower === "ray no sugar") return "Ray No Sugar";
  return raw.replace(/\s+/g, " ");
}
function getBrandGroups() {
  const groups = new Map();
  products.forEach(product => {
    const name = canonicalBrand(product.brand);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(product);
  });
  return [...groups.entries()].map(([name, items]) => ({name, items, image: items.find(p => p.image)?.image || "", count: items.length}))
    .sort((a,b) => a.name.localeCompare(b.name));
}
const CATEGORY_SHOWCASE = [
  {title:"Chocolates", subtitle:"Bars, pralines & indulgent bites", terms:["chocolate","chocolates","truffle","praline","cocoa"]},
  {title:"Drinks", subtitle:"Sodas, energy drinks & more", terms:["drink","drinks","beverage","soda","cola","juice","water","prime","fanta","coke"]},
  {title:"Biscuits & Cookies", subtitle:"Cookies, wafers & biscuits", terms:["biscuit","biscuits","cookie","cookies","wafer","cracker"]},
  {title:"Candies & Gummies", subtitle:"Chewy, sour & fruity favourites", terms:["candy","candies","gummy","gummies","sweet","sweets","fruitella","haribo","warheads"]},
  {title:"Sauces & Condiments", subtitle:"Bring something extra to the table", terms:["sauce","sauces","condiment","dip","dressing","syrup"]},
  {title:"Breakfast & Pantry", subtitle:"Spreads, cereals, jams, cheese & noodles", terms:["jam","cereal","spread","nutella","cheese","noodle","noodles","peanut butter","honey"]}
];
function categoryMatches(product, config) {
  const text = [product.category, product.name, product.brand, product.description].join(" ").toLowerCase();
  return config.terms.some(term => text.includes(term));
}
function renderCategoryBanners() {
  const host = $("categoryBanners");
  host.innerHTML = CATEGORY_SHOWCASE.map((config, index) => {
    const matches = products.filter(p => categoryMatches(p, config));
    const photos = matches.filter(p => p.image).slice(0,4);
    const collage = photos.length ? photos.map((p,i)=>`<span class="category-photo category-photo-${i+1}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.classList.add('photo-missing');this.remove()"></span>`).join("") : `<span class="category-photo-empty"><span>GLOBAL SNACK</span><small>${esc(config.title.toUpperCase())}</small></span>`;
    return `<button class="category-banner category-banner-${index+1}" type="button" data-category-showcase="${index}" aria-label="Explore ${esc(config.title)}"><span class="category-banner-copy"><span class="category-index">0${index+1} / CATEGORY</span><strong>${esc(config.title)}</strong><small>${esc(config.subtitle)}</small><span class="category-banner-cta">EXPLORE COLLECTION <b>↗</b></span></span><span class="category-banner-collage">${collage}</span><span class="category-banner-count">${matches.length} ${matches.length===1?'PRODUCT':'PRODUCTS'}</span></button>`;
  }).join("");
  $("categoryDots").innerHTML = CATEGORY_SHOWCASE.map((_,i)=>`<button class="category-dot ${i===0?'active':''}" data-category-dot="${i}" aria-label="Go to category ${i+1}"></button>`).join("");
}
function applyShowcaseCategory(index) {
  const config=CATEGORY_SHOWCASE[index]; if(!config) return;
  const exact=unique(products.map(p=>p.category)).find(c=>c.toLowerCase()===config.title.toLowerCase());
  $("categoryFilter").value=exact||""; $("brandFilter").value="";
  $("searchInput").value=exact?"":config.terms[0];
  render(); $("catalogue").scrollIntoView({behavior:"smooth"});
}

function categoriesAndBrands() {
  const categories = unique(products.map(p => p.category));
  const brandGroups = getBrandGroups();
  const brands = brandGroups.map(group => group.name);
  $("categoryFilter").innerHTML = '<option value="">All categories</option>' + categories.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  $("brandFilter").innerHTML = '<option value="">All brands</option>' + brands.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  $("categoryPills").innerHTML = ['All', ...categories].map((v,i) => `<button class="category-pill ${i===0?'active':''}" data-category="${i===0?'':esc(v)}">${esc(v)}</button>`).join("");
  $("brandStrip").innerHTML = brandGroups.map(group => {
    const logo = group.name === "Cadbury" ? "assets/cadbury-wordmark.svg" : group.image;
    return `<button class="brand-card" data-brand="${esc(group.name)}" aria-label="Browse ${esc(group.name)} products"><span class="brand-card-photo ${group.name === "Cadbury" ? "brand-cadbury" : ""}">${logo ? `<img src="${esc(logo)}" alt="${esc(group.name)} ${group.name === "Cadbury" ? "wordmark" : "product"}" loading="lazy" onerror="this.closest('.brand-card-photo').classList.add('brand-photo-error');this.remove()">` : ''}<span class="brand-photo-count">${group.count} ${group.count===1?'product':'products'}</span></span><span class="brand-card-name">${esc(group.name)}</span><span class="brand-card-link">VIEW COLLECTION ↗</span></button>`;
  }).join("") || '<span class="brand-loading">Brands will appear as products are published.</span>';
  $("menuCategories").innerHTML = categories.map(v => `<button class="menu-filter-link" data-menu-category="${esc(v)}">${esc(v)} <span>↗</span></button>`).join("") || '<p class="menu-empty">Categories will appear as products are published.</p>';
  $("menuBrands").innerHTML = brandGroups.map(group => {
    const logo = group.name === "Cadbury" ? "assets/cadbury-wordmark.svg" : group.image;
    return `<button class="menu-filter-link menu-brand-link" data-menu-brand="${esc(group.name)}">${logo ? `<img src="${esc(logo)}" alt="" loading="lazy">` : '<span class="menu-brand-mark">GS</span>'}<strong>${esc(group.name)}</strong><span>↗</span></button>`;
  }).join("") || '<p class="menu-empty">Brands will appear as products are published.</p>';
  $("heroBrandProof").innerHTML = brands.length ? `<span>BRANDS YOU LOVE</span><b>${brands.slice(0,5).map(esc).join(' · ')}${brands.length>5?' · MORE':''}</b>` : '<span>BRANDS YOU LOVE</span><b>Imported favourites, coming soon</b>';
  renderHeroPoster(brandGroups);
  renderCategoryBanners();
}
function renderHeroPoster(brandGroups) {
  const preferred = ["Cadbury", "Ferrero", "Hershey's", "Lindt", "Toblerone", "Milka"];
  const ordered = [...preferred.map(name => brandGroups.find(group => group.name.toLowerCase() === name.toLowerCase())).filter(Boolean), ...brandGroups.filter(group => !preferred.some(name => group.name.toLowerCase() === name.toLowerCase()))];
  const picks = ordered.map(group => group.items.find(p => p.image) || group.items[0]).filter(Boolean).slice(0,6);
  $("heroPoster").innerHTML = picks.length ? picks.map((p,i) => `<button type="button" class="poster-product poster-product-${i+1}" data-poster-brand="${esc(canonicalBrand(p.brand))}" aria-label="Browse ${esc(canonicalBrand(p.brand))}"><span class="poster-image-wrap">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.closest('.poster-product').classList.add('poster-image-error');this.remove()">` : ''}</span><span class="poster-brand-name">${esc(canonicalBrand(p.brand))}</span></button>`).join("") : '<div class="poster-fallback">ACTIVATE YOUR APPROVED PRODUCTS<br>TO SHOW YOUR REAL BRANDS HERE</div>';
}
function getFilteredProducts() {
  const query = $("searchInput").value.toLowerCase().trim();
  const category = $("categoryFilter").value; const brand = $("brandFilter").value;
  let filtered = products.filter(p => (!query || [p.name,p.brand,p.description,p.category].join(" ").toLowerCase().includes(query)) && (!category || p.category === category) && (!brand || canonicalBrand(p.brand) === brand));
  const sort = $("sortFilter").value;
  if (sort === "az") filtered.sort((a,b)=>a.name.localeCompare(b.name));
  if (sort === "za") filtered.sort((a,b)=>b.name.localeCompare(a.name));
  if (sort === "brand") filtered.sort((a,b)=>(a.brand||"").localeCompare(b.brand||"") || a.name.localeCompare(b.name));
  return filtered;
}
function productCard(p) {
  const qty = Number(cart[p.id]) || 0;
  const img = p.image ? `<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.closest('.product-image').classList.add('image-error');this.remove()">` : '';
  return `<article class="product-card" data-product-card="${esc(p.id)}">
    <div class="product-image">${img}<span class="image-corner">GLOBAL SNACK</span><button class="quick-add" data-quick-add="${esc(p.id)}" aria-label="Add one ${esc(p.name)} to enquiry">+</button></div>
    <div class="product-info"><div class="product-brand">${esc(p.brand || p.category || "GLOBAL SNACK")}</div><h3>${esc(p.name)}</h3><p class="product-desc">${esc(p.description || "Discover this imported treat. Contact us for product details.")}</p>
    <div class="product-meta"><span>${esc(p.category || "Imported treats")}</span><span>Tap to view details ↗</span></div>
    <div class="product-action"><div class="quantity-control live-quantity" aria-label="Quantity in enquiry"><button data-card-qty="${esc(p.id)}" data-delta="-1" aria-label="Remove one ${esc(p.name)}" ${qty===0?'disabled':''}>−</button><output aria-live="polite" data-card-count="${esc(p.id)}">${qty}</output><button data-card-qty="${esc(p.id)}" data-delta="1" aria-label="Add one ${esc(p.name)}">+</button></div><span class="quantity-hint">${qty ? 'in enquiry' : 'Select quantity'}</span></div>
    </div></article>`;
}
function openProductModal(id) {
  const p = productById(id); if (!p) return;
  const current = Number(cart[p.id]) || 0;
  $("modalContent").innerHTML = `<div class="modal-product">
    <div class="modal-product-image">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.remove()">` : '<span>🍫</span>'}</div>
    <div class="modal-product-copy">
      <div class="modal-product-brand">${esc(p.brand || "GLOBAL SNACK")}</div>
      <h2 id="modalTitle">${esc(p.name)}</h2>
      <p>${esc(p.description || "Contact Global Snack for further product details.")}</p>
      <div class="modal-product-category">${esc(p.category || "Imported treats")}${current ? ` · ${current} pcs already in your enquiry` : ""}</div>
      <div class="modal-actions"><div class="quantity-control"><button data-modal-qty="-1" aria-label="Decrease quantity">−</button><input id="modalQty" inputmode="numeric" type="number" min="1" max="999" value="1" aria-label="Quantity to add"><button data-modal-qty="1" aria-label="Increase quantity">+</button></div><button class="add-button" id="modalAdd" data-modal-add="${esc(p.id)}">Add to enquiry</button></div>
    </div></div>`;
  $("productModal").classList.remove("hidden"); $("productModal").setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
}
function closeProductModal() {
  $("productModal").classList.add("hidden"); $("productModal").setAttribute("aria-hidden","true");
  document.body.classList.remove("drawer-open");
}
function render() {
  const filtered = getFilteredProducts();
  $("resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`;
  $("productGrid").innerHTML = filtered.map(productCard).join("");
  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
  const cat = $("categoryFilter").value;
  $("categoryPills").querySelectorAll(".category-pill").forEach(button => button.classList.toggle("active", button.dataset.category === cat));
  const summary = [cat, $("brandFilter").value].filter(Boolean).join(" · ");
  $("filterSummary").textContent = summary ? `Filtered by ${summary}` : "";
}
function renderCart() {
  const entries = Object.entries(cart).filter(([id,qty]) => Number(qty)>0 && productById(id));
  $("cartEmpty").classList.toggle("hidden", entries.length > 0);
  $("cartItems").innerHTML = entries.map(([id,qty]) => {
    const p = productById(id);
    return `<div class="cart-item"><div class="cart-thumb">${p.image?`<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">`:'🍫'}</div><div class="cart-item-info"><span class="cart-item-brand">${esc(p.brand || "GLOBAL SNACK")}</span><strong>${esc(p.name)}</strong><button class="remove-item" data-remove="${esc(id)}">Remove</button></div><div class="cart-qty"><button data-cart-qty="${esc(id)}" data-delta="-1" aria-label="Decrease quantity">−</button><input data-cart-input="${esc(id)}" inputmode="numeric" value="${qty}" aria-label="Quantity"><button data-cart-qty="${esc(id)}" data-delta="1" aria-label="Increase quantity">+</button></div></div>`;
  }).join("");
}
function applyBrand(brand) { $("brandFilter").value = brand; $("categoryFilter").value = ""; $("searchInput").value = ""; render(); closeDrawer(); document.getElementById("catalogue").scrollIntoView({behavior:"smooth"}); }
function applyCategory(category) { $("categoryFilter").value = category; $("brandFilter").value = ""; $("searchInput").value = ""; render(); closeDrawer(); document.getElementById("catalogue").scrollIntoView({behavior:"smooth"}); }
function resetFilters() { $("searchInput").value=""; $("categoryFilter").value=""; $("brandFilter").value=""; $("sortFilter").value="featured"; render(); }
function productShareUrl(p) {
  const url = new URL(window.location.href);
  url.hash = `product=${encodeURIComponent(p.id)}`;
  return url.toString();
}
function saveEnquiryToGoogleSheet(payload) {
  if (!GOOGLE_SHEETS_WEB_APP_URL) {
    localStorage.setItem("globalSnackLastEnquiry", JSON.stringify(payload));
    return Promise.resolve({configured:false});
  }
  return fetch(GOOGLE_SHEETS_WEB_APP_URL, {method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),keepalive:true})
    .then(()=>({configured:true})).catch(error=>{console.error("Google Sheets save failed:",error);return {configured:true,failed:true};});
}
function sendWhatsApp() {
  const entries=Object.entries(cart).filter(([id,qty])=>Number(qty)>0&&productById(id));
  if(!entries.length){showToast("Add at least one product to your enquiry first.");return;}
  const name=$("customerName").value.trim(),city=$("customerCity").value.trim();
  if(!name||!city){showToast("Please enter your name and city.");(!name?$("customerName"):$("customerCity")).focus();return;}
  const type=$("customerType").value;
  const items=entries.map(([id,qty])=>{const p=productById(id);return {id:String(p.id),name:p.name,brand:p.brand||"",category:p.category||"",quantity:Number(qty),productUrl:productShareUrl(p)};});
  const payload={enquiryId:`GS-${Date.now()}`,customerName:name,customerCity:city,enquiryType:type,totalPieces:cartQuantity(),itemCount:items.length,pageUrl:window.location.href,items};
  const lines=["Hello Global Snack,","","I would like to enquire about the following products:"];
  items.forEach((item,i)=>lines.push(`${i+1}. ${item.name}${item.brand?` (${item.brand})`:""} — Quantity: ${item.quantity} pcs`,`Product link: ${item.productUrl}`));
  lines.push("",`Name: ${name}`,`City: ${city}`,`Enquiry type: ${type}`,`Enquiry reference: ${payload.enquiryId}`,"","Please share further details. Thank you.");
  const whatsappUrl=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(whatsappUrl,"_blank","noopener,noreferrer");
  saveEnquiryToGoogleSheet(payload).then(result=>{if(!result.configured)showToast("WhatsApp opened. Google Sheets saving needs setup.");else if(result.failed)showToast("WhatsApp opened; online enquiry save may have failed.");else showToast("WhatsApp opened and enquiry submitted for saving.");});
}

$("productGrid").addEventListener("click", event => {
  const step=event.target.closest("[data-card-qty]");
  const quick=event.target.closest("[data-quick-add]");
  if(step){event.stopPropagation();const id=step.dataset.cardQty;setCartQty(id,(Number(cart[id])||0)+Number(step.dataset.delta));render();}
  else if(quick){event.stopPropagation();add(quick.dataset.quickAdd,1);render();}
  else if(event.target.closest("input,button,a,select"))return;
  else {const card=event.target.closest("[data-product-card]");if(card)openProductModal(card.dataset.productCard);}
});

$("cartItems").addEventListener("click", event => {
  const step=event.target.closest("[data-cart-qty]"), remove=event.target.closest("[data-remove]");
  if(step) setCartQty(step.dataset.cartQty,(Number(cart[step.dataset.cartQty])||0)+Number(step.dataset.delta));
  if(remove) { delete cart[remove.dataset.remove]; persistCart(); showToast("Product removed from your enquiry"); }
});
$("cartItems").addEventListener("change", event => { if(event.target.matches("[data-cart-input]")) setCartQty(event.target.dataset.cartInput,Number(event.target.value)); });
$("brandStrip").addEventListener("click", event => { const tile=event.target.closest("[data-brand]"); if(tile) applyBrand(tile.dataset.brand); });
$("heroPoster").addEventListener("click", event => {
  const tile = event.target.closest("button[data-poster-brand]");
  if (!tile) return;
  event.preventDefault();
  applyBrand(tile.dataset.posterBrand);
});
$("categoryPills").addEventListener("click", event => { const pill=event.target.closest("[data-category]"); if(pill) applyCategory(pill.dataset.category); });
$("menuCategories").addEventListener("click", event => { const button=event.target.closest("[data-menu-category]"); if(button) applyCategory(button.dataset.menuCategory); });
$("menuBrands").addEventListener("click", event => { const button=event.target.closest("[data-menu-brand]"); if(button) applyBrand(button.dataset.menuBrand); });
$("menuDrawer").addEventListener("click", event => { if(event.target.closest("[data-menu-close]")) closeDrawer(); });
["searchInput","categoryFilter","brandFilter","sortFilter"].forEach(id => $(id).addEventListener(id==="searchInput"?"input":"change",render));
$("clearFilters").onclick=$("emptyReset").onclick=resetFilters;
$("menuOpen").addEventListener("click", event => { event.preventDefault(); openDrawer("menu"); });
$("menuClose").addEventListener("click", event => { event.preventDefault(); closeDrawer(); });
$("cartOpen").addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openDrawer("cart"); });
$("cartClose").addEventListener("click", event => { event.preventDefault(); closeDrawer(); });
$("drawerOverlay").addEventListener("click", () => closeDrawer());
$("sendWhatsApp").addEventListener("click", sendWhatsApp);
$("brandScrollLeft").onclick=()=>$("brandStrip").scrollBy({left:-380,behavior:"smooth"}); $("brandScrollRight").onclick=()=>$("brandStrip").scrollBy({left:380,behavior:"smooth"});
$("productModal").addEventListener("click", event => {
  if (event.target.closest("[data-modal-close]")) closeProductModal();
  const step = event.target.closest("[data-modal-qty]");
  if (step) { const input=$("modalQty"); input.value=Math.max(1,Math.min(999,(Number(input.value)||1)+Number(step.dataset.modalQty))); }
  const addButton = event.target.closest("[data-modal-add]");
  if (addButton) { add(addButton.dataset.modalAdd, Math.max(1,Math.min(999,Number($("modalQty").value)||1))); closeProductModal(); render(); }
});
$("modalClose").onclick=closeProductModal;
document.addEventListener("keydown",event=>{ if(event.key==="Escape"){ closeDrawer(); closeProductModal(); } if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();$("searchInput").focus();} });
async function init() {
  try {
    const response=await fetch("data/products.json",{cache:"no-store"}); if(!response.ok) throw new Error(`Product data returned ${response.status}`);
    const all=await response.json(); products=all.filter(p=>p.active===true);
    if(all.length && products.length===0){$("notice").classList.remove("hidden");$("notice").textContent=`${all.length} products are in the catalogue file. Products appear here after active is set to true.`;}
    categoriesAndBrands(); render(); renderCart(); updateCartCount(); openProductFromHash();
  } catch(error) { $("resultCount").textContent="Catalogue unavailable"; $("notice").classList.remove("hidden"); $("notice").textContent="We could not load the product catalogue. Please check that data/products.json is present and valid."; console.error(error); }
}
$("categoryBanners").addEventListener("click", event=>{const card=event.target.closest("[data-category-showcase]");if(card)applyShowcaseCategory(Number(card.dataset.categoryShowcase));});
$("categoryDots").addEventListener("click", event=>{const dot=event.target.closest("[data-category-dot]");if(dot){const card=$("categoryBanners").children[Number(dot.dataset.categoryDot)];card?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});}});
$("categoryScrollLeft").onclick=()=>$("categoryBanners").scrollBy({left:-520,behavior:"smooth"});
$("categoryScrollRight").onclick=()=>$("categoryBanners").scrollBy({left:520,behavior:"smooth"});
$("categoryBanners").addEventListener("scroll",()=>{const host=$("categoryBanners"),cards=[...host.children];let nearest=0,dist=Infinity;cards.forEach((card,i)=>{const d=Math.abs(card.offsetLeft-host.scrollLeft);if(d<dist){dist=d;nearest=i;}});$("categoryDots").querySelectorAll(".category-dot").forEach((dot,i)=>dot.classList.toggle("active",i===nearest));},{passive:true});
$("year").textContent=new Date().getFullYear(); init();

function openProductFromHash(){const match=window.location.hash.match(/^#product=(.+)$/);if(match){const id=decodeURIComponent(match[1]);if(productById(id))openProductModal(id);}}
window.addEventListener("hashchange",openProductFromHash);
