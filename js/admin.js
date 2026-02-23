/* =============================================
   ROY'S CAFE — ADMIN PANEL JAVASCRIPT
   Powered by Supabase
   ============================================= */

const STORAGE_BUCKET = 'cafe-images';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

let sb = null;
let categoriesData = [];
let activeCategoryId = null;
let pendingDeleteFn = null;

// Active tab in gallery modal
let galleryActiveTab = 'upload';
let selectedItemFile = null;
let selectedGalleryFile = null;

// ─── INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const { createClient } = window.supabase;
    sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    initAuth();
    initModalClose();
    initGalleryTabs();
    initFileInputs();
    initDragDrop();
});

// ─── AUTH ────────────────────────────────────
function initAuth() {
    const loginBtn = document.getElementById('login-btn');
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-pass');
    const toggleBtn = document.getElementById('toggle-pass');

    // Check existing session
    sb.auth.getSession().then(({ data: { session } }) => {
        if (session) showApp();
    });

    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const pass = passInput.value;
        if (!email || !pass) { showLoginError('Please enter your email and password.'); return; }

        setLoginLoading(true);
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        setLoginLoading(false);

        if (error) { showLoginError(error.message); }
        else { showApp(); }
    });

    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn.click(); });
    emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus(); });

    toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        toggleBtn.innerHTML = `<i class="fas fa-${isPass ? 'eye-slash' : 'eye'}"></i>`;
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await sb.auth.signOut();
        document.getElementById('admin-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    });
}

function setLoginLoading(on) {
    const btn = document.getElementById('login-btn');
    btn.disabled = on;
    btn.innerHTML = on
        ? '<i class="fas fa-spinner fa-spin"></i> Signing in...'
        : '<i class="fas fa-sign-in-alt"></i> Sign In';
}

function showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    initNavigation();
    loadDashboard();
    loadMenuSection();
    loadGallerySection();
    document.getElementById('add-category-btn').addEventListener('click', openAddCategory);
    document.getElementById('add-item-btn').addEventListener('click', openAddItem);
    document.getElementById('save-item-btn').addEventListener('click', saveItem);
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);
    document.getElementById('save-gallery-btn').addEventListener('click', saveGalleryImage);
    document.getElementById('preview-url-btn').addEventListener('click', previewGalleryUrl);
    document.getElementById('confirm-delete-btn').addEventListener('click', () => {
        if (pendingDeleteFn) { pendingDeleteFn(); pendingDeleteFn = null; }
    });
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await sb.auth.signOut();
        location.reload();
    });
}

