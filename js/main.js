document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavbar();
    initScrollReveal();
    initCursorSpotlight();
    fetchMenu();
    renderGallery();
});

function initLoader() {
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('cleared');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 2100);
        }, 800);
    });
}

function initCursorSpotlight() {
    const spotlight = document.createElement('div');
    spotlight.className = 'cursor-spotlight';
    document.body.appendChild(spotlight);

    window.addEventListener('mousemove', (e) => {
        spotlight.style.left = `${e.clientX}px`;
        spotlight.style.top = `${e.clientY}px`;
    });
}

function initNavbar() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });
}

function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => observer.observe(el));
}

async function fetchMenu() {
    try {
        if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            const { createClient } = window.supabase;
            const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const { data: categories, error: catErr } = await sb
                .from('categories').select('*').order('display_order').order('created_at');
            if (catErr) throw catErr;

            const { data: items, error: itemErr } = await sb
                .from('menu_items').select('*').order('display_order').order('created_at');
            if (itemErr) throw itemErr;

            const menuData = (categories || []).map(cat => ({
                category: cat.name,
                items: (items || []).filter(i => i.category_id === cat.id).map(i => ({
                    name: i.name,
                    description: i.description,
                    price: i.price,
                    tag: i.tag,
                    image_url: i.image_url
                }))
            }));
            renderMenu(menuData);
            return;
        }
        // Fallback to static JSON
        const response = await fetch('data/menu.json');
        if (!response.ok) throw new Error('Menu data unavailable');
        renderMenu(await response.json());
    } catch (error) {
        console.error('Menu error:', error);
        document.getElementById('menu-container').innerHTML =
            '<div class="text-center" style="color:var(--color-text-muted);padding:40px 0;">Our kitchen is currently updating. Please check back shortly.</div>';
    }
}

async function renderGallery() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;
    try {
        if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            const { createClient } = window.supabase;
            const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: images, error } = await sb
                .from('gallery_images').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (images && images.length > 0) {
                grid.innerHTML = '';
                images.forEach(img => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    div.innerHTML = `<img src="${img.url}" alt="${img.alt}" loading="lazy" onerror="this.parentElement.remove()">`;
                    grid.appendChild(div);
                });
            }
        }
    } catch (error) {
        console.warn('Gallery fetch error (using static):', error);
    }
}

function renderMenu(data) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    data.forEach((category, catIndex) => {
        if (!category.items || category.items.length === 0) return;

        const categorySection = document.createElement('div');
        categorySection.className = 'menu-category mb-6';

        // Category title with underline accent
        const title = document.createElement('h3');
        title.textContent = category.category;
        title.className = 'menu-category-title';

        const itemsGrid = document.createElement('div');
        itemsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;';

        category.items.forEach((item, itemIndex) => {
            const card = document.createElement('div');
            card.className = 'menu-card reveal';
            card.style.transitionDelay = `${(catIndex * 80) + (itemIndex * 40)}ms`;

            const imageHtml = item.image_url
                ? `<div class="menu-card-img"><img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`
                : '';

            const tagHtml = item.tag
                ? `<div><span class="menu-item-tag">${item.tag}</span></div>`
                : '';

            card.innerHTML = `
                ${imageHtml}
                <div class="menu-card-body">
                    <div class="menu-item-header">
                        <h4 class="menu-item-name">${item.name}</h4>
                        <span class="menu-item-price">${item.price}</span>
                    </div>
                    <p class="menu-item-desc">${item.description}</p>
                    ${tagHtml}
                </div>
            `;
            itemsGrid.appendChild(card);
        });

        categorySection.appendChild(title);
        categorySection.appendChild(itemsGrid);
        container.appendChild(categorySection);
    });

    // Re-run scroll reveal for newly added menu cards
    initScrollReveal();
}
