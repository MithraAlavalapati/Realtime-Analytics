// --- Mock Product Data ---
// Significantly expanded product data to ensure scrolling on desktop
const products = [
    // Fashion Category (Expanded)
    { id: 'f001', name: 'Elegant Evening Dress', category: 'Fashion', price: 89.99, image: 'https://placehold.co/300x200/a78bfa/ffffff?text=Elegant+Dress' },
    { id: 'f002', name: 'Men\'s Slim Fit Shirt', category: 'Fashion', price: 34.99, image: 'https://placehold.co/300x200/818cf8/ffffff?text=Slim+Fit+Shirt' },
    { id: 'f003', name: 'High-Waisted Denim Jeans', category: 'Fashion', price: 49.99, image: 'https://placehold.co/300x200/6366f1/ffffff?text=Denim+Jeans' },
    { id: 'f004', name: 'Classic Summer Hat', category: 'Fashion', price: 18.00, image: 'https://placehold.co/300x200/4f46e5/ffffff?text=Summer+Hat' },
    { id: 'f005', name: 'Women\'s Floral Blouse', category: 'Fashion', price: 27.50, image: 'https://placehold.co/300x200/4338ca/ffffff?text=Floral+Blouse' },
    { id: 'f006', name: 'Leather Wallet', category: 'Fashion', price: 55.00, image: 'https://placehold.co/300x200/3730a3/ffffff?text=Leather+Wallet' },
    { id: 'f007', name: 'Sporty Sneakers', category: 'Fashion', price: 70.00, image: 'https://placehold.co/300x200/312e81/ffffff?text=Sporty+Sneakers' },
    { id: 'f008', name: 'Winter Scarf', category: 'Fashion', price: 22.00, image: 'https://placehold.co/300x200/1e1b4b/ffffff?text=Winter+Scarf' },
    { id: 'f009', name: 'Casual Hoodie', category: 'Fashion', price: 40.00, image: 'https://placehold.co/300x200/0f0a2e/ffffff?text=Casual+Hoodie' },
    { id: 'f010', name: 'Elegant Watch', category: 'Fashion', price: 120.00, image: 'https://placehold.co/300x200/0c0c1e/ffffff?text=Elegant+Watch' },
    { id: 'f011', name: 'Designer Handbag', category: 'Fashion', price: 150.00, image: 'https://placehold.co/300x200/7c3aed/ffffff?text=Handbag' },
    { id: 'f012', name: 'Running Shoes', category: 'Fashion', price: 85.00, image: 'https://placehold.co/300x200/6d28d9/ffffff?text=Running+Shoes' },
    { id: 'f013', name: 'Silk Tie', category: 'Fashion', price: 30.00, image: 'https://placehold.co/300x200/5b21b6/ffffff?text=Silk+Tie' },
    { id: 'f014', name: 'Woolen Sweater', category: 'Fashion', price: 60.00, image: 'https://placehold.co/300x200/4c1d95/ffffff?text=Woolen+Sweater' },
    { id: 'f015', name: 'Summer Dress', category: 'Fashion', price: 45.00, image: 'https://placehold.co/300x200/3b0764/ffffff?text=Summer+Dress' },
    { id: 'f016', name: 'Formal Trousers', category: 'Fashion', price: 55.00, image: 'https://placehold.co/300x200/2e1065/ffffff?text=Trousers' },
    { id: 'f017', name: 'Denim Jacket', category: 'Fashion', price: 75.00, image: 'https://placehold.co/300x200/1e0a3c/ffffff?text=Denim+Jacket' },
    { id: 'f018', name: 'Casual Shorts', category: 'Fashion', price: 25.00, image: 'https://placehold.co/300x200/0f051d/ffffff?text=Casual+Shorts' },
    { id: 'f019', name: 'Sport Bra', category: 'Fashion', price: 35.00, image: 'https://placehold.co/300x200/0a0210/ffffff?text=Sport+Bra' },
    { id: 'f020', name: 'Yoga Pants', category: 'Fashion', price: 40.00, image: 'https://placehold.co/300x200/050108/ffffff?text=Yoga+Pants' },

    // Mobiles/Computers Category (Expanded)
    { id: 'm001', name: 'Flagship Smartphone Pro', category: 'Mobiles/Computers', price: 999.00, image: 'https://placehold.co/300x200/22c55e/ffffff?text=Smartphone+Pro' },
    { id: 'm002', name: 'Ultra-Thin Laptop Air', category: 'Mobiles/Computers', price: 1350.00, image: 'https://placehold.co/300x200/10b981/ffffff?text=Laptop+Air' },
    { id: 'm003', name: 'Noise-Cancelling Headphones', category: 'Mobiles/Computers', price: 149.00, image: 'https://placehold.co/300x200/059669/ffffff?text=Headphones' },
    { id: 'm004', name: 'High-Performance Gaming Mouse', category: 'Mobiles/Computers', price: 65.00, image: 'https://placehold.co/300x200/0f766e/ffffff?text=Gaming+Mouse' },
    { id: 'm005', name: 'Mechanical Keyboard', category: 'Mobiles/Computers', price: 89.00, image: 'https://placehold.co/300x200/047857/ffffff?text=Mechanical+Keyboard' },
    { id: 'm006', name: 'External SSD 1TB', category: 'Mobiles/Computers', price: 120.00, image: 'https://placehold.co/300x200/065f46/ffffff?text=External+SSD' },
    { id: 'm007', name: '4K UHD Monitor', category: 'Mobiles/Computers', price: 350.00, image: 'https://placehold.co/300x200/022c22/ffffff?text=4K+Monitor' },
    { id: 'm008', name: 'Webcam Full HD', category: 'Mobiles/Computers', price: 40.00, image: 'https://placehold.co/300x200/011c16/ffffff?text=Webcam+HD' },
    { id: 'm009', name: 'Smartwatch Fitness Tracker', category: 'Mobiles/Computers', price: 180.00, image: 'https://placehold.co/300x200/000000/ffffff?text=Smartwatch' },
    { id: 'm010', name: 'Portable Power Bank', category: 'Mobiles/Computers', price: 30.00, image: 'https://placehold.co/300x200/1a1a1a/ffffff?text=Power+Bank' },
    { id: 'm011', name: 'Gaming Desktop PC', category: 'Mobiles/Computers', price: 1800.00, image: 'https://placehold.co/300x200/333333/ffffff?text=Gaming+PC' },
    { id: 'm012', name: 'Tablet Pro', category: 'Mobiles/Computers', price: 600.00, image: 'https://placehold.co/300x200/444444/ffffff?text=Tablet+Pro' },
    { id: 'm013', name: 'Wireless Router', category: 'Mobiles/Computers', price: 70.00, image: 'https://placehold.co/300x200/555555/ffffff?text=Wireless+Router' },
    { id: 'm014', name: 'Printer All-in-One', category: 'Mobiles/Computers', price: 120.00, image: 'https://placehold.co/300x200/666666/ffffff?text=Printer' },
    { id: 'm015', name: 'USB-C Hub', category: 'Mobiles/Computers', price: 35.00, image: 'https://placehold.co/300x200/777777/ffffff?text=USB-C+Hub' },
    { id: 'm016', name: 'Ergonomic Office Chair', category: 'Mobiles/Computers', price: 250.00, image: 'https://placehold.co/300x200/888888/ffffff?text=Office+Chair' },
    { id: 'm017', name: 'VR Headset', category: 'Mobiles/Computers', price: 400.00, image: 'https://placehold.co/300x200/999999/ffffff?text=VR+Headset' },
    { id: 'm018', name: 'External Hard Drive 2TB', category: 'Mobiles/Computers', price: 90.00, image: 'https://placehold.co/300x200/aaaaaa/ffffff?text=HDD+2TB' },
    { id: 'm019', name: 'Graphics Tablet', category: 'Mobiles/Computers', price: 110.00, image: 'https://placehold.co/300x200/bbbbbb/ffffff?text=Graphics+Tablet' },
    { id: 'm020', name: 'Portable Projector', category: 'Mobiles/Computers', price: 200.00, image: 'https://placehold.co/300x200/cccccc/ffffff?text=Projector' },

    // Baby Products Category (Expanded)
    { id: 'b001', name: 'Convertible Baby Stroller', category: 'Baby products', price: 249.00, image: 'https://placehold.co/300x200/fcd34d/ffffff?text=Baby+Stroller' },
    { id: 'b002', name: 'Hypoallergenic Baby Wipes (1000ct)', category: 'Baby products', price: 19.99, image: 'https://placehold.co/300x200/fbbf24/ffffff?text=Baby+Wipes' },
    { id: 'b003', name: 'Infant Safety Car Seat', category: 'Baby products', price: 180.00, image: 'https://placehold.co/300x200/f59e0b/ffffff?text=Car+Seat' },
    { id: 'b004', name: 'Anti-Colic Feeding Bottle Set', category: 'Baby products', price: 32.00, image: 'https://placehold.co/300x200/eab308/ffffff?text=Feeding+Bottles' },
    { id: 'b005', name: 'Soft Baby Blanket', category: 'Baby products', price: 25.00, image: 'https://placehold.co/300x200/d97706/ffffff?text=Baby+Blanket' },
    { id: 'b006', name: 'Diaper Bag Backpack', category: 'Baby products', price: 60.00, image: 'https://placehold.co/300x200/b45309/ffffff?text=Diaper+Bag' },
    { id: 'b007', name: 'Baby Monitor with Camera', category: 'Baby products', price: 110.00, image: 'https://placehold.co/300x200/92400e/ffffff?text=Baby+Monitor' },
    { id: 'b008', name: 'Organic Baby Food Purees (6-pack)', category: 'Baby products', price: 15.00, image: 'https://placehold.co/300x200/78350f/ffffff?text=Baby+Food' },
    { id: 'b009', name: 'Baby Bathtub with Sling', category: 'Baby products', price: 45.00, image: 'https://placehold.co/300x200/572a0f/ffffff?text=Baby+Bathtub' },
    { id: 'b010', name: 'Teething Toy Set', category: 'Baby products', price: 10.00, image: 'https://placehold.co/300x200/3e2723/ffffff?text=Teething+Toys' },
    { id: 'b011', name: 'Baby Carrier Ergo', category: 'Baby products', price: 75.00, image: 'https://placehold.co/300x200/ff7f50/ffffff?text=Baby+Carrier' },
    { id: 'b012', name: 'Nursery Crib Mobile', category: 'Baby products', price: 30.00, image: 'https://placehold.co/300x200/ff6347/ffffff?text=Crib+Mobile' },
    { id: 'b013', name: 'Baby Play Mat', category: 'Baby products', price: 40.00, image: 'https://placehold.co/300x200/ff4500/ffffff?text=Play+Mat' },
    { id: 'b014', name: 'Toddler Learning Tower', category: 'Baby products', price: 90.00, image: 'https://placehold.co/300x200/e63946/ffffff?text=Learning+Tower' },
    { id: 'b015', name: 'Baby Food Maker', category: 'Baby products', price: 80.00, image: 'https://placehold.co/300x200/c70039/ffffff?text=Food+Maker' },
    { id: 'b016', name: 'Pacifier Set', category: 'Baby products', price: 12.00, image: 'https://placehold.co/300x200/a8002d/ffffff?text=Pacifier+Set' },
    { id: 'b017', name: 'Baby Bouncer Seat', category: 'Baby products', price: 55.00, image: 'https://placehold.co/300x200/8b0000/ffffff?text=Bouncer+Seat' },
    { id: 'b018', name: 'Baby Walker', category: 'Baby products', price: 65.00, image: 'https://placehold.co/300x200/690000/ffffff?text=Baby+Walker' },
    { id: 'b019', name: 'Crib Mattress', category: 'Baby products', price: 100.00, image: 'https://placehold.co/300x200/4c0000/ffffff?text=Crib+Mattress' },
    { id: 'b020', name: 'Baby Grooming Kit', category: 'Baby products', price: 20.00, image: 'https://placehold.co/300x200/2e0000/ffffff?text=Grooming+Kit' },

    // Toys Category (Expanded)
    { id: 't001', name: 'Deluxe Building Blocks Set (1000 pcs)', category: 'Toys', price: 45.00, image: 'https://placehold.co/300x200/f43f5e/ffffff?text=Building+Blocks' },
    { id: 't002', name: 'High-Speed Remote Control Car', category: 'Toys', price: 65.00, image: 'https://placehold.co/300x200/ef4444/ffffff?text=RC+Car' },
    { id: 't003', name: 'Giant Plush Toy Bear (3 ft)', category: 'Toys', price: 35.00, image: 'https://placehold.co/300x200/dc2626/ffffff?text=Plush+Bear' },
    { id: 't004', name: 'Advanced Logic Puzzle Game', category: 'Toys', price: 28.00, image: 'https://placehold.co/300x200/b91c1c/ffffff?text=Puzzle+Game' },
    { id: 't005', name: 'Educational Robot Kit', category: 'Toys', price: 90.00, image: 'https://placehold.co/300x200/991b1b/ffffff?text=Robot+Kit' },
    { id: 't006', name: 'Wooden Train Set', category: 'Toys', price: 50.00, image: 'https://placehold.co/300x200/7f1d1d/ffffff?text=Train+Set' },
    { id: 't007', name: 'Action Figure Collection (5-pack)', category: 'Toys', price: 40.00, image: 'https://placehold.co/300x200/630000/ffffff?text=Action+Figures' },
    { id: 't008', name: 'Art & Craft Supply Kit', category: 'Toys', price: 20.00, image: 'https://placehold.co/300x200/450000/ffffff?text=Art+Kit' },
    { id: 't009', name: 'Board Game Classic Edition', category: 'Toys', price: 25.00, image: 'https://placehold.co/300x200/2a0000/ffffff?text=Board+Game' },
    { id: 't010', name: 'Outdoor Play Tent', category: 'Toys', price: 75.00, image: 'https://placehold.co/300x200/1a0000/ffffff?text=Play+Tent' },
    { id: 't011', name: 'Dollhouse Playset', category: 'Toys', price: 80.00, image: 'https://placehold.co/300x200/ff8c00/ffffff?text=Dollhouse' },
    { id: 't012', name: 'Science Experiment Kit', category: 'Toys', price: 45.00, image: 'https://placehold.co/300x200/ffa500/ffffff?text=Science+Kit' },
    { id: 't013', name: 'Kids\' Scooter', category: 'Toys', price: 55.00, image: 'https://placehold.co/300x200/ffaa00/ffffff?text=Kids+Scooter' },
    { id: 't014', name: 'Toy Kitchen Set', category: 'Toys', price: 60.00, image: 'https://placehold.co/300x200/ffb700/ffffff?text=Kitchen+Set' },
    { id: 't015', name: 'Remote Control Drone', category: 'Toys', price: 110.00, image: 'https://placehold.co/300x200/ffc300/ffffff?text=RC+Drone' },
    { id: 't016', name: 'Magnetic Tiles Set', category: 'Toys', price: 70.00, image: 'https://placehold.co/300x200/ffd000/ffffff?text=Magnetic+Tiles' },
    { id: 't017', name: 'Water Gun Blaster', category: 'Toys', price: 15.00, image: 'https://placehold.co/300x200/ffdd00/ffffff?text=Water+Gun' },
    { id: 't018', name: 'Kids\' Art Easel', category: 'Toys', price: 30.00, image: 'https://placehold.co/300x200/ffe400/ffffff?text=Art+Easel' },
    { id: 't019', name: 'Toy Car Collection', category: 'Toys', price: 20.00, image: 'https://placehold.co/300x200/ffee00/ffffff?text=Toy+Cars' },
    { id: 't020', name: 'Outdoor Swing Set', category: 'Toys', price: 150.00, image: 'https://placehold.co/300x200/fff400/ffffff?text=Swing+Set' },
];