// ─── NAVIGATION ─────────────────────────────
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const section = item.dataset.section;
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${section}`).classList.add('active');
            document.getElementById('page-title').textContent = item.textContent.trim();
            updateTopbarActions(section);
        });
    });
}

function updateTopbarActions(section) {
    const c = document.getElementById('topbar-actions');
    c.innerHTML = '';
    if (section === 'gallery') {
        const btn = document.createElement('button');
        btn.className = 'btn-admin-primary';
        btn.innerHTML = '<i class="fas fa-plus"></i> Add Image';
        btn.addEventListener('click', openGalleryModal);
        c.appendChild(btn);
    }
}

// ─── DASHBOARD ──────────────────────────────
async function loadDashboard() {
    const [{ count: cats }, { count: items }, { count: imgs }] = await Promise.all([
        sb.from('categories').select('*', { count: 'exact', head: true }),
        sb.from('menu_items').select('*', { count: 'exact', head: true }),
        sb.from('gallery_images').select('*', { count: 'exact', head: true })
    ]);
    document.getElementById('stat-categories').textContent = cats ?? 0;
    document.getElementById('stat-items').textContent = items ?? 0;
    document.getElementById('stat-gallery').textContent = imgs ?? 0;
}

// ─── MENU — CATEGORIES ──────────────────────
async function loadMenuSection() {
    showSkeletonGrid();
    const { data, error } = await sb.from('categories').select('*').order('display_order').order('created_at');
    if (error) { showToast('Failed to load categories.', 'error'); return; }
    categoriesData = data || [];
    if (categoriesData.length > 0 && !activeCategoryId) {
        activeCategoryId = categoriesData[0].id;
    }
    renderCategoryTabs();
    renderMenuItems();
}

function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    container.innerHTML = '';
    categoriesData.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = `category-tab ${cat.id === activeCategoryId ? 'active' : ''}`;
        tab.innerHTML = `
            <span class="tab-name">${cat.name}</span>
            <span class="tab-actions">
                <button class="tab-btn edit-cat-btn" title="Rename"><i class="fas fa-pencil-alt"></i></button>
                <button class="tab-btn delete-cat-btn" title="Delete"><i class="fas fa-times"></i></button>
            </span>`;
        tab.addEventListener('click', e => {
            if (e.target.closest('.edit-cat-btn')) { openEditCategory(cat); return; }
            if (e.target.closest('.delete-cat-btn')) { confirmDeleteCategory(cat); return; }
            activeCategoryId = cat.id;
            renderCategoryTabs();
            renderMenuItems();
        });
        container.appendChild(tab);
    });
}

async function renderMenuItems() {
    const grid = document.getElementById('menu-items-grid');
    grid.innerHTML = '';
    if (!activeCategoryId) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-folder-plus"></i><p>No categories yet. Add one to get started.</p></div>';
        return;
    }
    const { data: items, error } = await sb.from('menu_items')
        .select('*')
        .eq('category_id', activeCategoryId)
        .order('display_order')
        .order('created_at');
    if (error) { showToast('Failed to load items.', 'error'); return; }
    if (!items || items.length === 0) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-mug-hot"></i><p>No items in this category. Click "Add Item".</p></div>';
        return;
    }
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            ${item.image_url ? `<div class="item-card-img"><img src="${item.image_url}" alt="${item.name}" onerror="this.parentElement.style.display='none'"></div>` : ''}
            <div class="item-card-header">
                <span class="item-card-name">${item.name}</span>
                <span class="item-card-price">${item.price}</span>
            </div>
            <p class="item-card-desc">${item.description}</p>
            ${item.tag ? `<span class="item-card-tag">${item.tag}</span>` : ''}
            <div class="item-card-actions">
                <button class="card-btn edit-item-btn"><i class="fas fa-pencil-alt"></i> Edit</button>
                <button class="card-btn delete delete-item-btn"><i class="fas fa-trash"></i> Delete</button>
            </div>`;
        card.querySelector('.edit-item-btn').addEventListener('click', () => openEditItem(item));
        card.querySelector('.delete-item-btn').addEventListener('click', () => confirmDeleteItem(item));
        grid.appendChild(card);
    });
}

// ─── MENU — ITEM CRUD ───────────────────────
function openAddItem() {
    if (!activeCategoryId) { showToast('Add a category first.', 'info'); return; }
    document.getElementById('item-modal-title').textContent = 'Add Menu Item';
    document.getElementById('item-id').value = '';
    document.getElementById('item-category-id').value = activeCategoryId;
    document.getElementById('item-existing-image').value = '';
    clearFields(['item-name', 'item-price', 'item-tag', 'item-desc']);
    clearItemImagePreview();
    openModal('item-modal');
    document.getElementById('item-name').focus();
}

function openEditItem(item) {
    document.getElementById('item-modal-title').textContent = 'Edit Menu Item';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-category-id').value = item.category_id;
    document.getElementById('item-existing-image').value = item.image_url || '';
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-tag').value = item.tag || '';
    document.getElementById('item-desc').value = item.description || '';
    clearItemImagePreview();
    if (item.image_url) {
        showItemPreview(item.image_url);
    }
    openModal('item-modal');
}

async function saveItem() {
    const id = document.getElementById('item-id').value;
    const category_id = parseInt(document.getElementById('item-category-id').value);
    const name = document.getElementById('item-name').value.trim();
    const price = document.getElementById('item-price').value.trim();
    const tag = document.getElementById('item-tag').value.trim();
    const description = document.getElementById('item-desc').value.trim();

    if (!name || !price || !description) { showToast('Fill in all required fields.', 'error'); return; }

    setSaveLoading('save-item-btn', true);
    let image_url = document.getElementById('item-existing-image').value || '';

    // Upload new image if selected
    if (selectedItemFile) {
        try {
            image_url = await uploadFile(selectedItemFile, 'menu', 'item-progress-fill', 'item-upload-status', 'item-upload-progress');
        } catch (err) {
            showToast(`Image upload failed: ${err.message}`, 'error');
            setSaveLoading('save-item-btn', false);
            return;
        }
    }

    const payload = { category_id, name, description, price, tag, image_url };
    let error;

    if (id) {
        ({ error } = await sb.from('menu_items').update(payload).eq('id', id));
        if (!error) showToast('Item updated!');
    } else {
        ({ error } = await sb.from('menu_items').insert(payload));
        if (!error) showToast('Item added!');
    }

    setSaveLoading('save-item-btn', false);
    if (error) { showToast(error.message, 'error'); return; }

    selectedItemFile = null;
    closeModal('item-modal');
    loadDashboard();
    renderMenuItems();
}

