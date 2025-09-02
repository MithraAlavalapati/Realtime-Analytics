// --- UPDATED CODE: Dynamic URL based on environment ---
let API_BASE_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = 'http://localhost:5000/api';
} else {
    API_BASE_URL = window.location.protocol + '//' + window.location.host + '/api';
}
// --- END OF UPDATED CODE ---

let user = JSON.parse(sessionStorage.getItem('user'));

const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');
const formTitle = document.getElementById('form-title');
const sellerForm = document.getElementById('seller-form');
const toggleFormBtn = document.getElementById('toggle-form-btn');
const storeNameInput = document.getElementById('store-name-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const formMessage = document.getElementById('form-message');
const logoutBtn = document.getElementById('logout-btn');
const productsTabBtn = document.getElementById('products-tab-btn');
const ordersTabBtn = document.getElementById('orders-tab-btn');
const notificationsTabBtn = document.getElementById('notifications-tab-btn');
const analyticsTabBtn = document.getElementById('analytics-tab-btn');
const productsSection = document.getElementById('products-section');
const ordersSection = document.getElementById('orders-section');
const notificationsSection = document.getElementById('notifications-section');
const analyticsSection = document.getElementById('analytics-section');
const notificationFeed = document.getElementById('notification-feed');
const orderListContainer = document.getElementById('order-list-seller');
const totalSalesEl = document.getElementById('total-sales');
const topProductEl = document.getElementById('top-product');
const totalViewsEl = document.getElementById('total-views');

let isRegistering = false;
let notificationPollingInterval = null;

const addProductBtn = document.getElementById('add-product-btn');
const uploadModal = document.getElementById('upload-modal');
const uploadProductForm = document.getElementById('upload-product-form');
const cancelUploadBtn = document.getElementById('cancel-upload-btn');
const productNameInput = document.getElementById('product-name');
const productCategoryInput = document.getElementById('product-category');
const productPriceInput = document.getElementById('product-price');
const productImageUrlInput = document.getElementById('product-image-url');
const productDescriptionInput = document.getElementById('product-description');

// MOCK PRODUCT DATA
const products = [
    { id: 'bn002', name: 'Atomic Habits', category: 'Books', store: 'The Book Nook', price: 22.5, image: 'https://i1.sndcdn.com/artworks-yrIbiixVohkQgzgq-afLB3w-t1080x1080.jpg', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51-n2jY1qjL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/41T-m3d9uDL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/41-y3bC-wYL._SX331_BO1,204,203,200_.jpg'], description: 'An easy & proven way to build good habits & break bad ones.', brand: 'Avery', variant: 'Paperback' },
    { id: 'bn005', name: 'The Midnight Library', category: 'Books', store: 'The Book Nook', price: 17.5, image: 'https://www.theindianbookstore.in/cdn/shop/products/the-midnight-library-the-no-1-sunday-times-bestseller-and-worldwide-phenomenon.jpg?v=1664821147', moreImages: ['https://images-na.ssl-images-amazon.com/images/I/51wX-p861dL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51S4H+RzQfL._SX331_BO1,204,203,200_.jpg', 'https://images-na.ssl-images-amazon.com/images/I/51-O-G+E-lL._SX331_BO1,204,203,200_.jpg'], description: 'A heartwarming and philosophical tale about life choices.', brand: 'Viking', variant: 'Hardcover' },
    { id: 'f001', name: 'Elegant Evening Dress', category: 'Fashion', store: 'Trendy Threads', price: 89.99, image: 'https://5.imimg.com/data5/SELLER/Default/2022/12/XQ/FK/NC/123524965/whatsapp-image-2022-12-06-at-09-59-11-4--500x500.jpeg', moreImages: ['https://5.imimg.com/data5/SELLER/Default/2022/12/XQ/FK/NC/123524965/whatsapp-image-2022-12-06-at-09-59-11-4--500x500.jpeg'], description: 'A stunning dress perfect for evening events. Made from high-quality silk blend.', brand: 'Glamourous Attire', variant: 'Blue-Large', bestseller: true },
    { id: 'te001', name: 'Flagship Smartphone Pro', category: 'Mobiles/Computers', store: 'Tech Emporium', price: 999.0, image: 'https://blogassets.airtel.in/wp-content/uploads/2024/12/x.jpeg', moreImages: ['https://blogassets.airtel.in/wp-content/uploads/2024/12/x.jpeg'], description: 'The latest flagship smartphone with a stunning display and pro-grade camera system.', brand: 'ApexTech', variant: 'Midnight Black-512GB', bestseller: true },
];

let sellerProducts = JSON.parse(localStorage.getItem('sellerProducts')) || {};

const mockOrders = [
    { id: 'ORD-001', customerName: 'John Doe', items: [{ name: 'Elegant Evening Dress', quantity: 1 }], total: 89.99, status: 'Processing', date: '2025-08-28' },
    { id: 'ORD-002', customerName: 'Jane Smith', items: [{ name: 'The Midnight Library', quantity: 2 }], total: 35.00, status: 'Shipped', date: '2025-08-27' },
    { id: 'ORD-003', customerName: 'Alice Johnson', items: [{ name: 'Running Shorts', quantity: 1 }], total: 29.00, status: 'Delivered', date: '2025-08-25' },
];

const mockAnalytics = {
    totalSales: 153.99,
    totalViews: 4521,
    topProduct: 'Elegant Evening Dress'
};

function handleUnauthorized() {
    sessionStorage.removeItem('user');
    user = null;
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
    window.location.href = 'login.html';
}

async function fetchProducts() {
    if (!user || !user.username) {
        document.getElementById('product-list').innerHTML = `<p class="text-red-500 col-span-full">User not logged in or store name not found.</p>`;
        return;
    }

    const productListContainer = document.getElementById('product-list');
    productListContainer.innerHTML = `<p class="text-gray-500 col-span-full">Loading products...</p>`;

    const userProducts = products.filter(p => p.store === user.username);
    const sessionProducts = JSON.parse(localStorage.getItem('sellerProducts')) || {};
    const storedUserProducts = sessionProducts[user.username] || [];

    renderProducts([...userProducts, ...storedUserProducts]);
}

function startPollingNotifications() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
    notificationPollingInterval = setInterval(fetchNotifications, 5000);
    console.log("Started polling for notifications every 5 seconds.");
}

async function fetchNotifications() {
    try {
        const pollUrl = `${API_BASE_URL}/seller/notifications/poll?sellerId=${user.id}`;
        const response = await fetch(pollUrl);
        if (response.status === 401) {
            handleUnauthorized();
            return;
        }
        const result = await response.json();
        if (result.success && result.notifications.length > 0) {
            renderNotifications(result.notifications);
        }
    } catch (error) {
        console.error("Failed to poll for notifications:", error);
    }
}

function renderNotifications(notifications) {
    if (!notificationFeed) return;
    
    notifications.forEach(data => {
        const notificationItem = document.createElement('li');
        notificationItem.className = 'bg-gray-50 p-4 rounded-lg shadow-sm text-sm';
        
        let formattedDate = 'Invalid Date';
        try {
            const date = new Date(data.timestamp);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleString();
            }
        } catch (e) {
            console.error("Failed to parse date:", e);
        }

        notificationItem.innerHTML = `
            ${data.message}
            <span class="block text-xs text-gray-400 mt-1">${formattedDate}</span>
        `;
        notificationFeed.prepend(notificationItem);
    });
    
    const initialMessage = notificationFeed.querySelector('p');
    if (initialMessage && initialMessage.textContent.includes('Waiting for notifications')) {
        initialMessage.remove();
    }
}

