/**
 * cinema.js — Roy's Cafe  
 * Scroll-pinned cinematic storytelling engine.
 * Drives 4 scenes as user scrolls through a 500vh track.
 */
(function () {
    'use strict';

    const track = document.getElementById('cinema-track');
    const panels = Array.from(document.querySelectorAll('.cpanel'));
    const bgs = Array.from(document.querySelectorAll('.cbg'));
    const pips = Array.from(document.querySelectorAll('.cpip'));
    const overlay = document.getElementById('cinema-overlay');
    const cue = document.getElementById('cinema-cue');

    if (!track || !panels.length) return;

    const N = panels.length; // 4 scenes

    // Per-scene colour overlays
    const OVERLAYS = [
        'linear-gradient(150deg, rgba(18,48,38,.78) 0%, rgba(0,0,0,.48) 100%)',  // 01 – teal
        'linear-gradient(150deg, rgba(52,34,14,.75) 0%, rgba(0,0,0,.48) 100%)',  // 02 – amber
        'linear-gradient(150deg, rgba(14,26,48,.75) 0%, rgba(0,0,0,.48) 100%)',  // 03 – blue
        'linear-gradient(150deg, rgba(48,28,14,.75) 0%, rgba(0,0,0,.48) 100%)',  // 04 – gold
    ];

    let current = -1;
    let ticking = false;

    /* ── Compute 0-1 progress within the pinned track ── */
    function getProgress() {
        const rect = track.getBoundingClientRect();
        const total = track.offsetHeight - window.innerHeight;
        return Math.max(0, Math.min(1, -rect.top / total));
    }

    /* ── Switch to a new scene ── */
    function goTo(idx) {
        if (idx === current) return;
        const prev = current;
        current = idx;

        panels.forEach((p, i) => {
            p.classList.remove('cp-in', 'cp-out');
            if (i === idx) {
                p.classList.add('cp-in');
            } else if (i === prev) {
                p.classList.add('cp-out');
                // clean up after exit animation
                setTimeout(() => p.classList.remove('cp-out'), 600);
            }
        });

        bgs.forEach((bg, i) => {
            bg.classList.remove('cbg-on', 'cbg-off');
            if (i === idx) {
                // restart Ken Burns by forcing a reflow
                void bg.offsetWidth;
                bg.classList.add('cbg-on');
            } else if (i === prev) {
                bg.classList.add('cbg-off');
                setTimeout(() => bg.classList.remove('cbg-off'), 1200);
            }
        });

        if (overlay) overlay.style.background = OVERLAYS[idx];

        pips.forEach((pip, i) => pip.classList.toggle('active', i === idx));
    }

    /* ── Main update loop ── */
    function update() {
        ticking = false;
        const p = getProgress();
        const idx = Math.min(N - 1, Math.floor(p * N));

        goTo(idx);

        if (cue) cue.classList.toggle('hidden', p > 0.04);
    }

    /* ── Throttle via rAF ── */
    function onScroll() {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    /* ── Init: show scene 0 when section first enters viewport ── */
    const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) { update(); io.disconnect(); }
    }, { threshold: 0.01 });
    io.observe(track);

    // also run once immediately in case section is already visible
    update();

})();
