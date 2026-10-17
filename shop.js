import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfc_66w7wE1pJ0q-njX6tQVFM1IR_l9zw",
  authDomain: "btd-anime.firebaseapp.com",
  databaseURL: "https://btd-anime-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "btd-anime",
  storageBucket: "btd-anime.firebasestorage.app",
  messagingSenderId: "822260127443",
  appId: "1:822260127443:web:1300428ba96f30c938a626"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let allProducts = {};
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchProductsFromFirebase();
  setupCartUI();
});

async function fetchProductsFromFirebase() {
  const container = document.getElementById("productsGrid");
  if (!container) return;
  
  container.innerHTML = "<p class='empty'>Loading vault figures...</p>";

  try {
    const snapshot = await get(ref(db, 'products'));
    if (!snapshot.exists()) {
      container.innerHTML = "<p class='empty'>No figures published yet. Check back soon!</p>";
      return;
    }

    allProducts = {};
    snapshot.forEach((childSnapshot) => {
      allProducts[childSnapshot.key] = childSnapshot.val();
    });

    renderProducts(allProducts);
  } catch (err) {
    container.innerHTML = "<p class='empty'>Error loading products from database.</p>";
  }
}

function renderProducts(products) {
  const container = document.getElementById("productsGrid");
  container.innerHTML = "";

  const keys = Object.keys(products);
  if (keys.length === 0) {
    container.innerHTML = "<p class='empty'>No figures found.</p>";
    return;
  }

  keys.forEach((id) => {
    const prod = products[id];
    container.appendChild(renderProductCard(id, prod));
  });
}

function renderProductCard(id, prod) {
  const card = document.createElement("article");
  card.className = "product";

  const firstImage = prod.images 
    ? prod.images.split(',')[0].trim() 
    : prod.image;

  card.innerHTML = `
    <div class="product-art" onclick="window.location.href='product.html?id=${id}'">
      <span class="tag">${prod.tag || 'New drop'}</span>
      <img class="product-image" src="${firstImage}" alt="${prod.name}">
      <button class="add-button" data-add="${id}">+ Bag</button>
    </div>
    <div class="product-info">
      <span class="series">${prod.series}</span>
      <h3 style="cursor:pointer;" onclick="window.location.href='product.html?id=${id}'">${prod.name}</h3>
      <div class="product-bottom">
        <strong>AED ${prod.price}</strong>
        <a href="${prod.stripeLink || '#'}" target="_blank" class="primary" style="padding: 6px 12px; font-size: 11px;">Buy Now ↗</a>
      </div>
    </div>
  `;

  card.querySelector("[data-add]").addEventListener("click", (e) => {
    e.stopPropagation();
    addToCart(id, prod);
  });

  return card;
}

function addToCart(id, prod) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, ...prod, qty: 1 });
  }
  updateCartUI();
  showToast(`Added ${prod.name} to bag`);
}

function updateCartUI() {
  const countEl = document.getElementById("cartCount");
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (countEl) countEl.textContent = totalCount;

  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = "<p class='empty'>Your bag is empty.</p>";
    if (totalEl) totalEl.textContent = "AED 0";
    return;
  }

  itemsEl.innerHTML = "";
  let totalPrice = 0;

  cart.forEach(item => {
    totalPrice += item.price * item.qty;
    const firstImg = item.images ? item.images.split(',')[0].trim() : item.image;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-emoji"><img src="${firstImg}" style="width:40px; height:40px; object-fit:contain;"></div>
      <div class="cart-description">
        <strong>${item.name}</strong>
        <small>AED ${item.price} x ${item.qty}</small>
        <div class="quantity">
          <button data-dec="${item.id}">-</button>
          <span>${item.qty}</span>
          <button data-inc="${item.id}">+</button>
        </div>
      </div>
    `;

    row.querySelector("[data-inc]").addEventListener("click", () => {
      item.qty++;
      updateCartUI();
    });
    row.querySelector("[data-dec]").addEventListener("click", () => {
      item.qty--;
      if (item.qty <= 0) cart = cart.filter(i => i.id !== item.id);
      updateCartUI();
    });

    itemsEl.appendChild(row);
  });

  if (totalEl) totalEl.textContent = `AED ${totalPrice}`;
}

function setupCartUI() {
  const bagBtn = document.getElementById("bagBtn");
  const closeCart = document.getElementById("closeCart");
  const overlay = document.getElementById("cartOverlay");

  if (bagBtn) bagBtn.addEventListener("click", () => overlay.classList.add("open"));
  if (closeCart) closeCart.addEventListener("click", () => overlay.classList.remove("open"));
  if (overlay) overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
}

function showToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}