function confirmDeleteItem(item) {
    document.getElementById('confirm-message').textContent = `Delete "${item.name}"? This cannot be undone.`;
    pendingDeleteFn = async () => {
        const { error } = await sb.from('menu_items').delete().eq('id', item.id);
        if (error) { showToast(error.message, 'error'); return; }
        showToast('Item deleted.', 'info');
        closeModal('confirm-modal');
        loadDashboard();
        renderMenuItems();
    };
    openModal('confirm-modal');
}

// ─── MENU — CATEGORY CRUD ───────────────────
function openAddCategory() {
    document.getElementById('category-modal-title').textContent = 'Add Category';
    document.getElementById('category-edit-id').value = '';
    document.getElementById('category-name').value = '';
    openModal('category-modal');
    document.getElementById('category-name').focus();
}

function openEditCategory(cat) {
    document.getElementById('category-modal-title').textContent = 'Rename Category';
    document.getElementById('category-edit-id').value = cat.id;
    document.getElementById('category-name').value = cat.name;
    openModal('category-modal');
}

async function saveCategory() {
    const id = document.getElementById('category-edit-id').value;
    const name = document.getElementById('category-name').value.trim();
    if (!name) { showToast('Category name is required.', 'error'); return; }

    setSaveLoading('save-category-btn', true);
    let error;

    if (id) {
        ({ error } = await sb.from('categories').update({ name }).eq('id', id));
        if (!error) showToast('Category renamed!');
    } else {
        ({ error } = await sb.from('categories').insert({ name }));
        if (!error) showToast('Category added!');
    }

    setSaveLoading('save-category-btn', false);
    if (error) { showToast(error.message, 'error'); return; }

    closeModal('category-modal');
    await loadMenuSection();
}

function confirmDeleteCategory(cat) {
    document.getElementById('confirm-message').textContent = `Delete category "${cat.name}" and ALL its items? This cannot be undone.`;
    pendingDeleteFn = async () => {
        const { error } = await sb.from('categories').delete().eq('id', cat.id);
        if (error) { showToast(error.message, 'error'); return; }
        if (activeCategoryId === cat.id) activeCategoryId = null;
        showToast('Category deleted.', 'info');
        closeModal('confirm-modal');
        await loadMenuSection();
        loadDashboard();
    };
    openModal('confirm-modal');
}

// ─── GALLERY ────────────────────────────────
async function loadGallerySection() {
    const grid = document.getElementById('gallery-grid-admin');
    grid.innerHTML = '<div class="gallery-loading">Loading...</div>';

    const { data, error } = await sb.from('gallery_images').select('*').order('created_at', { ascending: false });
    if (error) { grid.innerHTML = ''; showToast('Failed to load gallery.', 'error'); return; }

    renderGalleryAdmin(data || []);
}

function renderGalleryAdmin(images) {
    const grid = document.getElementById('gallery-grid-admin');
    grid.innerHTML = '';

    // Add button card
    const addCard = document.createElement('div');
    addCard.className = 'gallery-add-card';
    addCard.innerHTML = '<i class="fas fa-plus"></i><span>Add Image</span>';
    addCard.addEventListener('click', openGalleryModal);
    grid.appendChild(addCard);

    images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'gallery-admin-card';
        card.innerHTML = `
            <img src="${img.url}" alt="${img.alt}" onerror="this.src='https://placehold.co/400x300/1F2937/9CA3AF?text=Error'">
            <div class="card-overlay">
                <div class="card-overlay-info">${img.alt}</div>
                <button class="del-gallery-btn"><i class="fas fa-trash"></i> Remove</button>
            </div>`;
        card.querySelector('.del-gallery-btn').addEventListener('click', () => confirmDeleteGallery(img));
        grid.appendChild(card);
    });
}

