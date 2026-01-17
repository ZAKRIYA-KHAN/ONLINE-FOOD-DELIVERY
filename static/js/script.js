// --- 1. Data Setup ---
const menuItems = [
    { id: 1, name: "Classic Cheese Burger", price: 12.99, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60", desc: "Juicy beef patty with cheddar." },
    { id: 2, name: "Pepperoni Pizza", price: 15.50, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=60", desc: "Wood-fired crust with pepperoni." },
    { id: 3, name: "Caesar Salad", price: 9.99, image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=60", desc: "Fresh romaine with creamy dressing." },
    { id: 4, name: "Spicy Miso Ramen", price: 14.50, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=60", desc: "Rich pork broth, noodles, soft-boiled egg." },
    { id: 5, name: "Sushi Platter", price: 18.99, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=60", desc: "Assorted fresh nigiri and maki rolls." },
    { id: 6, name: "Spicy Beef Tacos", price: 10.50, image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=500&q=60", desc: "Three soft shell tacos with salsa." }
];

let cart = [];

// Elements
const menuContainer = document.getElementById('menu-container');
const cartItemsContainer = document.getElementById('cart-items-container');
const totalSpan = document.getElementById('total-price');
const cartCountSpan = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const historySidebar = document.getElementById('history-sidebar');
const checkoutForm = document.getElementById('checkout-form');
const trackerBox = document.getElementById('tracker-box');
const paymentExtraFields = document.getElementById('payment-extra-fields');

// --- 2. Core Functions ---
function renderMenu() {
    menuContainer.innerHTML = menuItems.map(item => `
        <div class="menu-item-card">
            <img src="${item.image}" alt="${item.name}">
            <div class="card-content">
                <h3>${item.name}</h3>
                <p style="color: #666; font-size: 0.9em;">${item.desc}</p>
                <p style="margin-top: 5px; color: #ff4757;"><strong>$${item.price.toFixed(2)}</strong></p>
                <button class="add-to-cart-btn" onclick="addToCart(${item.id})">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function updateCartDisplay() {
    cartCountSpan.textContent = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalSpan.textContent = total.toFixed(2);
    cartItemsContainer.innerHTML = cart.length === 0 ? '<p>Your cart is empty.</p>' : 
        cart.map((item, index) => `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>$${item.price.toFixed(2)} <button onclick="removeFromCart(${index})" style="color:red;border:none;background:none;cursor:pointer;">X</button></span>
            </div>
        `).join('');
}

// --- 3. Dynamic Payment Fields ---
function updatePaymentFields() {
    const method = document.getElementById('payment-method').value;
    
    if (method === 'Credit Card') {
        paymentExtraFields.innerHTML = `
            <div class="payment-fields">
                <input type="text" id="cc-num" placeholder="Card Number (0000 0000 0000 0000)" required>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="cc-exp" placeholder="MM/YY" required>
                    <input type="text" id="cc-cvv" placeholder="CVV" required>
                </div>
            </div>`;
    } else if (method === 'PayPal') {
        paymentExtraFields.innerHTML = `
            <div class="payment-fields">
                <input type="email" id="pp-email" placeholder="PayPal Email Address" required>
            </div>`;
    } else {
        paymentExtraFields.innerHTML = ''; // Clear fields for Cash
    }
}

// --- 4. Logic ---
function addToCart(itemId) {
    cart.push(menuItems.find(i => i.id === itemId));
    updateCartDisplay();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function toggleCart() { cartSidebar.classList.toggle('active'); }

function toggleHistory() {
    historySidebar.classList.toggle('active');
    if (historySidebar.classList.contains('active')) loadOrderHistory();
}

async function loadOrderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '<p>Loading...</p>';
    
    try {
        const res = await fetch('/api/history');
        const orders = await res.json();
        
        if(orders.length === 0) { list.innerHTML = '<p>No previous orders found.</p>'; return; }

        list.innerHTML = orders.map(order => `
            <div class="history-order-card">
                <h4>Order ${order.id}</h4>
                <div class="order-meta" style="font-size:0.85em; color:#555; margin-bottom:5px;">
                    <p>📅 ${order.date}</p>
                    <p>💳 ${order.paymentMethod}</p>
                    <p>📍 ${order.customer.address}</p>
                    <p>📞 ${order.customer.phone}</p>
                </div>
                <hr style="margin: 5px 0; border: 0; border-top: 1px solid #ddd;">
                <ul style="padding-left:20px; font-size:0.9em;">
                    ${order.cart.map(i => `<li>${i.name}</li>`).join('')}
                </ul>
                <p style="text-align: right; margin-top: 5px;"><strong>Total: $${order.total}</strong></p>
                
                <p style="color:${getStatusColor(order.status)}; font-weight:bold; margin-top:5px;">
                    Status: ${order.status}
                </p>
            </div>
        `).join('');
    } catch (err) { list.innerHTML = '<p style="color:red">Error loading history.</p>'; }
}

function getStatusColor(status) {
    if(status.includes("Delivered")) return "green";
    if(status.includes("Out")) return "orange";
    return "#ff4757"; // Red for preparing
}

// --- 5. Checkout & Tracking ---
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(cart.length === 0) { alert("Cart is empty"); return; }

    // Collect extra payment details
    let paymentDetails = {};
    const method = document.getElementById('payment-method').value;
    if(method === 'Credit Card') {
        paymentDetails = { 
            cardNum: document.getElementById('cc-num').value,
            exp: document.getElementById('cc-exp').value
        };
    } else if (method === 'PayPal') {
        paymentDetails = { email: document.getElementById('pp-email').value };
    }

    const orderData = {
        customerDetails: { 
            name: document.getElementById('c-name').value, 
            address: document.getElementById('c-address').value,
            email: document.getElementById('c-email').value,
            phone: document.getElementById('c-phone').value
        },
        paymentMethod: method,
        paymentDetails: paymentDetails,
        cart: cart,
        total: cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)
    };

    try {
        const response = await fetch('/api/place_order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderData)
        });
        const result = await response.json();

        if(result.status === 'success') {
            alert(`Order Placed Successfully!`);
            cart = []; 
            updateCartDisplay();
            checkoutForm.reset();
            updatePaymentFields(); // Reset dynamic fields
            cartSidebar.classList.remove('active');
            startOrderTracking(result.order_id);
        }
    } catch (error) { console.error(error); alert("System Error"); }
});

function startOrderTracking(orderId) {
    trackerBox.classList.remove('hidden');
    document.getElementById('track-id').textContent = orderId;
    
    const statusText = document.getElementById('track-status');
    const fill = document.getElementById('progress-fill');
    
    // 1. Start: Preparing
    statusText.textContent = "Kitchen is Preparing 🍳";
    fill.style.width = "20%";
    
    // 2. After 15 seconds: Out for delivery
    setTimeout(() => {
        statusText.textContent = "Out for Delivery 🛵";
        fill.style.width = "60%";
    }, 15000); 

    // 3. After 30 seconds: Delivered
    setTimeout(() => {
        statusText.textContent = "Delivered! Enjoy your meal 😋";
        fill.style.width = "100%";
    }, 30000); 
}

// Init
renderMenu();