// --- Global State ---
let cartItems = []; // Stores { productId: '...', quantity: N }
let currentPage = 'login'; // Tracks the current active page

// --- DOM Elements ---
const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const categoryPage = document.getElementById('category-page');
const cartPage = document.getElementById('cart-page');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

const cartIconMain = document.getElementById('cart-icon');
const cartCountMain = document.getElementById('cart-count');
const cartIconCategory = document.getElementById('cart-icon-category');
const cartCountCategory = document.getElementById('cart-count-category');

const categoriesContainer = document.getElementById('categories-container');
const productList = document.getElementById('product-list');
const categoryTitle = document.getElementById('category-title');
const categoryProductList = document.getElementById('category-product-list');
const backToMainBtnCategory = document.getElementById('back-to-main-btn-category');
const backToMainBtnCart = document.getElementById('back-to-main-btn-cart');

const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const emptyCartMessage = document.getElementById('empty-cart-message');
const cartSummary = document.getElementById('cart-summary');
const signOutBtn = document.getElementById('sign-out-btn');

// --- Utility Functions ---

/**
 * Hides all main content pages.
 */
function hideAllPages() {
    loginPage.classList.add('hidden');
    mainPage.classList.add('hidden');
    categoryPage.classList.add('hidden');
    cartPage.classList.add('hidden');
}

