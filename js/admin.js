/* =============================================
   ROY'S CAFE — ADMIN PANEL JAVASCRIPT
   ============================================= */

// ─── CONFIG ───────────────────────────────────
const ADMIN_PASSWORD = 'admin123';
const STORAGE_MENU_KEY = 'roys_menu';
const STORAGE_GALLERY_KEY = 'roys_gallery';

// Default menu — mirrors menu.json
const DEFAULT_MENU = [
    {
        category: 'Coffee',
        items: [
            { id: uid(), name: 'Espresso', description: 'Rich and intense shot of pure coffee.', price: '₹80', tag: 'Classic' },
            { id: uid(), name: 'Cappuccino', description: 'Espresso with steamed milk and a thick layer of foam.', price: '₹120', tag: 'Popular' },
            { id: uid(), name: 'Latte', description: 'Espresso with plenty of steamed milk and a thin layer of foam.', price: '₹120', tag: '' }
        ]
    },
    {
        category: 'Tea',
        items: [
            { id: uid(), name: 'Green Tea', description: 'Refreshing and healthy tea leaves steeped to perfection.', price: '₹90', tag: 'Organic' },
            { id: uid(), name: 'Earl Grey', description: 'Black tea flavored with oil of bergamot.', price: '₹90', tag: '' }
        ]
    },
    {
        category: 'Pastries',
        items: [
            { id: uid(), name: 'Croissant', description: 'Buttery, flaky, and freshly baked every morning.', price: '₹95', tag: 'Fresh' },
            { id: uid(), name: 'Blueberry Muffin', description: 'Moist muffin packed with fresh blueberries.', price: '₹80', tag: '' }
        ]
    }
];

// Default gallery
const DEFAULT_GALLERY = [
    { id: uid(), url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80', alt: 'Cafe Ambience' },
    { id: uid(), url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80', alt: 'Specialty Coffee' },
    { id: uid(), url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80', alt: 'Pastry Corner' },
    { id: uid(), url: 'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?auto=format&fit=crop&w=600&q=80', alt: 'Green Space' },
    { id: uid(), url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80', alt: 'Outdoor Seating' },
    { id: uid(), url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&q=80', alt: 'Social Gatherings' }
];

// ─── STATE ───────────────────────────────────
let menuData = [];
let galleryData = [];
let activeCategory = 0;
let pendingDeleteFn = null;

// ─── UTILS ───────────────────────────────────
function uid() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function loadMenu() {
    const saved = localStorage.getItem(STORAGE_MENU_KEY);
    menuData = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_MENU));
}

function saveMenu() {
    localStorage.setItem(STORAGE_MENU_KEY, JSON.stringify(menuData));
}

function loadGallery() {
    const saved = localStorage.getItem(STORAGE_GALLERY_KEY);
    galleryData = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_GALLERY));
}

function saveGallery() {
    localStorage.setItem(STORAGE_GALLERY_KEY, JSON.stringify(galleryData));
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.textContent = '';
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function updateDashboardStats() {
    document.getElementById('stat-categories').textContent = menuData.length;
    document.getElementById('stat-items').textContent = menuData.reduce((s, c) => s + c.items.length, 0);
    document.getElementById('stat-gallery').textContent = galleryData.length;
}

// ─── AUTH ───────────────────────────────────
function initAuth() {
    const loginBtn = document.getElementById('login-btn');
    const passInput = document.getElementById('login-pass');
    const toggleBtn = document.getElementById('toggle-pass');
    const errorEl = document.getElementById('login-error');

    function tryLogin() {
        if (passInput.value === ADMIN_PASSWORD) {
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('admin-app').classList.remove('hidden');
            initApp();
        } else {
            errorEl.classList.remove('hidden');
            passInput.value = '';
            passInput.focus();
        }
    }

    loginBtn.addEventListener('click', tryLogin);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

    toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        toggleBtn.innerHTML = `<i class="fas fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        document.getElementById('admin-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    });
}

// ─── NAVIGATION ───────────────────────────────────
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const section = item.dataset.section;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${section}`).classList.add('active');
            document.getElementById('page-title').textContent = item.textContent.trim();
            // Update topbar actions per section
            updateTopbarActions(section);
        });
    });
}

function updateTopbarActions(section) {
    const container = document.getElementById('topbar-actions');
    container.innerHTML = '';
    if (section === 'gallery') {
        const btn = document.createElement('button');
        btn.className = 'btn-admin-primary';
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Image';
        btn.addEventListener('click', openGalleryModal);
        container.appendChild(btn);
    }
}

// ─── MENU ───────────────────────────────────
function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    container.innerHTML = '';
    menuData.forEach((cat, idx) => {
        const tab = document.createElement('div');
        tab.className = `category-tab ${idx === activeCategory ? 'active' : ''}`;
        tab.innerHTML = `
            ${cat.category}
            <span class="tab-actions">
                <button class="tab-btn edit-cat-btn" title="Rename"><i class="fas fa-pencil-alt"></i></button>
                <button class="tab-btn delete-cat-btn" title="Delete"><i class="fas fa-times"></i></button>
            </span>
        `;
        tab.addEventListener('click', e => {
            if (e.target.closest('.edit-cat-btn')) { openEditCategory(idx); return; }
            if (e.target.closest('.delete-cat-btn')) { confirmDeleteCategory(idx); return; }
            activeCategory = idx;
            renderCategoryTabs();
            renderMenuItems();
        });
        container.appendChild(tab);
    });
}

