
const WHATSAPP_NUMBER = "917990683272"; // Change if your enquiry number is different.
let products = [];
let cart = JSON.parse(localStorage.getItem("globalSnackCart") || "{}");
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function saveCart(){localStorage.setItem("globalSnackCart",JSON.stringify(cart));renderCart();updateCount();}
function updateCount(){$("cartCount").textContent=Object.values(cart).reduce((a,b)=>a+b,0);}
function openCart(){$("cartDrawer").classList.add("open");$("cartOverlay").classList.remove("hidden");$("cartDrawer").setAttribute("aria-hidden","false");}
function closeCart(){$("cartDrawer").classList.remove("open");$("cartOverlay").classList.add("hidden");$("cartDrawer").setAttribute("aria-hidden","true");}
function add(id){cart[id]=(cart[id]||0)+1;saveCart();}
function change(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];saveCart();}
function renderCart(){
 const entries=Object.entries(cart).filter(([id])=>products.some(p=>p.id===id));
 $("cartEmpty").classList.toggle("hidden",entries.length>0);
 $("cartItems").innerHTML=entries.map(([id,q])=>{const p=products.find(x=>x.id===id);return `<div class="cart-row"><div><strong>${esc(p.name)}</strong><small>${esc(p.brand||"")}</small></div><div class="qty"><button data-change="${id}" data-delta="-1">−</button><b>${q}</b><button data-change="${id}" data-delta="1">+</button></div></div>`}).join("");
}
function categories(){
 const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
 const brands=[...new Set(products.map(p=>p.brand).filter(Boolean))].sort();
 $("categoryFilter").innerHTML='<option value="">All categories</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join("");
 $("brandFilter").innerHTML='<option value="">All brands</option>'+brands.map(x=>`<option>${esc(x)}</option>`).join("");
}
function render(){
 const q=$("searchInput").value.toLowerCase().trim(),cat=$("categoryFilter").value,brand=$("brandFilter").value;
 const filtered=products.filter(p=>(!q||[p.name,p.brand,p.description].join(" ").toLowerCase().includes(q))&&(!cat||p.category===cat)&&(!brand||p.brand===brand));
 $("resultCount").textContent=`${filtered.length} products`;
 $("productGrid").innerHTML=filtered.map(p=>`<article class="product-card"><div class="product-image">${p.image?`<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.remove();this.parentElement.innerHTML='<div class=&quot;image-fallback&quot;>🍫</div>'">`:`<div class="image-fallback">🍫</div>`}</div><div class="product-info"><div class="product-brand">${esc(p.brand||p.category||"GLOBAL SNACK")}</div><h3>${esc(p.name)}</h3><p class="product-desc">${esc(p.description||"Discover this imported treat. Contact us for product details.")}</p><div class="card-bottom"><span class="source-tag">${esc(p.source||"Global Snack")}</span><button class="add-btn ${cart[p.id]?"added":""}" data-add="${p.id}">${cart[p.id]?"Added ✓":"+ Add"}</button></div></div></article>`).join("");
 $("emptyState").classList.toggle("hidden",filtered.length!==0);
}
async function init(){
 try{
  const res=await fetch("data/products.json");const all=await res.json();
  products=all.filter(p=>p.active===true);
  if(all.length && products.length===0){$("notice").classList.remove("hidden");$("notice").textContent=`${all.length} candidate products are loaded, but none is approved for public display yet. Update active to yes in data/products.csv, then regenerate products.json using the included instructions.`;}
  categories();render();renderCart();updateCount();
 }catch(e){$("resultCount").textContent="Could not load catalogue";$("notice").classList.remove("hidden");$("notice").textContent="Please check that data/products.json exists and the website is hosted (or run a local web server).";}
}
$("productGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b){add(b.dataset.add);render();}});
$("cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-change]");if(b)change(b.dataset.change,Number(b.dataset.delta));});
$("searchInput").addEventListener("input",render);$("categoryFilter").addEventListener("change",render);$("brandFilter").addEventListener("change",render);
$("cartOpen").onclick=openCart;$("cartClose").onclick=closeCart;$("cartOverlay").onclick=closeCart;
$("sendWhatsApp").onclick=()=>{
 const entries=Object.entries(cart).filter(([id])=>products.some(p=>p.id===id));
 if(!entries.length){alert("Please add at least one product.");return;}
 const name=$("customerName").value.trim(),city=$("customerCity").value.trim(),type=$("customerType").value;
 if(!name||!city){alert("Please enter your name and city.");return;}
 let msg=`Hello Global Snack,%0A%0AI would like to enquire about these products:%0A`;
 entries.forEach(([id,q],i)=>{const p=products.find(x=>x.id===id);msg+=`%0A${i+1}. ${encodeURIComponent(p.name)}${p.brand?" ("+encodeURIComponent(p.brand)+")":""} — Qty: ${q}`;});
 msg+=`%0A%0AName: ${encodeURIComponent(name)}%0ACity: ${encodeURIComponent(city)}%0AEnquiry type: ${encodeURIComponent(type)}%0A%0APlease share details.`;
 window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,"_blank");
};
$("year").textContent=new Date().getFullYear();init();
