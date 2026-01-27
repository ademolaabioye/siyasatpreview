// Global Smooth Scroll - works for all #id and name targets
$(document).on('click', 'a[href^="#"]', function(e) {
    var targetId = $(this).attr('href');
    
    // Skip if it's just "#" or empty
    if (targetId === '#' || targetId === '') return;
    
    var targetName = targetId.substring(1); // Remove the # symbol
    
    // Try to find by ID first, then by name attribute
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
    
    // Generate TOC
    $headings.each(function(index) {
        var $heading = $(this);
        var id = $heading.attr('id') || 'heading-' + index;
        $heading.attr('id', id);
        $tocList.append('<li><a href="#' + id + '">' + $heading.text().trim() + '</a></li>');
    });
    
    $(window).on('scroll', function() {
        var scrollPos = $(window).scrollTop();
        
        // Real-time positions
        var parentTop = $parent.offset().top;
        var stopPoint = $stopElement.length 
            ? $stopElement.offset().top - tocHeight - fixedTop 
            : $(document).height();
        
        if (scrollPos >= stopPoint) {
            // Stopped
            $toc.removeClass('is-fixed').addClass('is-stopped').css({ 
                width: tocWidth,
                top: stopPoint - parentTop + fixedTop
            });
        } else if (scrollPos >= parentTop - fixedTop) {
            // Fixed
            $toc.removeClass('is-stopped').addClass('is-fixed').css({ 
                width: tocWidth,
                top: fixedTop
            });
        } else {
            // Normal
            $toc.removeClass('is-fixed is-stopped').css({ width: '', top: '' });
        }
        
        // Highlight active
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
    var $authorList = $('.article-authors, .article-translator');
    var $popupsData = $('.author-popups-data');
    var isMobile = $(window).width() <= 768;
    var hoverTimer = null;
    var currentPopup = null;
    
    // Create overlay
    $('body').append('<div class="author-popup-overlay"></div>');
    var $overlay = $('.author-popup-overlay');
    
    // Hide empty icons containers
    $popupsData.find('.author-popup-card__icons').each(function() {
        var $icons = $(this);
        if ($.trim($icons.html()) === '') {
            $icons.hide();
        }
    });
    
    // Close all popups
    function closeAllPopups() {
        $('.author-popup-card').removeClass('is-active');
        $overlay.removeClass('is-active');
        currentPopup = null;
    }
    
    // Show popup
    function showPopup($popup) {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        closeAllPopups();
        $popup.addClass('is-active');
        currentPopup = $popup;
    }
    
    // Hide popup with delay
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
    
    // Cancel hide
    function cancelHide() {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    }
    
    // Handle each author trigger
    $authorList.find('.author-trigger').each(function() {
        var $trigger = $(this);
        var $li = $trigger.closest('li');
        var authorName = $trigger.data('author');
        var $popup = $popupsData.find('.author-popup-card[data-author="' + authorName + '"]');
        
        if (!$popup.length) return;
        
        // Move popup to the li
        $popup.appendTo($li);
        
        if (isMobile) {
            // Mobile: click
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
            // Desktop: hover on trigger
            $trigger.on('mouseenter', function() {
                showPopup($popup);
            });
            
            $trigger.on('mouseleave', function() {
                hidePopupDelayed($popup);
            });
            
            // Keep popup open when hovering over it
            $popup.on('mouseenter', function() {
                cancelHide();
            });
            
            $popup.on('mouseleave', function() {
                hidePopupDelayed($popup);
            });
        }
    });
    
    // Close on overlay click (mobile)
    $overlay.on('click', function() {
        closeAllPopups();
    });
    
    // Close on document click (mobile)
    $(document).on('click', function(e) {
        if (isMobile && currentPopup) {
            if (!$(e.target).closest('.author-popup-card, .author-trigger').length) {
                closeAllPopups();
            }
        }
    });
    
    // Handle resize
    $(window).on('resize', function() {
        var wasMobile = isMobile;
        isMobile = $(window).width() <= 768;
        
        if (wasMobile !== isMobile) {
            closeAllPopups();
            cancelHide();
        }
    });
    
    // Escape key to close
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && currentPopup) {
            closeAllPopups();
        }
    });
});

$(document).ready(function() {
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
        return $content[0].scrollWidth - $content[0].clientWidth;
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
    
    // Toggle collapse
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
    
    // Prev arrow
    $prevArrow.on('click', function() {
        if ($(this).hasClass('is-disabled')) return;
        var newScroll = $content.scrollLeft() + getScrollAmount();
        $content.stop(true).animate({ scrollLeft: newScroll }, 300, function() {
            updateArrows();
        });
    });
    
    // Next arrow
    $nextArrow.on('click', function() {
        if ($(this).hasClass('is-disabled')) return;
        var newScroll = $content.scrollLeft() - getScrollAmount();
        $content.stop(true).animate({ scrollLeft: newScroll }, 300, function() {
            updateArrows();
        });
    });
    
    // Update arrows on scroll
    $content.on('scroll', function() {
        updateArrows();
    });
    
    // Handle resize
    $(window).on('resize', function() {
        updateArrows();
    });
    
    // Initialize
    updateArrows();
});

