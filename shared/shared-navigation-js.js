// VERV ONE - Shared Navigation and Site Functionality
// This file contains all shared JavaScript functionality across pages

// Global variables
const PROPERTY_IDS = ['86043159', '86080781', '86074105', '86042025', '86043064', '86043140'];
const PROPERTY_TYPE_MAP = {
    1: 'Apartment', 2: 'House', 3: 'Plot', 4: 'Commercial', 5: 'Office',
    6: 'Villa', 7: 'Townhouse', 8: 'Penthouse', 9: 'Studio', 10: 'Duplex',
    11: 'Loft', 12: 'Chalet', 13: 'Country House', 14: 'Castle', 15: 'Manor',
    16: 'Farm', 17: 'Industrial', 18: 'Warehouse', 19: 'Shop', 20: 'Restaurant'
};
const TRANSACTION_TYPE_MAP = {
    1: 'For Sale', 2: 'For Rent', 3: 'Sold', 4: 'Rented'
};
const SPANISH_LOCATIONS = [
    'Barcelona', 'Sitges', 'Castelldefels', 'Gavá', 'Sant Pere de Ribes', 'Girona'
];

let allProperties = [];

// Page initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('VERV ONE navigation loaded');
    
    initNavigation();
    initConsultationModal();
    initWeglot();
    updateActiveNavigation();
    
    // Load properties for property-related pages
    if (window.location.pathname.includes('/properties/') || window.location.pathname === '/') {
        initProperties();
    }
    
    console.log('VERV ONE initialization complete');
});

// Navigation functionality
function initNavigation() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            // Update button text
            this.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });
    }
    
    // Close mobile menu on window resize
    window.addEventListener('resize', function() {
        if (navMenu && window.innerWidth > 768) {
            navMenu.classList.remove('active');
            // Reset button text
            if (mobileMenuToggle) {
                mobileMenuToggle.textContent = '☰';
            }
        }
    });
    
    // Close mobile menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) {
                navMenu.classList.remove('active');
                // Reset button text
                if (mobileMenuToggle) {
                    mobileMenuToggle.textContent = '☰';
                }
            }
        });
    });
    
    // Header scroll behavior
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header-nav');
        if (!header) return;
        
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScroll > lastScrollTop && currentScroll > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });
}

// Update active navigation based on current page
function updateActiveNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (href === currentPath || 
            (currentPath === '/' && href === '/') ||
            (currentPath.includes('/about/') && href === '/about/') ||
            (currentPath.includes('/how-we-work/') && href === '/how-we-work/') ||
            (currentPath.includes('/properties/') && href === '/properties/') ||
            (currentPath.includes('/projects/') && href === '/projects/') ||
            (currentPath.includes('/contact/') && href === '/contact/')) {
            link.classList.add('active');
        }
    });
}

// Consultation Modal functionality
function initConsultationModal() {
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        consultationForm.addEventListener('submit', handleConsultationSubmit);
    }
    
    // Add escape key listener for consultation modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeConsultationModal();
        }
    });
}

function openConsultationModal() {
    const modal = document.getElementById('consultationModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Track consultation modal opening
        if (typeof gtag !== 'undefined') {
            gtag('event', 'consultation_modal_opened', {
                event_category: 'engagement',
                event_label: 'consultation_form'
            });
        }
    }
}

