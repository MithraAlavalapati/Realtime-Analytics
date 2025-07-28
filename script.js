// --- Mock Product Data ---
const products = [
    { id: 'f001', name: 'Elegant Evening Dress', category: 'Fashion', price: 89.99, image: 'https://placehold.co/300x200/a78bfa/ffffff?text=Elegant+Dress', description: 'A stunning dress perfect for evening events. Made from high-quality silk blend.' },
    { id: 'f002', name: 'Men\'s Slim Fit Shirt', category: 'Fashion', price: 34.99, image: 'https://placehold.co/300x200/818cf8/ffffff?text=Slim+Fit+Shirt', description: 'A crisp, slim-fit shirt made from 100% breathable cotton. Ideal for work or casual wear.' },
    { id: 'f003', name: 'High-Waisted Denim Jeans', category: 'Fashion', price: 49.99, image: 'https://placehold.co/300x200/6366f1/ffffff?text=Denim+Jeans', description: 'Classic high-waisted denim jeans with a modern fit. Durable and stylish.' },
    { id: 'f004', name: 'Classic Summer Hat', category: 'Fashion', price: 18.00, image: 'https://placehold.co/300x200/4f46e5/ffffff?text=Summer+Hat', description: 'Protect yourself from the sun with this timeless and fashionable summer hat.' },
    { id: 'f005', name: 'Women\'s Floral Blouse', category: 'Fashion', price: 27.50, image: 'https://placehold.co/300x200/4338ca/ffffff?text=Floral+Blouse', description: 'A beautiful floral blouse perfect for spring and summer.'},
    { id: 'm001', name: 'Flagship Smartphone Pro', category: 'Mobiles/Computers', price: 999.00, image: 'https://placehold.co/300x200/22c55e/ffffff?text=Smartphone+Pro', description: 'The latest flagship smartphone with a stunning display and pro-grade camera system.' },
    { id: 'm002', name: 'Ultra-Thin Laptop Air', category: 'Mobiles/Computers', price: 1350.00, image: 'https://placehold.co/300x200/10b981/ffffff?text=Laptop+Air', description: 'Incredibly light and powerful, this laptop is perfect for professionals on the go.' },
    { id: 'm003', name: 'Noise-Cancelling Headphones', category: 'Mobiles/Computers', price: 149.00, image: 'https://placehold.co/300x200/059669/ffffff?text=Headphones', description: 'Immerse yourself in sound with these top-tier noise-cancelling headphones.'},
];

// --- Global State & DOM Elements ---
let cartItems = [];
let currentPage = 'login';
const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const categoryPage = document.getElementById('category-page');
const cartPage = document.getElementById('cart-page');
const productDetailPage = document.getElementById('product-detail-page');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const cartIconMain = document.getElementById('cart-icon');
const cartCountMain = document.getElementById('cart-count');
const cartIconCategory = document.getElementById('cart-icon-category');
const cartCountCategory = document.getElementById('cart-count-category');
const cartIconDetail = document.getElementById('cart-icon-detail');
const cartCountDetail = document.getElementById('cart-count-detail');
const categoriesContainer = document.getElementById('categories-container');
const productList = document.getElementById('product-list');
const categoryTitle = document.getElementById('category-title');
const categoryProductList = document.getElementById('category-product-list');
const backToMainBtnCategory = document.getElementById('back-to-main-btn-category');
const backToMainBtnCart = document.getElementById('back-to-main-btn-cart');
const backFromDetailBtn = document.getElementById('back-from-detail-btn');
const productDetailContent = document.getElementById('product-detail-content');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartSummary = document.getElementById('cart-summary');
const signOutBtn = document.getElementById('sign-out-btn');


// --- Utility Functions ---

function hideAllPages() {
    loginPage.classList.add('hidden');
    mainPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    cartPage.classList.add('hidden');
    productDetailPage.classList.add('hidden');
}

function showPage(pageName, options = {}) {
    hideAllPages();
    currentPage = pageName;

    let newHash = '';
    if (pageName === 'category' && options.category) {
        newHash = `category=${encodeURIComponent(options.category)}`;
    } else if (pageName === 'product-detail' && options.productId) {
        newHash = `product=${options.productId}`;
    } else if (pageName === 'cart') {
        newHash = 'cart';
    }

    if (window.location.hash.substring(1) !== newHash) {
        window.location.hash = newHash;
    }

    switch (pageName) {
        case 'login':
            loginPage.classList.remove('hidden');
            emailInput.value = '';
            passwordInput.value = '';
            loginError.classList.add('hidden');
            break;
        case 'main':
            mainPage.classList.remove('hidden');
            renderCategories();
            renderProducts(products, productList);
            updateCartCounts();
            break;
        case 'category':
            categoryPage.classList.remove('hidden');
            categoryTitle.textContent = options.category;
            const filteredProducts = products.filter(p => p.category === options.category);
            renderProducts(filteredProducts, categoryProductList);
            updateCartCounts();
            break;
        case 'cart':
            cartPage.classList.remove('hidden');
            renderCart();
            break;
        case 'product-detail':
            productDetailPage.classList.remove('hidden');
            renderProductDetail(options.productId);
            updateCartCounts();
            break;
        default:
            showPage('login');
    }

    // TRACKING: Fire a page_view event
    setTimeout(() => {
        EventTracker.track('page_view');
    }, 0);
}