function renderMenuItems() {
    const grid = document.getElementById('menu-items-grid');
    grid.innerHTML = '';
    if (menuData.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><p>No categories yet. Add one to get started.</p></div>';
        return;
    }
    const cat = menuData[activeCategory];
    if (!cat || cat.items.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-mug-hot"></i><p>No items in this category. Click "Add Item" to create one.</p></div>';
        return;
    }
    cat.items.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-card-header">
                <span class="item-card-name">${item.name}</span>
                <span class="item-card-price">${item.price}</span>
            </div>
            <p class="item-card-desc">${item.description}</p>
            ${item.tag ? `<span class="item-card-tag">${item.tag}</span>` : ''}
            <div class="item-card-actions">
                <button class="card-btn edit-item-btn"><i class="fas fa-pencil-alt"></i> Edit</button>
                <button class="card-btn delete delete-item-btn"><i class="fas fa-trash"></i> Delete</button>
            </div>
        `;
        card.querySelector('.edit-item-btn').addEventListener('click', () => openEditItem(activeCategory, idx));
        card.querySelector('.delete-item-btn').addEventListener('click', () => confirmDeleteItem(activeCategory, idx));
        grid.appendChild(card);
    });
}

function openAddItem() {
    if (menuData.length === 0) { showToast('Please add a category first.', 'info'); return; }
    document.getElementById('item-modal-title').textContent = 'Add Menu Item';
    document.getElementById('item-id').value = '';
    document.getElementById('item-category-key').value = activeCategory;
    document.getElementById('item-name').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-tag').value = '';
    document.getElementById('item-desc').value = '';
    openModal('item-modal');
    document.getElementById('item-name').focus();
}

function openEditItem(catIdx, itemIdx) {
    const item = menuData[catIdx].items[itemIdx];
    document.getElementById('item-modal-title').textContent = 'Edit Menu Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-category-key').value = catIdx;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-tag').value = item.tag || '';
    document.getElementById('item-desc').value = item.description;
    openModal('item-modal');
    document.getElementById('item-name').focus();
}

function saveItem() {
    const id = document.getElementById('item-id').value;
    const catIdx = parseInt(document.getElementById('item-category-key').value);
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value.trim();
    const tag = document.getElementById('item-tag').value.trim();
    const description = document.getElementById('item-desc').value.trim();

    if (!name || !price || !description) { showToast('Please fill all required fields.', 'error'); return; }

    if (id) {
        const item = menuData[catIdx].items.find(i => i.id === id);
        Object.assign(item, { name, price, tag, description });
        showToast('Item updated successfully!');
    } else {
        menuData[catIdx].items.push({ id: uid(), name, price, tag, description });
        showToast('Item added successfully!');
    }

    saveMenu();
    updateDashboardStats();
    renderMenuItems();
    closeModal('item-modal');
}

function confirmDeleteItem(catIdx, itemIdx) {
    const item = menuData[catIdx].items[itemIdx];
    document.getElementById('confirm-message').textContent = `Delete "${item.name}"? This cannot be undone.`;
    pendingDeleteFn = () => {
        menuData[catIdx].items.splice(itemIdx, 1);
        saveMenu();
        updateDashboardStats();
        renderMenuItems();
        showToast('Item deleted.', 'info');
        closeModal('confirm-modal');
    };
    openModal('confirm-modal');
}

// ─── CATEGORIES ───────────────────────────────────
function openAddCategory() {
    document.getElementById('category-modal-title').textContent = 'Add Category';
    document.getElementById('category-old-name').value = '';
    document.getElementById('category-name').value = '';
    openModal('category-modal');
    document.getElementById('category-name').focus();
}

function openEditCategory(idx) {
    document.getElementById('category-modal-title').textContent = 'Rename Category';
    document.getElementById('category-old-name').value = idx;
    document.getElementById('category-name').value = menuData[idx].category;
    openModal('category-modal');
    document.getElementById('category-name').focus();
}

function saveCategory() {
    const oldIdx = document.getElementById('category-old-name').value;
    const name = document.getElementById('category-name').value.trim();
    if (!name) { showToast('Category name cannot be empty.', 'error'); return; }

    if (oldIdx === '') {
        // Add
        const exists = menuData.some(c => c.category.toLowerCase() === name.toLowerCase());
        if (exists) { showToast('Category already exists.', 'error'); return; }
        menuData.push({ category: name, items: [] });
        activeCategory = menuData.length - 1;
        showToast('Category added!');
    } else {
        // Edit
        menuData[parseInt(oldIdx)].category = name;
        showToast('Category renamed!');
    }

    saveMenu();
    updateDashboardStats();
    renderCategoryTabs();
    renderMenuItems();
    closeModal('category-modal');
}

function confirmDeleteCategory(idx) {
    const cat = menuData[idx];
    document.getElementById('confirm-message').textContent = `Delete category "${cat.category}" and all its ${cat.items.length} items? This cannot be undone.`;
    pendingDeleteFn = () => {
        menuData.splice(idx, 1);
        if (activeCategory >= menuData.length) activeCategory = Math.max(0, menuData.length - 1);
        saveMenu();
        updateDashboardStats();
        renderCategoryTabs();
        renderMenuItems();
        showToast('Category deleted.', 'info');
        closeModal('confirm-modal');
    };
    openModal('confirm-modal');
}

// ─── GALLERY ───────────────────────────────────
function renderGallery() {
    const grid = document.getElementById('gallery-grid-admin');
    grid.innerHTML = '';

    // Add card first
    const addCard = document.createElement('div');
    addCard.className = 'gallery-add-card';
    addCard.innerHTML = '<i class="fas fa-plus"></i><span>Add Image</span>';
    addCard.addEventListener('click', openGalleryModal);
    grid.appendChild(addCard);

    galleryData.forEach((img, idx) => {
        const card = document.createElement('div');
        card.className = 'gallery-admin-card';
        card.innerHTML = `
            <img src="${img.url}" alt="${img.alt}" onerror="this.src='https://placehold.co/400x300/1F2937/9CA3AF?text=Image+Error'">
            <div class="card-overlay">
                <button class="delete-gallery-btn"><i class="fas fa-trash"></i> Remove</button>
            </div>
        `;
        card.querySelector('.delete-gallery-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            confirmDeleteGallery(idx);
        });
        grid.appendChild(card);
    });
}

function openGalleryModal() {
    document.getElementById('gallery-url').value = '';
    document.getElementById('gallery-alt').value = '';
    document.getElementById('gallery-preview').classList.add('hidden');
    openModal('gallery-modal');
    document.getElementById('gallery-url').focus();
}

function previewGallery() {
    const url = document.getElementById('gallery-url').value.trim();
    if (!url) { showToast('Enter a URL first.', 'error'); return; }
    const preview = document.getElementById('gallery-preview');
    const img = document.getElementById('gallery-preview-img');
    img.src = url;
    img.onerror = () => { showToast('Could not load image from this URL.', 'error'); preview.classList.add('hidden'); };
    img.onload = () => preview.classList.remove('hidden');
}

function saveGalleryImage() {
    const url = document.getElementById('gallery-url').value.trim();
    const alt = document.getElementById('gallery-alt').value.trim() || 'Cafe Image';
    if (!url) { showToast('Please enter an image URL.', 'error'); return; }

    galleryData.push({ id: uid(), url, alt });
    saveGallery();
    updateDashboardStats();
    renderGallery();
    showToast('Image added to gallery!');
    closeModal('gallery-modal');
}

function confirmDeleteGallery(idx) {
    document.getElementById('confirm-message').textContent = 'Remove this image from the gallery?';
    pendingDeleteFn = () => {
        galleryData.splice(idx, 1);
        saveGallery();
        updateDashboardStats();
        renderGallery();
        showToast('Image removed.', 'info');
        closeModal('confirm-modal');
    };
    openModal('confirm-modal');
}

// ─── EXPORT / RESET ───────────────────────────────────
function exportData() {
    const data = {
        menu: menuData,
        gallery: galleryData,
        exported: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roys-cafe-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!');
}

function resetToDefaults() {
    document.getElementById('confirm-message').textContent = 'Reset all menu and gallery data to defaults? This cannot be undone.';
    pendingDeleteFn = () => {
        localStorage.removeItem(STORAGE_MENU_KEY);
        localStorage.removeItem(STORAGE_GALLERY_KEY);
        loadMenu();
        loadGallery();
        activeCategory = 0;
        updateDashboardStats();
        renderCategoryTabs();
        renderMenuItems();
        renderGallery();
        showToast('Reset to defaults.', 'info');
        closeModal('confirm-modal');
    };
    openModal('confirm-modal');
}

// ─── INIT ───────────────────────────────────
function initApp() {
    loadMenu();
    loadGallery();
    updateDashboardStats();
    renderCategoryTabs();
    renderMenuItems();
    renderGallery();
    initNavigation();

    // Menu section buttons
    document.getElementById('add-item-btn').addEventListener('click', openAddItem);
    document.getElementById('add-category-btn').addEventListener('click', openAddCategory);
    document.getElementById('save-item-btn').addEventListener('click', saveItem);
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);

    // Gallery buttons
    document.getElementById('preview-gallery-btn').addEventListener('click', previewGallery);
    document.getElementById('save-gallery-btn').addEventListener('click', saveGalleryImage);

    // Dashboard buttons
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('reset-btn').addEventListener('click', resetToDefaults);

    // Confirm delete
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (pendingDeleteFn) { pendingDeleteFn(); pendingDeleteFn = null; }
    });

    // Close modals via data-close
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
    });

    // ESC to close modals
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
        }
    });
}

// ─── BOOTSTRAP ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});