function openGalleryModal() {
    document.getElementById('gallery-url').value = '';
    document.getElementById('gallery-alt').value = '';
    document.getElementById('url-preview-wrap').classList.add('hidden');
    clearGalleryFilePreview();
    selectedGalleryFile = null;
    // Reset to upload tab
    switchGalleryTab('upload');
    openModal('gallery-modal');
}

function previewGalleryUrl() {
    const url = document.getElementById('gallery-url').value.trim();
    if (!url) { showToast('Enter a URL first.', 'error'); return; }
    const wrap = document.getElementById('url-preview-wrap');
    const img = document.getElementById('url-preview-img');
    img.src = url;
    img.onerror = () => { showToast('Could not load image.', 'error'); wrap.classList.add('hidden'); };
    img.onload = () => wrap.classList.remove('hidden');
}

async function saveGalleryImage() {
    const alt = document.getElementById('gallery-alt').value.trim() || 'Cafe Image';
    let url = '';
    let storage_path = '';

    setSaveLoading('save-gallery-btn', true);

    if (galleryActiveTab === 'upload') {
        if (!selectedGalleryFile) { showToast('Select an image file first.', 'error'); setSaveLoading('save-gallery-btn', false); return; }
        try {
            const path = await uploadFileRaw(selectedGalleryFile, 'gallery', 'gallery-progress-fill', 'gallery-upload-status', 'gallery-upload-progress');
            storage_path = path;
            const { data: { publicUrl } } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
            url = publicUrl;
        } catch (err) {
            showToast(`Upload failed: ${err.message}`, 'error');
            setSaveLoading('save-gallery-btn', false);
            return;
        }
    } else {
        url = document.getElementById('gallery-url').value.trim();
        if (!url) { showToast('Enter an image URL.', 'error'); setSaveLoading('save-gallery-btn', false); return; }
    }

    const { error } = await sb.from('gallery_images').insert({ url, alt, storage_path });
    setSaveLoading('save-gallery-btn', false);
    if (error) { showToast(error.message, 'error'); return; }

    showToast('Image added to gallery!');
    selectedGalleryFile = null;
    closeModal('gallery-modal');
    loadGallerySection();
    loadDashboard();
}

function confirmDeleteGallery(img) {
    document.getElementById('confirm-message').textContent = 'Remove this image from the gallery?';
    pendingDeleteFn = async () => {
        const { error } = await sb.from('gallery_images').delete().eq('id', img.id);
        if (error) { showToast(error.message, 'error'); return; }
        // Also delete from storage if it was an uploaded file
        if (img.storage_path) {
            await sb.storage.from(STORAGE_BUCKET).remove([img.storage_path]);
        }
        showToast('Image removed.', 'info');
        closeModal('confirm-modal');
        loadGallerySection();
        loadDashboard();
    };
    openModal('confirm-modal');
}

// ─── IMAGE UPLOAD ───────────────────────────
async function uploadFile(file, folder, progressFillId, statusId, progressWrapperId) {
    const path = await uploadFileRaw(file, folder, progressFillId, statusId, progressWrapperId);
    const { data: { publicUrl } } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return publicUrl;
}

