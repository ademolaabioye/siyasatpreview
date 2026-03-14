// Global Smooth Scroll - works for all #id and name targets
$(document).on('click', 'a[href^="#"]', function(e) {
    var targetId = $(this).attr('href');
    
    if (targetId === '#' || targetId === '') return;
    
    var targetName = targetId.substring(1);
    var $target = $(targetId);
    
    if (!$target.length) {
        $target = $('[name="' + targetName + '"]');
    }
    
    if ($target.length) {
        e.preventDefault();
        $('html, body').animate({ 
            scrollTop: $target.offset().top - 20 
        }, 400);
    }
});

$(window).on('load', function() {
    var $toc = $('.doha_toc');
    var $tocList = $('#toc-list');
    var $headings = $('.doha_article-body h2');
    var $sidebar = $('.sidebar');
    var $stopElement = $('.doha_article-bottom');
    var $parent = $toc.parent();
    
    var tocWidth, tocHeight;
    var fixedTop = 20;
    
    function updateSize() {
        $toc.removeClass('is-fixed is-stopped').css({ width: '', top: '' });
        tocWidth = $toc.outerWidth();
        tocHeight = $toc.outerHeight();
    }
    
    $headings.each(function(index) {
        var $heading = $(this);
        var id = $heading.attr('id') || 'heading-' + index;
        $heading.attr('id', id);
        $tocList.append('<li><a href="#' + id + '">' + $heading.text().trim() + '</a></li>');
    });
    
    $(window).on('scroll', function() {
        var scrollPos = $(window).scrollTop();
        var parentTop = $parent.offset().top;
        var stopPoint = $stopElement.length 
            ? $stopElement.offset().top - tocHeight - fixedTop 
            : $(document).height();
        
        if (scrollPos >= stopPoint) {
            $toc.removeClass('is-fixed').addClass('is-stopped').css({ 
                width: tocWidth,
                top: stopPoint - parentTop + fixedTop
            });
        } else if (scrollPos >= parentTop - fixedTop) {
            $toc.removeClass('is-stopped').addClass('is-fixed').css({ 
                width: tocWidth,
                top: fixedTop
            });
        } else {
            $toc.removeClass('is-fixed is-stopped').css({ width: '', top: '' });
        }
        
        $headings.each(function() {
            if (scrollPos + 100 >= $(this).offset().top) {
                $tocList.find('a').removeClass('active');
                $tocList.find('a[href="#' + $(this).attr('id') + '"]').addClass('active');
            }
        });
    });
    
    var resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            updateSize();
            $(window).trigger('scroll');
        }, 150);
    });
    
    setTimeout(function() {
        updateSize();
        $(window).trigger('scroll');
    }, 100);
});