function renderProducts(productsToRender) {
    const productListContainer = document.getElementById('product-list');
    if (!productListContainer) return;

    productListContainer.innerHTML = '';
    if (productsToRender.length === 0) {
        productListContainer.innerHTML = `<p class="text-gray-500 col-span-full">You have no products listed.</p>`;
        return;
    }
    productsToRender.forEach(product => {
        productListContainer.innerHTML += `
            <div class="product-card-seller">
                <img src="${product.image}" alt="${product.name}">
                <h5 class="text-lg font-semibold">${product.name}</h5>
                <p class="text-sm text-gray-600">Category: ${product.category}</p>
                <p class="text-xl font-bold text-indigo-600 mt-2">$${product.price.toFixed(2)}</p>
            </div>
        `;
    });
}

function renderOrders() {
    if (!orderListContainer) return;
    
    orderListContainer.innerHTML = '';
    if (mockOrders.length === 0) {
        orderListContainer.innerHTML = `<p class="text-gray-500">No new orders.</p>`;
        return;
    }
    
    mockOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-200';
        
        const statusColor = {
            'Processing': 'bg-blue-100 text-blue-800',
            'Shipped': 'bg-green-100 text-green-800',
            'Delivered': 'bg-gray-100 text-gray-800'
        }[order.status] || 'bg-gray-100 text-gray-800';

        orderCard.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="text-xl font-semibold">Order #${order.id}</h4>
                <span class="text-sm text-gray-500">${order.date}</span>
            </div>
            <p><strong>Customer:</strong> ${order.customerName}</p>
            <ul class="list-disc list-inside mt-2 text-sm">
                ${order.items.map(item => `<li>${item.name} (x${item.quantity}) - $${item.price.toFixed(2)}</li>`).join('')}
            </ul>
            <div class="mt-4 flex justify-between items-center">
                <p class="text-lg font-bold">Total: $${order.total.toFixed(2)}</p>
                <div>
                    <span class="text-sm font-semibold p-2 rounded-full status-${order.status.toLowerCase()}">${order.status}</span>
                    <button class="btn btn-primary text-sm ml-4">Update Status</button>
                </div>
            </div>
        `;
        orderListContainer.appendChild(orderCard);

        orderCard.querySelector('select')?.addEventListener('change', (e) => {
            const newStatus = e.target.value;
            const orderId = e.target.dataset.orderId;
            const orderIndex = mockOrders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                mockOrders[orderIndex].status = newStatus;
                renderOrders(); // Re-render to show status change
                alert(`Order #${orderId} status updated to ${newStatus}`);
            }
        });
    });
}

