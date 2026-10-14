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

const $ = selector => document.querySelector(selector);
const money = amount => "AED " + amount.toLocaleString("en-US");

let activeFilter = "All";
const cart = {};
let figures = [];

// Fetch live products from Firebase Realtime Database
async function fetchStoreProducts() {
  try {
    const snapshot = await get(ref(db, 'products'));
    figures = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        figures.push(childSnapshot.val());
      });
    }
  } catch (err) {
    console.error("Error loading products:", err);
  }
  renderProducts();
  updateCart();
}

// ... Keep your characterArt, renderProducts, updateCart, and event listener functions below ...

// Initialize store fetch on page load
fetchStoreProducts();