/**
 * Displays a specific page and updates the current page state.
 * Also updates the URL hash for navigation.
 * @param {string} pageName - The ID of the page to show ('login', 'main', 'category', 'cart').
 * @param {string} [category=null] - The category name if navigating to a category page.
 * @param {boolean} [updateHash=true] - Whether to update the URL hash. Set to false if called from hashchange listener.
 */
function showPage(pageName, category = null, updateHash = true) {
    hideAllPages(); // Hide all pages first
    currentPage = pageName; // Update current page state

    if (updateHash) {
        switch (pageName) {
            case 'login':
                window.location.hash = ''; // Clear hash for login
                break;
            case 'main':
                window.location.hash = ''; // Clear hash for main page
                break;
            case 'category':
                if (category) {
                    window.location.hash = `category=${encodeURIComponent(category)}`;
                }
                break;
            case 'cart':
                window.location.hash = 'cart';
                break;
        }
    }

    switch (pageName) {
        case 'login':
            loginPage.classList.remove('hidden');
            // Clear inputs on logout/return to login
            emailInput.value = '';
            passwordInput.value = '';
            loginError.classList.add('hidden');
            break;
        case 'main':
            mainPage.classList.remove('hidden');
            renderCategories();
            renderProducts(products, productList); // Show all products on main page
            updateCartCounts();
            break;
        case 'category':
            if (category) {
                categoryPage.classList.remove('hidden');
                categoryTitle.textContent = category;
                const filteredProducts = products.filter(p => p.category === category);
                renderProducts(filteredProducts, categoryProductList);
                updateCartCounts();
            } else {
                console.error('Category page requires a category name.');
                showPage('main'); // Fallback to main page
            }
            break;
        case 'cart':
            cartPage.classList.remove('hidden');
            renderCart();
            break;
        default:
            console.error('Unknown page:', pageName);
            showPage('login'); // Fallback to login
    }
}

