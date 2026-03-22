// --- 1. Global State & Language Persistence ---
let currentLang = localStorage.getItem('siteLang') || 'fr';

// --- 2. Component Loader ---
async function loadComponents() {
    try {
        const navRes = await fetch('components/nav.html');
        if (navRes.ok) {
            const navHtml = await navRes.text();
            document.getElementById('nav-placeholder').innerHTML = navHtml;
        }
        
        const footerRes = await fetch('components/footer.html');
        if (footerRes.ok) {
            const footerHtml = await footerRes.text();
            document.getElementById('footer-placeholder').innerHTML = footerHtml;
        }
    } catch (error) {
        console.warn("Local testing without server might block component loading.", error);
    } finally {
        initNavigation();
        applyLanguage(currentLang); 
    }
}

// --- 3. Navigation & Mobile Menu Logic ---
let isMenuOpen = false;

function initNavigation() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileIcon = document.getElementById('mobile-icon');
    const nav = document.getElementById('main-nav');
    const logoText = document.getElementById('logo-text');
    const navLinks = document.getElementById('nav-links');

    if (!mobileToggle || !mobileMenu || !nav) return;

    // Active Link Logic
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('text-brand-gold', 'after:w-full');
            link.classList.remove('hover:text-brand-gold', 'after:w-0');
        }
    });

    function updateNavState() {
        if (isMenuOpen) {
            // Menu is open: Force dark background and white text
            nav.classList.remove('bg-brand-cream/95', 'backdrop-blur-md', 'shadow-sm', 'bg-gradient-to-b', 'from-brand-dark/70');
            nav.classList.add('bg-brand-dark');
            
            logoText?.classList.replace('text-brand-dark', 'text-white');
            navLinks?.classList.replace('text-brand-dark', 'text-white');
            mobileToggle?.classList.replace('text-brand-dark', 'text-white');
        } else {
            // Menu is closed: Check scroll position
            nav.classList.remove('bg-brand-dark');
            
            if (window.scrollY > 50) {
                // Scrolled state
                nav.classList.add('bg-brand-cream/95', 'backdrop-blur-md', 'py-4', 'shadow-sm');
                nav.classList.remove('py-8', 'bg-gradient-to-b', 'from-brand-dark/70');
                
                logoText?.classList.replace('text-white', 'text-brand-dark');
                navLinks?.classList.replace('text-white', 'text-brand-dark');
                mobileToggle?.classList.replace('text-white', 'text-brand-dark');
            } else {
                // Top of page state
                nav.classList.remove('bg-brand-cream/95', 'backdrop-blur-md', 'shadow-sm', 'py-4');
                nav.classList.add('py-8', 'bg-gradient-to-b', 'from-brand-dark/70');
                
                logoText?.classList.replace('text-brand-dark', 'text-white');
                navLinks?.classList.replace('text-brand-dark', 'text-white');
                mobileToggle?.classList.replace('text-brand-dark', 'text-white');
            }
        }
    }

    mobileToggle.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        
        // 1. TEMPORARILY DISABLE NAV TRANSITION to prevent the crossfade glitch
        nav.classList.remove('transition-all', 'duration-500');

        if (isMenuOpen) {
            mobileMenu.classList.remove('pointer-events-none', 'opacity-0');
            mobileMenu.classList.add('pointer-events-auto', 'opacity-100');
            mobileIcon.classList.replace('fa-bars', 'fa-times');
            
            // Prevent body jump when scrollbar disappears
            document.body.style.paddingRight = window.innerWidth - document.documentElement.clientWidth + 'px';
            document.body.style.overflow = 'hidden'; 
        } else {
            mobileMenu.classList.add('pointer-events-none', 'opacity-0');
            mobileMenu.classList.remove('pointer-events-auto', 'opacity-100');
            mobileIcon.classList.replace('fa-times', 'fa-bars');
            
            setTimeout(() => {
                document.body.style.overflow = ''; 
                document.body.style.paddingRight = '';
            }, 300); 
        }

        // 2. Apply the color changes instantly
        updateNavState(); 

        // 3. FORCE BROWSER REFLOW (This makes the browser register the instant color change)
        void nav.offsetWidth;

        // 4. RESTORE NAV TRANSITIONS for normal scrolling behavior
        nav.classList.add('transition-all', 'duration-500');
    });

    // Handle scroll events
    window.addEventListener('scroll', () => {
        if (!isMenuOpen) updateNavState();
    });
    
    // Set initial configuration on page load
    updateNavState();
}

