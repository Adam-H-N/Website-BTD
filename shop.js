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

const $ = function(selector) {
  return document.querySelector(selector);
};

const money = function(amount) {
  return "AED " + amount.toLocaleString("en-US");
};

let activeFilter = "All";
const cart = {};
let figures = [];

function characterArt(figure) {
  if (figure.image) {
    return '<img class="product-image" src="' + figure.image + '" alt="' + figure.name + ' figure">';
  }
  return '<div class="figure-art"><span>' + (figure.emoji || "✦") + "</span></div>";
}

function renderProducts() {
  const query = $("#search").value.trim().toLowerCase();

  const filtered = figures.filter(function(figure) {
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Under AED 200"
        ? Number(figure.price) < 200
        : figure.tag === activeFilter);

    const matchesSearch =
      (String(figure.name || "") + " " + String(figure.series || "") + " " + String(figure.tag || ""))
        .toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  $("#products").innerHTML = filtered.map(function(figure) {
    const stripeUrl = figure.stripeLink && figure.stripeLink !== "#" ? figure.stripeLink : "#";

    return '<article class="product">' +
      '<div class="product-art" style="background:' + (figure.tone || "#30213d") + '">' +
        '<span class="tag">' + (figure.tag || "Item") + "</span>" +
        '<button class="add-button" data-add="' + figure.id + '">+ Bag</button>' +
        characterArt(figure) +
      "</div>" +
      '<div class="product-info">' +
        '<span class="series">' + (figure.series || "") + "</span>" +
        "<h3>" + figure.name + "</h3>" +
        '<div class="product-bottom" style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">' +
          "<strong>" + money(Number(figure.price)) + "</strong>" +
          '<a href="' + stripeUrl + '" target="_blank" class="primary" style="padding: 6px 12px; font-size: 11px; text-decoration: none;">Buy Now ↗</a>' +
        "</div>" +
      "</div>" +
    "</article>";
  }).join("");

  $("#empty").hidden = filtered.length > 0;

  document.querySelectorAll("[data-filter]").forEach(function(button) {
    button.classList.toggle(
      "active",
      button.dataset.filter === activeFilter
    );
  });
}

function updateCart() {
  const entries = Object.entries(cart).filter(function(entry) { return entry[1] > 0; });
  const count = entries.reduce(function(sum, entry) { return sum + entry[1]; }, 0);

  $("#cartCount").textContent = count;

  let total = 0;

  $("#cartItems").innerHTML = entries.map(function(entry) {
    const id = entry[0];
    const quantity = entry[1];
    const figure = figures.find(function(item) { return String(item.id) === String(id); });
    if (!figure) return "";
    total += Number(figure.price) * quantity;

    return '<div class="cart-row">' +
      '<span class="cart-emoji" style="background:' + (figure.tone || "#30213d") + '">' + (figure.emoji || "✦") + "</span>" +
      '<div class="cart-description">' +
        "<strong>" + figure.name + "</strong>" +
        "<small>" + money(Number(figure.price)) + " each</small>" +
        '<div class="quantity">' +
          '<button data-qty="' + id + '" data-delta="-1">−</button>' +
          "<span>" + quantity + "</span>" +
          '<button data-qty="' + id + '" data-delta="1">+</button>' +
        "</div>" +
      "</div>" +
      "<strong>" + money(Number(figure.price) * quantity) + "</strong>" +
    "</div>";
  }).join("");

  if (!entries.length) {
    $("#cartItems").innerHTML = '<p class="empty">Your bag is waiting for its first figure ✦</p>';
  }

  $("#subtotal").textContent = money(total);
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  setTimeout(function() { $("#toast").classList.remove("visible"); }, 2200);
}

async function fetchStoreProducts() {
  try {
    const snapshot = await get(ref(db, "products"));
    figures = [];
    if (snapshot.exists()) {
      snapshot.forEach(function(childSnapshot) {
        const productData = childSnapshot.val();
        figures.push(Object.assign({ id: childSnapshot.key }, productData));
      });
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
  renderProducts();
  updateCart();
}

$("#products").addEventListener("click", function(event) {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  const id = button.dataset.add;
  cart[id] = (cart[id] || 0) + 1;
  updateCart();

  const figure = figures.find(function(item) { return String(item.id) === String(id); });
  if (figure) showToast(figure.name + " added to your bag!");
});

$("#filters").addEventListener("click", function(event) {
  const button = event.target.closest("[data-filter]");
  if (!button) return;

  activeFilter = button.dataset.filter;
  renderProducts();
});

$("#search").addEventListener("input", renderProducts);

$("#cartOpen").addEventListener("click", function() {
  $("#overlay").classList.add("open");
});

$("#cartClose").addEventListener("click", function() {
  $("#overlay").classList.remove("open");
});

$("#overlay").addEventListener("click", function(event) {
  if (event.target === $("#overlay")) {
    $("#overlay").classList.remove("open");
  }
});

$("#cartItems").addEventListener("click", function(event) {
  const button = event.target.closest("[data-qty]");
  if (!button) return;

  const id = button.dataset.qty;
  cart[id] = (cart[id] || 0) + Number(button.dataset.delta);

  if (cart[id] <= 0) delete cart[id];
  updateCart();
});

$("#checkout").addEventListener("click", function() {
  showToast("Demo checkout — use individual Buy Now buttons for payments.");
});

fetchStoreProducts();
