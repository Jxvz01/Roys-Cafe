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

    // We use window.onload to ensure all images and assets are actually ready
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('cleared');

            // Remove from DOM after fog clears (matches CSS transition 2s)
            setTimeout(() => {
                loader.style.display = 'none';
            }, 2100);
        }, 800); // Small initial delay to show the logo
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
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
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
        // Try Supabase first if configured
        if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            const { createClient } = window.supabase;
            const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: categories, error: catErr } = await sb.from('categories').select('*').order('display_order').order('created_at');
            if (catErr) throw catErr;
            const { data: items, error: itemErr } = await sb.from('menu_items').select('*').order('display_order').order('created_at');
            if (itemErr) throw itemErr;
            const menuData = (categories || []).map(cat => ({
                category: cat.name,
                items: (items || []).filter(i => i.category_id === cat.id).map(i => ({
                    name: i.name, description: i.description,
                    price: i.price, tag: i.tag, image_url: i.image_url
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
            '<div class="text-center">Our kitchen is currently updating. Please check back shortly.</div>';
    }
}

async function renderGallery() {
    const grid = document.querySelector('.gallery-grid');
    if (!grid) return;
    try {
        // Try Supabase first if configured
        if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
            const { createClient } = window.supabase;
            const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const { data: images, error } = await sb.from('gallery_images').select('*').order('created_at', { ascending: false });
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
        // If not configured, keep the static HTML gallery
    } catch (error) {
        console.warn('Gallery fetch error (using static):', error);
    }
}

function renderMenu(data) {
    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    data.forEach((category, catIndex) => {
        const categorySection = document.createElement('div');
        categorySection.className = 'menu-category mb-6';

        const title = document.createElement('h3');
        title.textContent = category.category;
        title.className = 'text-center mb-4';
        title.style.color = 'var(--color-secondary)';
        title.style.fontSize = '1.8rem';

        const itemsGrid = document.createElement('div');
        itemsGrid.style.display = 'grid';
        itemsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        itemsGrid.style.gap = '24px';

        category.items.forEach((item, itemIndex) => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            // Staggered reveal effect for items
            card.style.transitionDelay = `${(catIndex * 100) + (itemIndex * 50)}ms`;

            let tagHtml = '';
            if (item.tag) {
                tagHtml = `<span style="display: inline-block; background-color: var(--color-support-sage, #7C9A6D); color: white; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 600; margin-top: 12px;">${item.tag}</span>`;
            }

            card.innerHTML = `
                <div class="menu-item-header">
                    <h4 class="menu-item-name">${item.name}</h4>
                    <span class="menu-item-price">${item.price}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
                ${tagHtml}
            `;
            itemsGrid.appendChild(card);
        });

        categorySection.appendChild(title);
        categorySection.appendChild(itemsGrid);
        container.appendChild(categorySection);
    });
}
