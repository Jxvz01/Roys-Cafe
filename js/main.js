document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavbar();
    initScrollReveal();
    initCursorSpotlight();
    fetchMenu();
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
        const response = await fetch('data/menu.json');
        if (!response.ok) throw new Error('Menu data unavailable');
        const menuData = await response.json();
        renderMenu(menuData);
    } catch (error) {
        console.error('Menu error:', error);
        document.getElementById('menu-container').innerHTML =
            '<div class="text-center p-4">Our kitchen is currently updating our fresh selection. Please check back shortly.</div>';
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
