// --- 1. Component Loader ---
async function loadComponents() {
    try {
        // Load Nav
        const navRes = await fetch('components/nav.html');
        document.getElementById('nav-placeholder').innerHTML = await navRes.text();
        
        // Load Footer
        const footerRes = await fetch('components/footer.html');
        document.getElementById('footer-placeholder').innerHTML = await footerRes.text();

        // Initialize features after DOM is injected
        initNavigation();
        applyLanguage(currentLang);
    } catch (error) {
        console.error("Error loading components. (Note: Fetch requires a local server like VS Code Live Server to work locally).", error);
    }
}

// --- 2. Navigation & Mobile Menu Logic ---
let isMenuOpen = false;

function initNavigation() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileIcon = document.getElementById('mobile-icon');
    const nav = document.getElementById('main-nav');
    const logoText = document.getElementById('logo-text');
    const navLinks = document.getElementById('nav-links');

    // Set Active Link based on current URL
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('text-brand-gold', 'after:w-full');
            link.classList.remove('hover:text-brand-gold', 'after:w-0');
        }
    });

    // Mobile Hamburger Toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('pointer-events-none', 'opacity-0');
                mobileMenu.classList.add('opacity-100');
                mobileIcon.classList.remove('fa-bars');
                mobileIcon.classList.add('fa-times');
                nav.classList.add('bg-brand-dark');
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenu.classList.add('pointer-events-none', 'opacity-0');
                mobileMenu.classList.remove('opacity-100');
                mobileIcon.classList.remove('fa-times');
                mobileIcon.classList.add('fa-bars');
                nav.classList.remove('bg-brand-dark');
                document.body.style.overflow = '';
            }
        });
    }

    // Scroll Effect (Blur & Solidify)
    window.addEventListener('scroll', () => {
        if (isMenuOpen) return;
        if (window.scrollY > 50) {
            nav.classList.add('bg-brand-cream/95', 'backdrop-blur-md', 'py-4', 'shadow-sm', 'border-transparent');
            nav.classList.remove('py-8', 'border-white/10', 'bg-gradient-to-b', 'from-brand-dark/70', 'to-transparent');
            logoText.classList.replace('text-white', 'text-brand-dark');
            navLinks.classList.replace('text-white', 'text-brand-dark');
            mobileToggle.classList.replace('text-white', 'text-brand-dark');
        } else {
            nav.classList.remove('bg-brand-cream/95', 'backdrop-blur-md', 'shadow-sm', 'border-transparent');
            nav.classList.add('py-8', 'border-white/10', 'bg-gradient-to-b', 'from-brand-dark/70', 'to-transparent');
            logoText.classList.replace('text-brand-dark', 'text-white');
            navLinks.classList.replace('text-brand-dark', 'text-white');
            mobileToggle.classList.replace('text-brand-dark', 'text-white');
        }
    });
}

// --- 3. Language Toggle ---
let currentLang = 'fr';

function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
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
        if (translation) el.innerText = translation;
    });

    if (typeof fpIn !== 'undefined') fpIn.set("locale", lang);
    if (typeof fpOut !== 'undefined') fpOut.set("locale", lang);
}

// --- 4. Flatpickr Booking Engine (Only initialize if dates exist on page) ---
let fpIn, fpOut;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('date_deb')) {
        fpIn = flatpickr("#date_deb", {
            locale: "fr",
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
            locale: "fr",
            dateFormat: "d/m/Y",
            minDate: "today",
            disableMobile: "true"
        });

        document.getElementById('submit-booking').addEventListener('click', function(e) {
            e.preventDefault();
            const checkIn = document.getElementById('date_deb').value;
            const checkOut = document.getElementById('date_dep').value;
            const langParam = currentLang === 'fr' ? 'francais' : 'anglais';
            let url = `https://www.secure-direct-hotel-booking.com/module_booking_engine/index.php?id_etab=8ffd3c41ad9373babc9fa6b9957e6788&langue=${langParam}`;
            if (checkIn) url += `&date_deb=${checkIn}`;
            if (checkOut) url += `&date_dep=${checkOut}`;
            window.open(url, '_blank');
        });
    }
    
    // Initial Reveal Trigger
    reveal(); 
});

// --- 5. Scroll Reveal Elements ---
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);

// Start Execution
loadComponents();

// Function to handle booking redirects with dates and category IDs
function openBooking(categoryId = null) {
    const langParam = currentLang === 'fr' ? 'francais' : 'anglais';
    const etabID = "8ffd3c41ad9373babc9fa6b9957e6788";
    
    // 1. Grab dates from the Hotel Page inputs
    const dateIn = document.getElementById('date_deb').value;
    const dateOut = document.getElementById('date_dep').value;
    
    // 2. Build the URL
    let url = `https://www.secure-direct-hotel-booking.com/module_booking_engine/index.php?id_etab=${etabID}&langue=${langParam}`;
    
    // 3. Add dates if selected
    if (dateIn && dateOut) {
        url += `&date_deb=${dateIn}&date_dep=${dateOut}`;
    }
    
    // 4. Add the specific room category ID
    if (categoryId) {
        url += `&id_categorie=${categoryId}`;
    }
    
    // 5. Open the window
    window.open(url, '_blank');
}


function startSliders() {
    const sliders = document.querySelectorAll('.room-slider');
    
    sliders.forEach(slider => {
        const images = slider.querySelectorAll('img');
        const legend = slider.querySelector('.room-legend');
        if (images.length <= 1) return;

        let current = 0;

        setInterval(() => {
            // 1. Start fading out the current legend text
            if (legend) legend.classList.add('fade-out');

            setTimeout(() => {
                // 2. Switch the image
                images[current].classList.remove('active');
                current = (current + 1) % images.length;
                images[current].classList.add('active');

                // 3. Update the legend text based on language
                if (legend) {
                    const nextCap = currentLang === 'fr' 
                        ? images[current].getAttribute('data-caption-fr') 
                        : images[current].getAttribute('data-caption-en');
                    legend.innerText = nextCap;
                    legend.classList.remove('fade-out');
                }
            }, 500); // Small delay to sync with image transition
        }, 4000); // Cycle every 4 seconds
    });
}