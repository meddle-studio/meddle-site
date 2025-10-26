$(document).ready(function() {
    const $navbar = $('#primary-navigation-home');
    const $navWrapper = $('section.svh-100');
    const navbarHeight = $navbar.outerHeight();
    
    // The scroll position where the TOP of the absolutely-positioned navbar 
    // aligns with the TOP of the viewport.
    const stickyThreshold = $navWrapper.offset().top + $navWrapper.outerHeight() - navbarHeight; 

    let initialScrollPassed = false;
    let lastScrollTop = 0;

    const $links = $('#primary-navigation-home a');
    const $sections = $('section[id]');
    
    // ADJUSTED: Set the Home active threshold to a small, fixed pixel value (e.g., 200px)
    // The link will be active until the user scrolls past this point.
    const homeThreshold = 200; 
    const offsetThreshold = 50; 
    const $window = $(window);

    document.documentElement.style.setProperty('--navbar-height', `${navbarHeight}px`);

    $(window).scroll(function() {
        const currentScrollPos = $(this).scrollTop();

        // --- STICKY/HIDE LOGIC (Unchanged) ---
        if (!initialScrollPassed) {
            if (currentScrollPos >= stickyThreshold) {
                $navbar.css('position', 'fixed');
                $navbar.css('top', (0 - navbarHeight) + 'px');
                $navbar.addClass('navbar-sticky-top');
                $navbar.css('top', ''); 
                initialScrollPassed = true;
            }
        }
        
        else if (initialScrollPassed && currentScrollPos < stickyThreshold) {
            $navbar.removeClass('navbar-sticky-top');
            $navbar.removeClass('navbar-hidden');
            $navbar.css('position', 'absolute');
            $navbar.css('top', 'auto');
            $navbar.css('bottom', '0');
            initialScrollPassed = false;
        }

        if (initialScrollPassed && currentScrollPos > ($navWrapper.outerHeight() + 50)) {
            if (lastScrollTop > currentScrollPos) {
                $navbar.removeClass('navbar-hidden');
            } 
            else {
                $navbar.addClass('navbar-hidden');
            }
        }
        
        lastScrollTop = currentScrollPos;

        // --- ACTIVE LINK LOGIC ---

        // Check 1: If scrollPos is less than the new, small homeThreshold (e.g., 200px), 
        // keep the Home link active. This replaces the check for the entire section height.
        if (currentScrollPos < homeThreshold) {
            $links.removeClass('active');
            $links.first().addClass('active');
            history.replaceState(null, null, $links.first().attr('href'));
            return;
        }
        
        // Check 2: Track all subsequent sections
        $sections.each(function() {
            const $currentSection = $(this);
            
            // We can remove the check for the first section ID here, 
            // as the homeThreshold check already handles the very top area.

            const sectionTop = $currentSection.offset().top - offsetThreshold;
            const sectionBottom = sectionTop + $currentSection.outerHeight();
            const sectionId = '#' + $currentSection.attr('id');

            if (currentScrollPos >= sectionTop && currentScrollPos < sectionBottom) {
                $links.removeClass('active'); 
                $links.filter(`[href="${sectionId}"]`).addClass('active');
                history.replaceState(null, null, sectionId);
            }
        });
    });

    // Anchor Link History Cleansing (Click Handler)
    // $links.on('click', function(e) {
    //     e.preventDefault();
    //     const targetId = $(this).attr('href');
        
    //     // FIX: Check if targetId is '#' before creating a jQuery object,
    //     // as it will always scroll to the top (scrollTop: 0) anyway.
    //     let $targetElement = null;
    //     if (targetId !== '#') {
    //         $targetElement = $(targetId);
    //     }
        
    //     // Scroll to an element found by ID
    //     if ($targetElement && $targetElement.length) {
    //         $('html, body').animate({
    //             scrollTop: $targetElement.offset().top
    //         }, 0, function() {
    //             history.replaceState(null, null, targetId);
    //         });
    //     } 
        
    //     // Handle the '#' link (Home/Top)
    //     else if (targetId === '#') {
    //          $('html, body').animate({
    //             scrollTop: 0
    //         }, 0, function() {
    //             history.replaceState(null, null, targetId);
    //         });
    //     }
    // });

    $window.trigger('scroll');
});