// --- 4. Language Logic ---
function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('siteLang', currentLang); 
    applyLanguage(currentLang);
}

function applyLanguage(lang) {
    document.body.classList.toggle('lang-en', lang === 'en');
    
    const langLabel = document.getElementById('lang-label');
    const mobileLangLabel = document.getElementById('mobile-lang-label');
    
    if (langLabel) langLabel.innerText = lang === 'fr' ? 'EN' : 'FR';
    if (mobileLangLabel) mobileLangLabel.innerText = lang === 'fr' ? 'SWITCH TO ENGLISH' : 'PASSER EN FRANÇAIS';
    
    document.querySelectorAll('[data-fr]').forEach(el => {
        const translation = el.getAttribute(`data-${lang}`);
        if (translation) {
            if (el.tagName === 'INPUT') {
                el.placeholder = translation; // Specifically targets Flatpickr placeholders
            } else {
                el.innerHTML = translation;
            }
        }
    });

    if (typeof fpIn !== 'undefined' && fpIn.set) fpIn.set("locale", lang);
    if (typeof fpOut !== 'undefined' && fpOut.set) fpOut.set("locale", lang);
    
    document.querySelectorAll('.room-slider').forEach(slider => {
        const activeImg = slider.querySelector('img.active');
        const legend = slider.querySelector('.room-legend');
        if (activeImg && legend) {
            const cap = lang === 'fr' ? activeImg.dataset.capFr : activeImg.dataset.capEn;
            if(cap) legend.innerText = cap;
        }
    });
}

// --- 5. Flatpickr & Booking Logic ---
let fpIn, fpOut;
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);

    if (document.getElementById('date_deb')) {
        fpIn = flatpickr("#date_deb", {
            locale: currentLang,
            dateFormat: "d/m/Y",
            minDate: "today",
            disableMobile: "true",
            onChange: function(selectedDates) {
                if(selectedDates.length > 0) {
                    let minOutDate = new Date(selectedDates[0]);
                    minOutDate.setDate(minOutDate.getDate() + 1);
                    fpOut.set("minDate", minOutDate);
                    setTimeout(() => fpOut.open(), 100);
                }
            }
        });
        fpOut = flatpickr("#date_dep", {
            locale: currentLang,
            dateFormat: "d/m/Y",
            minDate: "today",
            disableMobile: "true"
        });

        const submitBtn = document.getElementById('submit-booking');
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openBooking(); 
            });
        }
    }
    reveal(); 
});

// --- 6. Global Booking Function ---
function openBooking(categoryId = null) {
    const langParam = currentLang === 'fr' ? 'francais' : 'anglais';
    const etabID = "8ffd3c41ad9373babc9fa6b9957e6788";
    
    const dateIn = document.getElementById('date_deb')?.value || "";
    const dateOut = document.getElementById('date_dep')?.value || "";
    
    let url = `https://www.secure-direct-hotel-booking.com/module_booking_engine/index.php?id_etab=${etabID}&langue=${langParam}`;
    
    if (dateIn && dateOut) {
        url += `&date_deb=${dateIn}&date_dep=${dateOut}`;
    }
    if (categoryId) {
        url += `&id_categorie=${categoryId}`;
    }
    
    window.open(url, '_blank');
}

// --- 7. Reveal on Scroll ---
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);

// --- START EXECUTION ---
loadComponents();