async function uploadFileRaw(file, folder, progressFillId, statusId, progressWrapperId) {
    if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds 10MB limit.');
    const ext = file.name.split('.').pop().toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${ext}`;

    // Show progress
    document.getElementById(progressWrapperId).classList.remove('hidden');
    document.getElementById(statusId).textContent = 'Uploading...';
    simulateProgress(progressFillId, statusId);

    const { error } = await sb.storage.from(STORAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false
    });

    document.getElementById(progressWrapperId).classList.add('hidden');
    if (error) throw error;
    return path;
}

function simulateProgress(fillId, statusId) {
    let pct = 0;
    const fill = document.getElementById(fillId);
    const label = document.getElementById(statusId);
    const interval = setInterval(() => {
        pct = Math.min(pct + Math.random() * 20, 90);
        fill.style.width = pct + '%';
        label.textContent = `Uploading... ${Math.round(pct)}%`;
        if (pct >= 90) clearInterval(interval);
    }, 150);
}

// ─── FILE INPUTS (select & drag-drop) ───────
function initFileInputs() {
    // Item image
    document.getElementById('item-image-file').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (!isValidImage(file)) { showToast('Only JPG, PNG, WebP, HEIC allowed.', 'error'); return; }
        if (file.size > MAX_FILE_SIZE) { showToast('File is too large (max 10MB).', 'error'); return; }
        selectedItemFile = file;
        showItemPreview(URL.createObjectURL(file));
    });

    document.getElementById('remove-item-image').addEventListener('click', clearItemImagePreview);

    // Gallery image file
    document.getElementById('gallery-image-file').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (!isValidImage(file)) { showToast('Only JPG, PNG, WebP, HEIC allowed.', 'error'); return; }
        if (file.size > MAX_FILE_SIZE) { showToast('File is too large (max 10MB).', 'error'); return; }
        selectedGalleryFile = file;
        showGalleryFilePreview(URL.createObjectURL(file));
    });

    document.getElementById('remove-gallery-file').addEventListener('click', clearGalleryFilePreview);
}

function initDragDrop() {
    setupDropZone('item-upload-zone', file => {
        if (!isValidImage(file)) { showToast('Only JPG, PNG, WebP, HEIC allowed.', 'error'); return; }
        if (file.size > MAX_FILE_SIZE) { showToast('Max 10MB allowed.', 'error'); return; }
        selectedItemFile = file;
        showItemPreview(URL.createObjectURL(file));
    });

    setupDropZone('gallery-upload-zone', file => {
        if (!isValidImage(file)) { showToast('Only JPG, PNG, WebP, HEIC allowed.', 'error'); return; }
        if (file.size > MAX_FILE_SIZE) { showToast('Max 10MB allowed.', 'error'); return; }
        selectedGalleryFile = file;
        showGalleryFilePreview(URL.createObjectURL(file));
    });
}

function setupDropZone(zoneId, onFile) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
    });
}

function isValidImage(file) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    return allowed.includes(file.type.toLowerCase()) || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
}

function showItemPreview(src) {
    document.getElementById('item-upload-prompt').classList.add('hidden');
    const wrap = document.getElementById('item-image-preview-wrap');
    document.getElementById('item-preview-img').src = src;
    wrap.classList.remove('hidden');
}

function clearItemImagePreview() {
    selectedItemFile = null;
    document.getElementById('item-existing-image').value = '';
    document.getElementById('item-upload-prompt').classList.remove('hidden');
    document.getElementById('item-image-preview-wrap').classList.add('hidden');
    document.getElementById('item-image-file').value = '';
}

function showGalleryFilePreview(src) {
    document.getElementById('gallery-upload-prompt').classList.add('hidden');
    document.getElementById('gallery-file-preview-img').src = src;
    document.getElementById('gallery-file-preview-wrap').classList.remove('hidden');
}

function clearGalleryFilePreview() {
    selectedGalleryFile = null;
    document.getElementById('gallery-upload-prompt').classList.remove('hidden');
    document.getElementById('gallery-file-preview-wrap').classList.add('hidden');
    document.getElementById('gallery-image-file').value = '';
}

// ─── GALLERY TABS ───────────────────────────
function initGalleryTabs() {
    document.querySelectorAll('.upload-tab').forEach(tab => {
        tab.addEventListener('click', () => switchGalleryTab(tab.dataset.tab));
    });
}

function switchGalleryTab(tab) {
    galleryActiveTab = tab;
    document.querySelectorAll('.upload-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('tab-upload').classList.toggle('hidden', tab !== 'upload');
    document.getElementById('tab-url').classList.toggle('hidden', tab !== 'url');
}

// ─── MODAL HELPERS ──────────────────────────
function initModalClose() {
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
        }
    });
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ─── UTILITIES ──────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function setSaveLoading(btnId, on) {
    const btn = document.getElementById(btnId);
    btn.disabled = on;
    if (on) btn.dataset.origHtml = btn.innerHTML;
    btn.innerHTML = on ? '<i class="fas fa-spinner fa-spin"></i> Saving...' : btn.dataset.origHtml;
}

function clearFields(ids) { ids.forEach(id => { document.getElementById(id).value = ''; }); }

function showSkeletonGrid() {
    const grid = document.getElementById('menu-items-grid');
    grid.innerHTML = Array(3).fill('<div class="item-card skeleton"></div>').join('');
}