function closeConsultationModal() {
    const modal = document.getElementById('consultationModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function handleConsultationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const consultationData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        country: formData.get('country'),
        interest: formData.get('interest'),
        location: formData.get('location'),
        budget: formData.get('budget'),
        preferredTime: formData.get('preferredTime'),
        message: formData.get('message'),
        formType: 'consultation'
    };
    
    console.log('Consultation form submitted:', consultationData);
    
    // Track consultation submission
    if (typeof gtag !== 'undefined') {
        gtag('event', 'consultation_form_submitted', {
            event_category: 'conversion',
            event_label: 'consultation_request'
        });
        
        // Track contact submission
        if (typeof trackContactSubmission !== 'undefined') {
            trackContactSubmission('consultation');
        }
    }
    
    // Send to Formspree (same as property details page)
    fetch('https://formspree.io/f/xgveqbqk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...consultationData,
            _subject: `Consultation Request: ${consultationData.interest || 'General Consultation'}`,
            _cc: 'ronei@verv.one'
        })
    }).then(response => {
        if (response.ok) {
            alert('Thank you for your consultation request! We will contact you within 24 hours to schedule your personalized consultation.');
        } else {
            alert('There was an error sending your request. Please try again or contact us directly.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('There was an error sending your request. Please try again or contact us directly.');
    });
    
    // Close modal and reset form
    closeConsultationModal();
    e.target.reset();
}

// Weglot initialization
function initWeglot() {
    function initializeWeglot() {
        try {
            if (typeof Weglot !== 'undefined') {
                console.log('Weglot initialized successfully');
                Weglot.initialize({
                    api_key: 'wg_eecebd448eae266139b949ca538854046',
                    originalLanguage: 'en',
                    destinationLanguages: 'es,ca,fr,de',
                    translateSearch: true,
                    cache: true,
                    switchers: [{
                        styleOpt: {
                            fullname: false,
                            withname: false,
                            is_dropdown: true,
                            with_flags: true,
                            flag_type: 'rectangle',
                            invert_flags: false
                        },
                        location: {
                            target: '#weglot-container',
                            sibling: null
                        }
                    }]
                });
                
                // Force show flags if they're not visible
                setTimeout(() => {
                    const weglotFlags = document.querySelectorAll('.wg-icon');
                    weglotFlags.forEach(flag => {
                        flag.style.display = 'inline-block';
                        flag.style.visibility = 'visible';
                        flag.style.opacity = '1';
                    });
                }, 500);
                
                return true;
            } else {
                console.log('Weglot not yet available');
                return false;
            }
        } catch (error) {
            console.log('Weglot initialization error:', error);
            return false;
        }
    }

    // Try to initialize Weglot with retries
    let weglotAttempts = 0;
    const maxWeglotAttempts = 5;
    
    function tryInitializeWeglot() {
        if (initializeWeglot()) {
            return; // Success
        }
        
        weglotAttempts++;
        if (weglotAttempts < maxWeglotAttempts) {
            setTimeout(tryInitializeWeglot, 1000);
        } else {
            console.log('Weglot initialization failed after', maxWeglotAttempts, 'attempts');
        }
    }
    
    // Start Weglot initialization
    tryInitializeWeglot();
    
    // Fallback: Hide weglot container if it fails to load properly after 10 seconds
    setTimeout(() => {
        const weglotContainer = document.getElementById('weglot-container');
        if (weglotContainer && !weglotContainer.querySelector('.wg-dropdown')) {
            console.log('Weglot failed to load properly, hiding container');
            weglotContainer.style.display = 'none';
        }
    }, 10000);
}

// Properties functionality
async function initProperties() {
    try {
        allProperties = await fetchPropertiesFromAPI();
        
        // Initialize properties for specific pages
        if (window.location.pathname === '/') {
            displayFeaturedProperties(allProperties);
        } else if (window.location.pathname.includes('/properties/')) {
            displayAllProperties(allProperties);
        }
    } catch (error) {
        console.error('Failed to load properties:', error);
        displayPropertiesError();
    }
}

async function fetchPropertiesFromAPI() {
    try {
        // Updated to use the same API endpoint as the property details page
        const response = await fetch(`https://verv.one/.netlify/functions/properties?limit=50&cache_bust=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.properties) {
            return data.properties;
        } else if (data.data && Array.isArray(data.data)) {
            return data.data;
        } else if (Array.isArray(data)) {
            return data;
        } else if (data.results && Array.isArray(data.results)) {
            return data.results;
        }
        
        throw new Error('No properties found in API response');
        
    } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
    }
}

function displayFeaturedProperties(properties) {
    const grid = document.getElementById('propertiesGrid');
    if (!grid) return;
    
    const featuredProperties = PROPERTY_IDS.map(id => {
        return properties.find(p => String(p.id) === String(id));
    }).filter(Boolean);
    
    if (featuredProperties.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem; grid-column: 1 / -1;">Featured properties will be displayed here shortly.</p>';
        return;
    }
    
    grid.innerHTML = featuredProperties.map(property => createPropertyCard(property)).join('');
}

function displayAllProperties(properties) {
    const grid = document.getElementById('allPropertiesGrid');
    if (!grid || properties.length === 0) return;
    
    const propertiesToShow = properties.slice(0, 12);
    grid.innerHTML = propertiesToShow.map(property => createPropertyCard(property)).join('');
}

function displayPropertiesError() {
    const grid = document.getElementById('propertiesGrid') || document.getElementById('allPropertiesGrid');
    if (grid) {
        grid.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.2rem; grid-column: 1 / -1;">Featured properties will be displayed here shortly.</p>';
    }
}

// Helper functions for properties
function extractPropertyType(property) {
    if (property.type && typeof property.type === 'number') {
        return PROPERTY_TYPE_MAP[property.type] || 'Property';
    }
    if (property.step_code && typeof property.step_code === 'number') {
        return TRANSACTION_TYPE_MAP[property.step_code] || 'Property';
    }
    if (property.subtype && property.subtype.name) {
        return property.subtype.name;
    }
    return 'Property';
}

function extractCityName(property) {
    if (property.city && property.city.name) return property.city.name;
    if (property.zipcode && property.zipcode.name) return property.zipcode.name;
    if (property.district && property.district.name) return property.district.name;
    return 'Premium Location';
}

function extractEnglishComments(property) {
    if (!property.comments || !Array.isArray(property.comments)) {
        return { title: null, description: null };
    }
    
    const englishComment = property.comments.find(comment => 
        comment.language === 'en' || comment.language === 'EN'
    );
    
    if (englishComment) {
        return {
            title: englishComment.title || null,
            description: englishComment.comment || null
        };
    }
    
    const firstComment = property.comments[0];
    return {
        title: firstComment?.title || null,
        description: firstComment?.comment || null
    };
}

function formatPrice(priceData) {
    if (!priceData) return 'Price on Request';
    
    let amount = 0;
    
    if (typeof priceData === 'number') {
        amount = priceData;
    } else if (typeof priceData === 'object') {
        amount = priceData.value || priceData.amount || priceData.price || 0;
    }
    
    if (!amount || amount === 0) return 'Price on Request';
    
    return `€${amount.toLocaleString('en-US')}`;
}

function getMainImageUrl(images) {
    if (!images || images.length === 0) {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f5f5f5"/><text x="200" y="150" text-anchor="middle" fill="%23999" font-family="Arial" font-size="18">Property Image</text></svg>';
    }
    
    const mainImage = images[0];
    if (typeof mainImage === 'string') return mainImage;
    return mainImage.url || mainImage.src || mainImage.link || mainImage.image_url || mainImage;
}

function createPropertyCard(property) {
    const englishComments = extractEnglishComments(property);
    const title = englishComments.title || property.title || 'Luxury Property';
    const location = extractCityName(property);
    const price = formatPrice(property.price);
    const type = extractPropertyType(property);
    const imageUrl = getMainImageUrl(property.pictures || property.images || []);
    
    // Determine the correct property details page URL
    let propertyUrl = '/properties/property-details.html?id=' + property.id;
    
    // If we're on a different domain structure, adapt accordingly
    if (window.location.pathname.includes('/single-property/')) {
        propertyUrl = '/single-property/?id=' + property.id;
    }
    
    return `
        <div class="property-card" onclick="window.open('${propertyUrl}', '_blank')">
            <div class="property-badge">${type}</div>
            <img src="${imageUrl}" alt="${title}" class="property-image" loading="lazy">
            <div class="property-info">
                <h3 class="property-title">${title}</h3>
                <div class="property-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${location}
                </div>
                <div class="property-price">${price}</div>
                <div class="property-features">
                    ${property.bedrooms ? `<div class="property-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M2 4v16h20V4H2zM7 14h10v4H7v-4z"/>
                        </svg>
                        ${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}
                    </div>` : ''}
                    ${property.bathrooms ? `<div class="property-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M14 4V2a1 1 0 00-1-1h-2a1 1 0 00-1 1v2H4v16h16V4h-6z"/>
                        </svg>
                        ${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}
                    </div>` : ''}
                    ${property.surface ? `<div class="property-feature">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <path d="M9 9h6v6H9z"/>
                        </svg>
                        ${property.surface}m²
                    </div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Search functionality
function initHeroSearch() {
    initAutocomplete();
    
    const searchForm = document.getElementById('vervPropertySearch');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    const saleRentSelect = document.getElementById('vervSaleRent');
    const budgetSelect = document.getElementById('vervBudget');
    
    if (saleRentSelect && budgetSelect) {
        saleRentSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            
            if (selectedValue === 'rent') {
                budgetSelect.innerHTML = `
                    <option value="">Any Budget</option>
                    <option value="rent-0-2000">Up to €2K/month</option>
                    <option value="rent-2000-5000">€2K - €5K/month</option>
                    <option value="rent-5000-plus">€5K+/month</option>
                `;
            } else {
                budgetSelect.innerHTML = `
                    <option value="">Any Budget</option>
                    <option value="500k-1m">€500K - €1M</option>
                    <option value="1m-2m">€1M - €2M</option>
                    <option value="2m-5m">€2M - €5M</option>
                    <option value="5m-plus">€5M+</option>
                `;
            }
        });
    }
}

function initAutocomplete() {
    const locationInput = document.getElementById('vervLocationInput');
    if (locationInput) {
        const datalist = document.createElement('datalist');
        datalist.id = 'vervCitiesList';
        
        SPANISH_LOCATIONS.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            datalist.appendChild(option);
        });
        
        locationInput.setAttribute('list', 'vervCitiesList');
        locationInput.parentNode.appendChild(datalist);
    }
}

function handleSearch(e) {
    e.preventDefault();
    console.log('Search submitted');
    
    const formData = new FormData(e.target);
    const searchParams = {
        saleRent: formData.get('sale-rent'),
        location: formData.get('location'),
        budget: formData.get('budget')
    };
    
    console.log('Search parameters:', searchParams);
    
    // Build search URL
    let searchUrl = '/properties/';
    const urlParams = new URLSearchParams();
    
    if (searchParams.saleRent && searchParams.saleRent !== '') {
        urlParams.append('type', searchParams.saleRent);
    }
    
    if (searchParams.location && searchParams.location.trim() !== '') {
        urlParams.append('location', searchParams.location.trim());
    }
    
    if (searchParams.budget && searchParams.budget !== '') {
        urlParams.append('budget', searchParams.budget);
    }
    
    if (urlParams.toString()) {
        searchUrl += '?' + urlParams.toString();
    }
    
    console.log('Navigating to search URL:', searchUrl);
    window.location.href = searchUrl;
}

function openFilteredProperties(location) {
    const searchUrl = `/properties/?location=${encodeURIComponent(location)}`;
    window.location.href = searchUrl;
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const contactData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        interest: formData.get('interest'),
        location: formData.get('location'),
        budget: formData.get('budget'),
        message: formData.get('message'),
        formType: 'contact'
    };
    
    console.log('Contact form submitted:', contactData);
    
    // Track contact submission
    if (typeof gtag !== 'undefined') {
        gtag('event', 'contact_form_submitted', {
            event_category: 'conversion',
            event_label: 'contact_request'
        });
        
        if (typeof trackContactSubmission !== 'undefined') {
            trackContactSubmission('contact');
        }
    }
    
    // Send to Formspree (same as other forms)
    fetch('https://formspree.io/f/xgveqbqk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...contactData,
            _subject: `Contact Form: ${contactData.interest || 'General Inquiry'}`,
            _cc: 'ronei@verv.one'
        })
    }).then(response => {
        if (response.ok) {
            alert('Thank you for your message! We will get back to you soon.');
            e.target.reset();
        } else {
            alert('There was an error sending your message. Please try again or contact us directly.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('There was an error sending your message. Please try again or contact us directly.');
    });
}

// Animations
function initFadeInAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Utility functions
function hideDuplicateFooters() {
    // Hide any Squarespace default footers
    const duplicateFooters = document.querySelectorAll('.Footer, .site-footer, .sqs-footer, .footer-sections, [data-section-id*="footer"]:not(.footer), .sqs-site-footer');
    duplicateFooters.forEach(footer => {
        if (!footer.classList.contains('footer')) {
            footer.style.display = 'none';
            footer.style.visibility = 'hidden';
            footer.style.height = '0';
            footer.style.overflow = 'hidden';
        }
    });
    
    // Ensure our custom footer is visible
    const customFooter = document.querySelector('footer.footer');
    if (customFooter) {
        customFooter.style.display = 'block';
        customFooter.style.visibility = 'visible';
    }
    
    console.log('Duplicate footers hidden');
}

// SEO utility function
function updateSEO(pageData) {
    if (pageData.title) {
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) titleElement.textContent = pageData.title;
        document.title = pageData.title;
    }
    if (pageData.description) {
        const descElement = document.getElementById('pageDescription');
        if (descElement) descElement.content = pageData.description;
    }
    if (pageData.url) {
        const ogUrlElement = document.getElementById('ogUrl');
        const twitterUrlElement = document.getElementById('twitterUrl');
        const canonicalElement = document.getElementById('canonicalUrl');
        
        if (ogUrlElement) ogUrlElement.content = pageData.url;
        if (twitterUrlElement) twitterUrlElement.content = pageData.url;
        if (canonicalElement) canonicalElement.href = pageData.url;
    }
    if (pageData.title) {
        const ogTitleElement = document.getElementById('ogTitle');
        const twitterTitleElement = document.getElementById('twitterTitle');
        
        if (ogTitleElement) ogTitleElement.content = pageData.title;
        if (twitterTitleElement) twitterTitleElement.content = pageData.title;
    }
    if (pageData.description) {
        const ogDescElement = document.getElementById('ogDescription');
        const twitterDescElement = document.getElementById('twitterDescription');
        
        if (ogDescElement) ogDescElement.content = pageData.description;
        if (twitterDescElement) twitterDescElement.content = pageData.description;
    }
}

// Make functions available globally
window.openConsultationModal = openConsultationModal;
window.closeConsultationModal = closeConsultationModal;
window.openFilteredProperties = openFilteredProperties;
window.initHeroSearch = initHeroSearch;
window.initContactForm = initContactForm;
window.initFadeInAnimations = initFadeInAnimations;
window.hideDuplicateFooters = hideDuplicateFooters;
window.updateSEO = updateSEO;