function renderProducts(productsToRender, container) {
    container.innerHTML = '';
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No products found.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md p-4 flex flex-col';
        productCard.innerHTML = `
            <a href="#product=${product.id}" class="flex flex-col flex-grow text-center">
                <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover rounded-md mb-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-2 flex-grow">${product.name}</h3>
                <p class="text-gray-600 mb-3">${product.category}</p>
                <p class="text-xl font-bold text-indigo-600 mb-4">$${product.price.toFixed(2)}</p>
            </a>
            <button class="add-to-cart-btn btn-primary w-full mt-auto" data-product-id="${product.id}">Add to Cart</button>
        `;
        container.appendChild(productCard);
    });

    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const productId = event.target.dataset.productId;
            addToCart(productId);
        });
    });
}

function renderProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        productDetailContent.innerHTML = '<p class="text-red-500">Product not found.</p>';
        return;
    }

    // TRACKING: Fire a view_item event
    EventTracker.track('view_item');

    productDetailContent.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image}" alt="${product.name}" class="w-full h-auto object-cover rounded-lg shadow-md">
        </div>
        <div class="product-info flex flex-col">
            <h2 class="text-3xl font-bold text-gray-800 mb-2">${product.name}</h2>
            <p class="text-lg text-gray-600 mb-4">${product.category}</p>
            <p class="text-gray-700 text-base mb-6">${product.description}</p>
            <div class="mt-auto">
                <p class="text-3xl font-bold text-indigo-600 mb-6">$${product.price.toFixed(2)}</p>
                <button id="detail-add-to-cart-btn" class="btn-primary w-full" data-product-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;

    document.getElementById('detail-add-to-cart-btn').addEventListener('click', (event) => {
        const id = event.target.dataset.productId;
        addToCart(id);
    });
}

function renderCategories() {
    categoriesContainer.innerHTML = '';
    const uniqueCategories = [...new Set(products.map(p => p.category))];

    uniqueCategories.forEach(category => {
        const button = document.createElement('a');
        button.className = 'category-button text-center';
        button.textContent = category;
        button.href = `#category=${encodeURIComponent(category)}`;
        categoriesContainer.appendChild(button);
    });
}

function addToCart(productId) {
    const existingItem = cartItems.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({ productId: productId, quantity: 1 });
    }
    updateCartCounts();
    alertMessage('Product added to cart!');
}

function updateCartCounts() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const counts = [cartCountMain, cartCountCategory, cartCountDetail];

    counts.forEach(countEl => {
        if (totalItems > 0) {
            countEl.textContent = totalItems;
            countEl.classList.remove('hidden');
        } else {
            countEl.classList.add('hidden');
        }
    });
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    } else {
        emptyCartMessage.classList.add('hidden');
        cartSummary.classList.remove('hidden');
    }

    cartItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm';
            cartItemDiv.innerHTML = `
                <div class="flex items-center">
                    <img src="${product.image}" alt="${product.name}" class="w-16 h-16 object-cover rounded-md mr-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
                        <p class="text-gray-600">Quantity: ${item.quantity}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-md font-bold text-indigo-600">$${itemTotal.toFixed(2)}</p>
                    <button class="remove-from-cart-btn text-red-500 hover:text-red-700 text-sm mt-1" data-product-id="${product.id}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        }
    });

    cartTotalSpan.textContent = total.toFixed(2);

    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeItemFromCart(productId);
        });
    });
}

function removeItemFromCart(productId) {
    cartItems = cartItems.filter(item => item.productId !== productId);
    updateCartCounts();
    renderCart();
}

function alertMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform duration-300 transform translate-x-full';
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.classList.remove('translate-x-full');
    }, 50);

    setTimeout(() => {
        messageBox.classList.add('translate-x-full');
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}

function signOut() {
    cartItems = [];
    updateCartCounts();
    showPage('login');
    alertMessage('You have been signed out.');
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);

    if (hash.startsWith('category=')) {
        const category = decodeURIComponent(hash.split('=')[1]);
        showPage('category', { category });
    } else if (hash.startsWith('product=')) {
        const productId = hash.split('=')[1];
        showPage('product-detail', { productId });
    } else if (hash === 'cart') {
        showPage('cart');
    } else {
        if (currentPage !== 'login') {
            showPage('main');
        }
    }
}

// --- Event Listeners ---
loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email && password) {
        loginError.classList.add('hidden');
        showPage('main');
    } else {
        loginError.classList.remove('hidden');
        loginError.textContent = 'Please enter both email and password.';
    }
});

[cartIconMain, cartIconCategory, cartIconDetail].forEach(icon => {
    icon.addEventListener('click', () => showPage('cart'));
});

backToMainBtnCategory.addEventListener('click', () => showPage('main'));
backToMainBtnCart.addEventListener('click', () => showPage('main'));
backFromDetailBtn.addEventListener('click', () => window.history.back());

checkoutBtn.addEventListener('click', () => {
    if (cartItems.length > 0) {
        alertMessage('Proceeding to checkout! (This is a demo)');
        cartItems = [];
        updateCartCounts();
        renderCart();
    } else {
        alertMessage('Your cart is empty!');
    }
});

if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
}

window.addEventListener('hashchange', handleHashChange);
window.addEventListener('popstate', handleHashChange);

// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    EventTracker.init();

    // TRACKING: Add listeners for promotion clicks
    document.querySelectorAll('.promo-banner').forEach(banner => {
        banner.addEventListener('click', () => {
            EventTracker.track('view_promotion');
        });
    });

    if (window.location.hash) {
        handleHashChange();
    } else {
        showPage('login');
    }
});