$(document).ready(function() {
    // ============ Author Popups ============
    var $authorList = $('.article-authors, .article-translator');
    var $popupsData = $('.author-popups-data');
    var isMobile = $(window).width() <= 768;
    var hoverTimer = null;
    var currentPopup = null;
    
    $('body').append('<div class="author-popup-overlay"></div>');
    var $overlay = $('.author-popup-overlay');
    
    $popupsData.find('.author-popup-card__icons').each(function() {
        var $icons = $(this);
        if ($.trim($icons.html()) === '') {
            $icons.hide();
        }
    });
    
    function closeAllPopups() {
        $('.author-popup-card').removeClass('is-active');
        $overlay.removeClass('is-active');
        currentPopup = null;
    }
    
    function showPopup($popup) {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        closeAllPopups();
        $popup.addClass('is-active');
        currentPopup = $popup;
    }
    
    function hidePopupDelayed($popup) {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
        }
        hoverTimer = setTimeout(function() {
            $popup.removeClass('is-active');
            if (currentPopup && currentPopup[0] === $popup[0]) {
                currentPopup = null;
            }
        }, 250);
    }
    
    function cancelHide() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    }
    
    $authorList.find('.author-trigger').each(function() {
        var $trigger = $(this);
        var $li = $trigger.closest('li');
        var authorName = $trigger.data('author');
        var $popup = $popupsData.find('.author-popup-card[data-author="' + authorName + '"]');
        
        if (!$popup.length) return;
        
        $popup.appendTo($li);
        
        if (isMobile) {
            $trigger.on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var isActive = $popup.hasClass('is-active');
                
                closeAllPopups();
                
                if (!isActive) {
                    $popup.addClass('is-active');
                    $overlay.addClass('is-active');
                    currentPopup = $popup;
                }
            });
        } else {
            $trigger.on('mouseenter', function() {
                showPopup($popup);
            });
            
            $trigger.on('mouseleave', function() {
                hidePopupDelayed($popup);
            });
            
            $popup.on('mouseenter', function() {
                cancelHide();
            });
            
            $popup.on('mouseleave', function() {
                hidePopupDelayed($popup);
            });
        }
    });
    
    $overlay.on('click', function() {
        closeAllPopups();
    });
    
    $(document).on('click', function(e) {
        if (isMobile && currentPopup) {
            if (!$(e.target).closest('.author-popup-card, .author-trigger').length) {
                closeAllPopups();
            }
        }
    });
    
    $(window).on('resize', function() {
        var wasMobile = isMobile;
        isMobile = $(window).width() <= 768;
        
        if (wasMobile !== isMobile) {
            closeAllPopups();
            cancelHide();
        }
    });
    
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && currentPopup) {
            closeAllPopups();
        }
    });

    // ============ Previous Issues ============
    var $container = $('.doha_previous-issues');
    var $toggle = $('.doha_previous-issues__toggle');
    var $body = $('.doha_previous-issues__body');
    var $content = $('.doha_previous-issues__content');
    var $prevArrow = $('.doha_previous-issues__arrow--prev');
    var $nextArrow = $('.doha_previous-issues__arrow--next');
    var isAnimating = false;
    
    function getScrollAmount() {
        return $content.find('.doha_previous-issues__year').outerWidth() || 150;
    }
    
    function getScrollPosition() {
        return Math.abs($content.scrollLeft());
    }
    
    function getMaxScroll() {
        return $content[0] ? $content[0].scrollWidth - $content[0].clientWidth : 0;
    }
    
    function updateArrows() {
        var scrollPos = getScrollPosition();
        var maxScroll = getMaxScroll();
        
        if (scrollPos <= 5) {
            $prevArrow.addClass('is-disabled');
        } else {
            $prevArrow.removeClass('is-disabled');
        }
        
        if (scrollPos >= maxScroll - 5) {
            $nextArrow.addClass('is-disabled');
        } else {
            $nextArrow.removeClass('is-disabled');
        }
    }
    
    $toggle.on('click', function() {
        if (isAnimating) return;
        isAnimating = true;
        
        if ($container.hasClass('is-open')) {
            $container.removeClass('is-open');
            $body.stop(true).slideUp(200, function() {
                isAnimating = false;
            });
        } else {
            $container.addClass('is-open');
            $body.stop(true).slideDown(200, function() {
                isAnimating = false;
                updateArrows();
            });
        }
    });
    
    $prevArrow.on('click', function() {
        if ($(this).hasClass('is-disabled')) return;
        var newScroll = $content.scrollLeft() + getScrollAmount();
        $content.stop(true).animate({ scrollLeft: newScroll }, 300, function() {
            updateArrows();
        });
    });
    
    $nextArrow.on('click', function() {
        if ($(this).hasClass('is-disabled')) return;
        var newScroll = $content.scrollLeft() - getScrollAmount();
        $content.stop(true).animate({ scrollLeft: newScroll }, 300, function() {
            updateArrows();
        });
    });
    
    $content.on('scroll', function() {
        updateArrows();
    });
    
    $(window).on('resize', function() {
        updateArrows();
    });
    
    updateArrows();

    // ============ Footnote Hover Dropdown ============
    var $footnoteDropdown = $('<div class="footnote-dropdown"><div class="footnote-content"></div></div>').appendTo('body');
    var footnoteHideTO, footnoteShowTO, $footnoteTrigger, $footnoteScrollParents = $();
    
    function isDesktop() {
        return window.matchMedia ? window.matchMedia('(min-width:992px)').matches : $(window).width() >= 992;
    }
    
    function showFootnoteDropdown($t) {
        if (!isDesktop()) return;
        var id = $t.attr('name').replace('_ftnref', '_ftn');
        var $anchor = $('a[name="' + id + '"]');
        if (!$anchor.length) return;

        var $p = $anchor.closest('p');
        if (!$p.length) return;

        var $clone = $p.clone();
        $clone.find('a[name="' + id + '"]').remove();

        var html = '<p' + ($p.attr('dir') ? ' dir="' + $p.attr('dir') + '"' : '') + ($p.attr('style') ? ' style="' + $p.attr('style') + '"' : '') + '>' + $.trim($clone.html()) + '</p>';

        $footnoteDropdown.find('.footnote-content').html(html);
        $footnoteTrigger = $t;

        $footnoteScrollParents.off('scroll.fnd');
        $footnoteScrollParents = $t.parents().filter(function() {
            var o = $(this).css('overflow'), oy = $(this).css('overflow-y');
            return /auto|scroll/.test(o + oy);
        });
        $footnoteScrollParents.on('scroll.fnd', function() {
            if ($footnoteTrigger && $footnoteDropdown.hasClass('visible') && isDesktop()) positionFootnote();
        });

        positionFootnote();
        $footnoteDropdown.addClass('visible');
    }

    function positionFootnote() {
        if (!isDesktop() || !$footnoteTrigger) return;
        var rect = $footnoteTrigger[0].getBoundingClientRect();
        var wh = $(window).height(), ww = $(window).width();

        if (rect.bottom < 0 || rect.top > wh) { $footnoteDropdown.removeClass('visible'); return; }

        $footnoteDropdown.css({visibility: 'hidden', top: '-9999px', left: '-9999px' });
        var dw = $footnoteDropdown.outerWidth(), dh = $footnoteDropdown.outerHeight();
        $footnoteDropdown.css({visibility: '', top: '', left: '' });

        var cx = rect.left + rect.width / 2, pad = 10, gap = 12;
        var left = Math.max(pad, Math.min(ww - dw - pad, cx - dw / 2));
        var arrow = Math.max(12, Math.min(dw - 12, cx - left));
        var above = rect.top >= dh + gap || rect.top >= wh - rect.bottom;
        var top = above ? rect.top - dh - gap : rect.bottom + gap;

        $footnoteDropdown.removeClass('position-above position-below').addClass(above ? 'position-above' : 'position-below')
            .css({ top: top, left: left })[0].style.setProperty('--arrow-left', arrow + 'px');
    }

    function hideFootnoteDropdown() {
        $footnoteDropdown.removeClass('visible');
        $footnoteTrigger = null;
        $footnoteScrollParents.off('scroll.fnd');
        $footnoteScrollParents = $();
    }

    $('.doha_article-body')
        .on('mouseenter', 'a[name^="_ftnref"]', function() {
            if (!isDesktop()) return;
            var $t = $(this);
            clearTimeout(footnoteHideTO); clearTimeout(footnoteShowTO);
            footnoteShowTO = setTimeout(function() { showFootnoteDropdown($t); }, 150);
        })
        .on('mouseleave', 'a[name^="_ftnref"]', function() {
            if (!isDesktop()) return;
            clearTimeout(footnoteShowTO);
            footnoteHideTO = setTimeout(hideFootnoteDropdown, 200);
        });

    $footnoteDropdown
        .on('mouseenter', function() { if (isDesktop()) clearTimeout(footnoteHideTO); })
        .on('mouseleave', function() { if (isDesktop()) footnoteHideTO = setTimeout(hideFootnoteDropdown, 200); });

    $(window).on('scroll resize', function() {
        if (!isDesktop()) { hideFootnoteDropdown(); return; }
        if ($footnoteTrigger && $footnoteDropdown.hasClass('visible')) positionFootnote();
    });

    // ============ Image Lightbox ============
    var $lightbox = $([
        '<div class="doha_lightbox">',
            '<button class="doha_lightbox-close" aria-label="Close"></button>',
            '<div class="doha_lightbox-content">',
                '<img class="doha_lightbox-img" src="" alt="">',
                '<div class="doha_lightbox-caption"></div>',
            '</div>',
        '</div>'
    ].join('')).appendTo('body');

    function getLightboxCaption($img) {
        var $figure = $img.closest('.article-figure, figure');
        
        if ($figure.length) {
            var $caption = $figure.find('figcaption');
            if ($caption.length) {
                return $caption.html();
            }
        }

        var alt = $img.attr('alt');
        return alt && alt !== 'Image description' ? alt : '';
    }

    function closeLightbox() {
        $lightbox.removeClass('visible');
        $('body').removeClass('lightbox-open');
    }

    $('.doha_article-body').on('click', 'img', function() {
        var $img = $(this);
        var src = $img.attr('src');
        var caption = getLightboxCaption($img);

        $lightbox.find('.doha_lightbox-img').attr('src', src);
        $lightbox.find('.doha_lightbox-caption').html(caption);

        $('body').addClass('lightbox-open');
        $lightbox.addClass('visible');
    });

    $lightbox.on('click', '.doha_lightbox-close', function() {
        closeLightbox();
    });

    $lightbox.on('click', function(e) {
        if ($(e.target).hasClass('doha_lightbox') || $(e.target).hasClass('doha_lightbox-content')) {
            closeLightbox();
        }
    });

    $(document).on('keydown', function(e) {
        if (e.keyCode === 27 && $lightbox.hasClass('visible')) {
            closeLightbox();
        }
    });
});