// Footnote Hover Dropdown - Desktop only (>=992px)
(function($) {
  'use strict';

  var $dropdown, hideTO, showTO, $trigger, $scrollParents = $();
  var isDesktop = function() {
    return window.matchMedia ? window.matchMedia('(min-width:992px)').matches : $(window).width() >= 992;
  };

  $(function() {
    $dropdown = $('<div class="footnote-dropdown"><div class="footnote-content"></div></div>').appendTo('body');

    $('.doha_article-body')
      .on('mouseenter', 'a[name^="_ftnref"]', function() {
        if (!isDesktop()) return;
        var $t = $(this);
        clearTimeout(hideTO); clearTimeout(showTO);
        showTO = setTimeout(function() { showDropdown($t); }, 150);
      })
      .on('mouseleave', 'a[name^="_ftnref"]', function() {
        if (!isDesktop()) return;
        clearTimeout(showTO);
        hideTO = setTimeout(hideDropdown, 200);
      });

    $dropdown
      .on('mouseenter', function() { if (isDesktop()) clearTimeout(hideTO); })
      .on('mouseleave', function() { if (isDesktop()) hideTO = setTimeout(hideDropdown, 200); });

    $(window).on('scroll resize', function() {
      if (!isDesktop()) { hideDropdown(); return; }
      if ($trigger && $dropdown.hasClass('visible')) position();
    });
  });

  function showDropdown($t) {
    if (!isDesktop()) return;
    var id = $t.attr('name').replace('_ftnref', '_ftn');
    var $anchor = $('a[name="' + id + '"]');
    if (!$anchor.length) return;

    var $p = $anchor.closest('p');
    if (!$p.length) return;

    var $clone = $p.clone();
    $clone.find('a[name="' + id + '"]').remove();

    var html = '<p' + ($p.attr('dir') ? ' dir="' + $p.attr('dir') + '"' : '') + ($p.attr('style') ? ' style="' + $p.attr('style') + '"' : '') + '>' + $.trim($clone.html()) + '</p>';

    $dropdown.find('.footnote-content').html(html);
    $trigger = $t;

    // Bind scroll parents
    $scrollParents.off('scroll.fnd');
    $scrollParents = $t.parents().filter(function() {
      var o = $(this).css('overflow'), oy = $(this).css('overflow-y');
      return /auto|scroll/.test(o + oy);
    });
    $scrollParents.on('scroll.fnd', function() {
      if ($trigger && $dropdown.hasClass('visible') && isDesktop()) position();
    });

    position();
    $dropdown.addClass('visible');
  }

  function position() {
    if (!isDesktop() || !$trigger) return;
    var rect = $trigger[0].getBoundingClientRect();
    var wh = $(window).height(), ww = $(window).width();

    if (rect.bottom < 0 || rect.top > wh) { $dropdown.removeClass('visible'); return; }

    $dropdown.css({visibility: 'hidden', top: '-9999px', left: '-9999px' });
    var dw = $dropdown.outerWidth(), dh = $dropdown.outerHeight();
    $dropdown.css({visibility: '', top: '', left: '' });

    var cx = rect.left + rect.width / 2, pad = 10, gap = 12;
    var left = Math.max(pad, Math.min(ww - dw - pad, cx - dw / 2));
    var arrow = Math.max(12, Math.min(dw - 12, cx - left));
    var above = rect.top >= dh + gap || rect.top >= wh - rect.bottom;
    var top = above ? rect.top - dh - gap : rect.bottom + gap;

    $dropdown.removeClass('position-above position-below').addClass(above ? 'position-above' : 'position-below')
      .css({ top: top, left: left })[0].style.setProperty('--arrow-left', arrow + 'px');
  }

  function hideDropdown() {
    $dropdown.removeClass('visible');
    $trigger = null;
    $scrollParents.off('scroll.fnd');
    $scrollParents = $();
  }
})(jQuery);


// Image Lightbox - All images in .doha_article-body
(function($) {
  'use strict';

  var $lightbox;

  $(function() {
    // Create lightbox
    $lightbox = $([
      '<div class="doha_lightbox">',
        '<button class="doha_lightbox-close" aria-label="Close"></button>',
        '<div class="doha_lightbox-content">',
          '<img class="doha_lightbox-img" src="" alt="">',
          '<div class="doha_lightbox-caption"></div>',
        '</div>',
      '</div>'
    ].join('')).appendTo('body');

    // Click on image to open
    $('.doha_article-body').on('click', 'img', function() {
      var $img = $(this);
      var src = $img.attr('src');
      var caption = getCaption($img);

      $lightbox.find('.doha_lightbox-img').attr('src', src);
      $lightbox.find('.doha_lightbox-caption').html(caption);

      $('body').addClass('lightbox-open');
      $lightbox.addClass('visible');
    });

    // Close button
    $lightbox.on('click', '.doha_lightbox-close', function() {
      closeLightbox();
    });

    // Click outside image to close
    $lightbox.on('click', function(e) {
      if ($(e.target).hasClass('doha_lightbox') || $(e.target).hasClass('doha_lightbox-content')) {
        closeLightbox();
      }
    });

    // ESC key to close
    $(document).on('keydown', function(e) {
      if (e.keyCode === 27 && $lightbox.hasClass('visible')) {
        closeLightbox();
      }
    });
  });

  function getCaption($img) {
    var $figure = $img.closest('.article-figure, figure');
    
    if ($figure.length) {
      var $caption = $figure.find('figcaption');
      if ($caption.length) {
        return $caption.html();
      }
    }

    // Fallback to alt text
    var alt = $img.attr('alt');
    return alt && alt !== 'Image description' ? alt : '';
  }

  function closeLightbox() {
    $lightbox.removeClass('visible');
    $('body').removeClass('lightbox-open');
  }
})(jQuery);