/**
 * Renders product cards into a specified container.
 * @param {Array<Object>} productsToRender - Array of product objects.
 * @param {HTMLElement} container - The DOM element to render products into.
 */
function renderProducts(productsToRender, container) {
    container.innerHTML = ''; // Clear previous products
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No products found in this category.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover rounded-md mb-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">${product.name}</h3>
            <p class="text-gray-600 mb-3">${product.category}</p>
            <p class="text-xl font-bold text-indigo-600 mb-4">$${product.price.toFixed(2)}</p>
            <button class="add-to-cart-btn btn-primary w-full" data-product-id="${product.id}">Add to Cart</button>
        `;
        container.appendChild(productCard);
    });

    // Attach event listeners to new "Add to Cart" buttons
    container.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            addToCart(productId);
        });
    });
}

/**
 * Renders category buttons.
 */
function renderCategories() {
    categoriesContainer.innerHTML = ''; // Clear previous categories
    const uniqueCategories = [...new Set(products.map(p => p.category))];

    uniqueCategories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-button';
        button.textContent = category;
        // Update URL hash when category button is clicked
        button.addEventListener('click', () => showPage('category', category));
        categoriesContainer.appendChild(button);
    });
}

/**
 * Adds a product to the cart.
 * @param {string} productId - The ID of the product to add.
 */
function addToCart(productId) {
    const existingItem = cartItems.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cartItems.push({ productId: productId, quantity: 1 });
    }
    updateCartCounts();
    alertMessage('Product added to cart!'); // Simple alert for user feedback
}

/**
 * Updates the cart count displayed in the header.
 */
function updateCartCounts() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartCountMain.textContent = totalItems;
        cartCountMain.classList.remove('hidden');
        cartCountCategory.textContent = totalItems;
        cartCountCategory.classList.remove('hidden');
    } else {
        cartCountMain.classList.add('hidden');
        cartCountCategory.classList.add('hidden');
    }
}

/**
 * Renders the cart items on the cart page.
 */
function renderCart() {
    cartItemsContainer.innerHTML = ''; // Clear previous cart items
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

    // Attach event listeners to remove buttons
    cartItemsContainer.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            removeItemFromCart(productId);
        });
    });
}

/**
 * Removes an item from the cart.
 * @param {string} productId - The ID of the product to remove.
 */
function removeItemFromCart(productId) {
    cartItems = cartItems.filter(item => item.productId !== productId);
    updateCartCounts();
    renderCart(); // Re-render cart after removal
}

/**
 * Displays a simple alert message.
 * In a real app, this would be a custom modal or toast notification.
 */
function alertMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform duration-300 transform translate-x-full';
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    // Animate in
    setTimeout(() => {
        messageBox.classList.remove('translate-x-full');
    }, 50);

    // Animate out and remove
    setTimeout(() => {
        messageBox.classList.add('translate-x-full');
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}

/**
 * Handles the sign-out logic.
 * Clears the cart and redirects to the login page.
 */
function signOut() {
    cartItems = []; // Clear the cart
    updateCartCounts(); // Update cart display
    showPage('login'); // Go back to the login page
    alertMessage('You have been signed out.');
}

/**
 * Handles changes in the URL hash to navigate between pages.
 */
function handleHashChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#category=')) {
        const category = decodeURIComponent(hash.substring(hash.indexOf('=') + 1));
        showPage('category', category, false); // Don't update hash again
    } else if (hash === '#cart') {
        showPage('cart', null, false); // Don't update hash again
    } else {
        // If hash is empty or unrecognized, go to main page (unless currently on login)
        if (currentPage !== 'login') {
            showPage('main', null, false); // Don't update hash again
        }
    }
}


// --- Event Listeners ---

// Login Button
loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Allow login with any non-empty email and password
    if (email && password) {
        loginError.classList.add('hidden');
        showPage('main');
    } else {
        loginError.classList.remove('hidden');
        loginError.textContent = 'Please enter both email and password.';
    }
});

// Cart Icon (Main Page)
cartIconMain.addEventListener('click', () => {
    showPage('cart');
});

// Cart Icon (Category Page)
cartIconCategory.addEventListener('click', () => {
    showPage('cart');
});

// Go Back Buttons
backToMainBtnCategory.addEventListener('click', () => {
    showPage('main');
});
backToMainBtnCart.addEventListener('click', () => {
    showPage('main');
});

// Checkout Button (simple alert for now)
checkoutBtn.addEventListener('click', () => {
    if (cartItems.length > 0) {
        alertMessage('Proceeding to checkout! (This is a demo)');
        cartItems = []; // Clear cart after checkout
        updateCartCounts();
        renderCart();
    } else {
        alertMessage('Your cart is empty!');
    }
});

// Sign Out Button
if (signOutBtn) {
    signOutBtn.addEventListener('click', signOut);
}

// Listen for URL hash changes (for browser back/forward buttons)
window.addEventListener('hashchange', handleHashChange);

// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Check hash on initial load to support direct links or refresh on a specific page
    if (window.location.hash) {
        handleHashChange();
    } else {
        showPage('login'); // Start with the login page if no hash
    }
});