$(function () {

    var closeTimer;

    /* -----------------------
       HOVER BEHAVIOR
    ----------------------- */

    $('.navbar-nav').on('mouseenter', '.journal-dropdown', function () {
        clearTimeout(closeTimer);

        // Close others
        $('.journal-dropdown.open').not(this).removeClass('open');

        $(this).addClass('open');
    });

    $('.navbar-nav').on('mouseleave', '.journal-dropdown', function () {
        var $this = $(this);

        closeTimer = setTimeout(function () {
            $this.removeClass('open');
        }, 120); // small delay prevents flicker
    });

    /* -----------------------
       CLICK TOGGLE
    ----------------------- */

    $('.navbar-nav').on('click', '.journal-dropdown > a', function (e) {
        e.preventDefault(); // prevent "#"

        var $parent = $(this).parent('.journal-dropdown');

        if ($parent.hasClass('open')) {
            $parent.removeClass('open');
        } else {
            $('.journal-dropdown.open').removeClass('open');
            $parent.addClass('open');
        }
    });

    /* -----------------------
       CLICK OUTSIDE CLOSE
    ----------------------- */

    $(document).on('click', function (e) {
        if ($(e.target).closest('.journal-dropdown').length === 0) {
            $('.journal-dropdown.open').removeClass('open');
        }
    });

    /* -----------------------
       ESC KEY CLOSE
    ----------------------- */

    $(document).on('keydown', function (e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            $('.journal-dropdown.open').removeClass('open');
        }
    });

});