function renderAnalytics() {
    if (!totalSalesEl || !topProductEl || !totalViewsEl) return;
    totalSalesEl.textContent = mockAnalytics.totalSales.toFixed(2);
    topProductEl.textContent = mockAnalytics.topProduct;
    totalViewsEl.textContent = mockAnalytics.totalViews.toLocaleString();
}


function showPage(page) {
    if (loginPage) loginPage.style.display = page === 'login' ? 'flex' : 'none';
    if (dashboardPage) dashboardPage.style.display = page === 'dashboard' ? 'block' : 'none';
}

function switchTab(tab) {
    [productsTabBtn, ordersTabBtn, notificationsTabBtn, analyticsTabBtn].forEach(btn => btn.classList.remove('active'));
    [productsSection, ordersSection, notificationsSection, analyticsSection].forEach(section => section.classList.add('hidden'));

    if (tab === 'products') {
        productsTabBtn.classList.add('active');
        productsSection.classList.remove('hidden');
        if (notificationPollingInterval) {
            clearInterval(notificationPollingInterval);
            notificationPollingInterval = null;
        }
    } else if (tab === 'orders') {
        ordersTabBtn.classList.add('active');
        ordersSection.classList.remove('hidden');
        renderOrders();
    } else if (tab === 'notifications') {
        notificationsTabBtn.classList.add('active');
        notificationsSection.classList.remove('hidden');
        if (!notificationPollingInterval && user) {
            startPollingNotifications();
        }
    } else if (tab === 'analytics') {
        analyticsTabBtn.classList.add('active');
        analyticsSection.classList.remove('hidden');
        renderAnalytics();
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (formMessage) formMessage.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;
    const store_name = storeNameInput.value;
    let endpoint = '';
    let body = {};
    if (isRegistering) {
        endpoint = '/admin/signup';
        body = { store_name, email, password };
    } else {
        endpoint = '/login';
        body = { email, password, role: 'seller' };
    }

    try {
        const response = await fetch(API_BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await response.json();
        if (response.ok) {
            user = result.user;
            sessionStorage.setItem('user', JSON.stringify(user));
            if (document.getElementById('seller-store-name')) document.getElementById('seller-store-name').textContent = user.username;
            showPage('dashboard');
            await fetchProducts();
        } else {
            if (formMessage) formMessage.textContent = result.message;
        }
    } catch (error) {
        if (formMessage) formMessage.textContent = 'An unexpected error occurred.';
        console.error('Error:', error);
    }
}

function handleLogout() {
    fetch(`${API_BASE_URL}/logout`, { method: 'POST' })
        .then(() => {
            handleUnauthorized();
        })
        .catch(error => {
            console.error("Error during logout:", error);
            handleUnauthorized();
        });
}

function toggleForm() {
    isRegistering = !isRegistering;
    if (isRegistering) {
        if (formTitle) formTitle.textContent = 'Seller Registration';
        if (toggleFormBtn) toggleFormBtn.textContent = 'Switch to Login';
        if (storeNameInput) storeNameInput.style.display = 'block';
        if (sellerForm) sellerForm.querySelector('button').textContent = 'Register';
    } else {
        if (formTitle) formTitle.textContent = 'Seller Login';
        if (toggleFormBtn) toggleFormBtn.textContent = 'Switch to Register';
        if (storeNameInput) storeNameInput.style.display = 'none';
        if (sellerForm) sellerForm.querySelector('button').textContent = 'Login';
    }
}

function handleUploadProduct(event) {
    event.preventDefault();

    const newProduct = {
        id: `sp-${Date.now()}`,
        name: productNameInput.value,
        category: productCategoryInput.value,
        price: parseFloat(productPriceInput.value),
        image: productImageUrlInput.value,
        description: productDescriptionInput.value,
        store: user.username
    };

    if (!sellerProducts[user.username]) {
        sellerProducts[user.username] = [];
    }
    sellerProducts[user.username].push(newProduct);
    localStorage.setItem('sellerProducts', JSON.stringify(sellerProducts));

    fetchProducts();
    hideUploadModal();
    alert('Product uploaded successfully!');
}

function showUploadModal() {
    uploadModal.classList.remove('hidden');
}

function hideUploadModal() {
    uploadModal.classList.add('hidden');
    uploadProductForm.reset();
}

if (sellerForm) sellerForm.addEventListener('submit', handleFormSubmit);
if (toggleFormBtn) toggleFormBtn.addEventListener('click', toggleForm);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

if (productsTabBtn) productsTabBtn.addEventListener('click', () => switchTab('products'));
if (ordersTabBtn) ordersTabBtn.addEventListener('click', () => {
    switchTab('orders');
});
if (notificationsTabBtn) notificationsTabBtn.addEventListener('click', () => {
    switchTab('notifications');
});
if (analyticsTabBtn) analyticsTabBtn.addEventListener('click', () => {
    switchTab('analytics');
});

if (addProductBtn) addProductBtn.addEventListener('click', showUploadModal);
if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', hideUploadModal);
if (uploadProductForm) uploadProductForm.addEventListener('submit', handleUploadProduct);

document.addEventListener('DOMContentLoaded', async () => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        user = JSON.parse(storedUser);
        if (document.getElementById('seller-store-name')) document.getElementById('seller-store-name').textContent = user.username;
        showPage('dashboard');
        await fetchProducts();
    } else {
        showPage('login');
    }
});