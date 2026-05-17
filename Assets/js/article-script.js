/* jshint esversion: 11 */
$(document).ready(function () {
    if ($("#FactsDiv").find("table, div.arabica_article-image").length === 0) {
  $("#FactsDiv").hide();
}
    $('#FactsDiv *').contents().filter(function() {
        return this.nodeType === 3;
    }).each(function() {
        this.textContent = this.textContent
            .replace(/&ZeroWidthSpace;&ZeroWidthSpace;/g, '')
            .replace(/\u200B\u200B/g, '')
            .replace(/\u200B/g, '');
    });
// Remove empty paragraphs
	$('#FactsDiv p').each(function() {
        let content = $(this).html().trim()
            .replace(/<br\s*\/?>/gi, '')
            .replace(/&ZeroWidthSpace;/g, '')
            .replace(/\u200B\u200B/g, '')
            .replace(/\u200B/g, '')
            .trim();
        
        if (!content) $(this).remove();
    });

  var escapeAttr = function (text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  var getCleanHTML = function ($el) {
    var $temp = $el.clone();
    $temp.find('a[name^="_edn"]').remove();
    $temp.find("li").each(function () {
      var $li = $(this);
      var liDir = /[\u0600-\u06FF]/.test($li.text()) ? "rtl" : "ltr";
      $li.attr("dir", liDir);
    });
    var dir = /[\u0600-\u06FF]/.test($temp.text()) ? "rtl" : "ltr";
    $temp.attr("dir", dir);
    return $temp.prop("outerHTML");
  };

  var processHeadings, updateActiveTOC;
  var resetIconStyles, closeAllDropdowns, positionDropdown;

  // Move paragraphs with footnotes (excluding those with "ref")
  var moveFootnoteParagraphs = function() {
  var $articleContent = $(".arabica_article-content");
  var $footnoteContainer = $(".arabica_foot-reference");
  if ($articleContent.length && $footnoteContainer.length) {
    var hasFootnotes = false;
    var $footnoteParagraphs = $articleContent.find('p:has(a[name^="_ftn"]:not([name*="ref"]))');

    $footnoteParagraphs.each(function () {
      hasFootnotes = true;
      var elementsToMove = [$(this)];
      var $next = $(this).next();
      while ($next.length && ["P", "UL", "OL"].indexOf($next.prop("tagName")) !== -1) {
        if ($next.is("p") && $next.find('a[name^="_edn"]').length) break;
        elementsToMove.push($next);
        $next = $next.next();
      }
      for (var i = 0; i < elementsToMove.length; i++) {
        $footnoteContainer.append(elementsToMove[i]);
      }
    });

    if (!hasFootnotes) {
      $footnoteContainer.remove();
      $("<style>")
        .text(
          ".arabica_article-sources {" +
            "border-top: 0 !important;" +
            "margin-top: 0 !important;" +
            "padding-top: 0 !important;" +
          "}"
        )
        .appendTo("head");
    }
  }
};
  
  // Set direction for foot reference and source elements
  $(
   ".arabica_foot-reference p, .arabica_foot-reference ol, .arabica_foot-reference li, .arabica_article-content p:not(:has(.display-math, .inline-math)), .arabica_article-content ol:not(:has(.display-math, .inline-math)), .arabica_article-content li:not(:has(.display-math, .inline-math))"
  ).each(function () {
    if (!/[\u0600-\u06FF]/.test($(this).text())) {
      $(this).attr("dir", "ltr");
    }
  });
// Zero-width character remover
function stripZWS(str) {
  return str.replace(/[\u200B-\u200F\uFEFF]/g, "");
}

// Move reference sections
var referenceTitles = [
  "المراجع",
  "المراج​​ع",
  "المرا​جع"
];

var $headings = $(".arabica_article-content h2");
var referenceFound = false;

$headings.each(function () {
  var normalizedText = stripZWS(
    $(this).text().trim().toLowerCase().replace(/\s+/g, "")
  );

  for (var j = 0; j < referenceTitles.length; j++) {
    var key = stripZWS(
      referenceTitles[j].toLowerCase().replace(/\s+/g, "")
    );

    if (normalizedText.indexOf(key) !== -1) {
      referenceFound = true;

      var elementsToMove = [$(this)];
      var $nextElem = $(this).next();

      while ($nextElem.length) {
        var isStop =
          $nextElem.is("p") &&
          $nextElem.find('a[name*="ftn"], a[name*="edn"]').length;

        if (isStop) break;

        elementsToMove.push($nextElem);
        $nextElem = $nextElem.next();
      }

      var $target = $(".arabica_article-sources");
      if ($target.length) {
        for (var k = 0; k < elementsToMove.length; k++) {
          $target.append(elementsToMove[k]);
        }
      }
      break;
    }
  }
});

if (!referenceFound) {
  var $footSource = $(".arabica_foot-source");
  if ($footSource.length) $footSource.remove();
}


  var shouldRemoveRightColumn = false;

if ($headings.length < 2) {
  shouldRemoveRightColumn = true;
}
  
  if (shouldRemoveRightColumn) {
    $(".arabica_right-column-25").remove();
    $(".arabica_left-column").css("width", "100%");
    $(".arabica_floating-btn").css("display", "none");
  }
 var $artContainer = $('.arabica_article-content');
    var $artFirstH2 = $artContainer.find('h2').first();

    if ($artFirstH2.length > 0) {
        var text = $.trim($artFirstH2.text());
        var isReference = false;

        // Check if first h2 matches any reference title
        for (var i = 0; i < referenceTitles.length; i++) {
            if (text === referenceTitles[i]) {
                isReference = true;
                break;
            }
        }

        // Only add HR if NOT reference title
        if (!isReference) {
            $('<hr>').insertBefore($artFirstH2);
        }
    }
// ==========================================
// HELPER FUNCTION: Open toggle if target is inside collapsed section
// ==========================================
var openToggleForTarget = function(targetId) {
  if (!targetId) return;
  
  var $target = $(targetId);
  if (!$target.length) {
    $target = $('[name="' + targetId.substring(1) + '"]');
  }
  
  if ($target.length) {
    // Case 1: Target is an H2 heading inside a toggle (TOC → reference H2)
    var $toggleParent = $target.closest('.arabica_ref-toggle');
    if ($toggleParent.length) {
      var $body = $toggleParent.next('.arabica_ref-wrapper').find('.arabica_ref-body');
      if ($body.length && !$body.is(':visible')) {
        $toggleParent.addClass('active');
        $body.show();
      }
      return;
    }
    
    // Case 2: Target is content inside collapsed section (like footnotes)
    var $closestBody = $target.closest('.arabica_ref-body');
    if ($closestBody.length) {
      if (!$closestBody.is(':visible')) {
        var $toggle = $closestBody.closest('.arabica_ref-wrapper').prev('.arabica_ref-toggle');
        if ($toggle.length && !$toggle.hasClass('active')) {
          $toggle.addClass('active');
          $closestBody.show();
        }
      }
    }
  }
};
  // Table of Contents generation
var $contentContainer = $(".arabica_article-content");
var $tocContainer = $(".arabica_article-table-content");
var $footContainer = $(".arabica_foot-container");

if ($contentContainer.length && $tocContainer.length) {
  var tocHTML = "";
  var footerTocHTML = "";
  var currentSection = "";
  var idx = 1;
  var inFooterSection = false;
  var footerMarker = "الهوامش";

  processHeadings = function ($container) {
    var $h = $container.find("h2, h3");
    $h.each(function () {
      var $hd = $(this);
      
      // Skip SharePoint editor headings
      if ($hd.hasClass("ms-webpart-titleText") || 
          $hd.hasClass("ms-webpart-titleText-withMenu")) {
        return;
      }
      
      // Clone heading and remove footnote references to get clean text
      var $clone = $hd.clone();
      // Remove footnote links and their parent elements
$clone.find('a[href^="#_ftn"], a[name^="_ftnref"]').remove();
// Remove endnote links and their parent elements
$clone.find('a[href^="#_edn"], a[name^="_ednref"]').remove();
// Remove any remaining sup tags that might contain footnotes
$clone.find('sup').remove();

      var headingText = $clone.text().trim();
      
      if (!$hd.attr("id")) $hd.attr("id", "heading-" + idx++);
      
      // Check if we've hit the footer section marker
      if (headingText === footerMarker && !inFooterSection) {
        // Close any open section before switching to footer
        if (currentSection) {
          tocHTML += "</div>";
          currentSection = "";
        }
        inFooterSection = true;
      }
      
      if ($hd.is("h2")) {
        // Close previous section
        if (currentSection) {
          if (inFooterSection) {
            footerTocHTML += "</div>";
          } else {
            tocHTML += "</div>";
          }
        }
        
        currentSection =
          '<div class="arabica_toc-section">' +
            '<a href="#' + $hd.attr("id") + '" class="arabica_toc-link">' +
              headingText +
            "</a>";
        
        if (inFooterSection) {
          footerTocHTML += currentSection;
        } else {
          tocHTML += currentSection;
        }
      } else {
        var h3HTML =
          '<a href="#' + $hd.attr("id") +
          '" class="arabica_toc-link arabica_toc-indent">' +
            headingText +
          "</a>";
        
        if (inFooterSection) {
          footerTocHTML += h3HTML;
        } else {
          tocHTML += h3HTML;
        }
      }
    });
  };

  updateActiveTOC = function () {
    var currentId = "";
    var threshold = 100;
    $(".arabica_article-content h2, .arabica_article-content h3").each(function () {
      var $hd = $(this);
      if ($hd.offset().top - $(window).scrollTop() <= threshold) {
        currentId = $hd.attr("id");
      }
    });
    $tocContainer.find(".arabica_toc-link").each(function () {
      var $ln = $(this);
      var tgt = $ln.attr("href").substring(1);
      $ln.toggleClass("active", tgt === currentId);
    });
  };

  processHeadings($contentContainer);
  
  // Close last section from content container
  if (currentSection) {
    if (inFooterSection) {
      footerTocHTML += "</div>";
    } else {
      tocHTML += "</div>";
    }
    currentSection = "";
  }
  
  if ($footContainer.length) {
    processHeadings($footContainer);
    if (currentSection) {
      if (inFooterSection) {
        footerTocHTML += "</div>";
      } else {
        tocHTML += "</div>";
      }
    }
  }

  // Combine with footer wrapper
  var finalHTML = tocHTML;
  if (footerTocHTML) {
    finalHTML += '<div class="arabica_toc-foot-wrapper">' + footerTocHTML + '</div>';
  }

  $tocContainer.html(finalHTML);
  
  $tocContainer.find(".arabica_toc-link").on("click", function (e) {
    e.preventDefault();
    var tgt = $(this).attr("href");
    openToggleForTarget(tgt);
});
  
  $(window).on("scroll", updateActiveTOC);
  updateActiveTOC();
}
// Global handler for all footnote/endnote links
$(document).on("click", 'a[href^="#_ftn"], a[href^="#_edn"]', function(e) {
    e.preventDefault();
    var href = $(this).attr('href');
    
    openToggleForTarget(href);
    
    setTimeout(function() {
        var $target = $(href);
        if (!$target.length) {
            $target = $('[name="' + href.substring(1) + '"]');
        }
        if ($target.length) {
            window.location.hash = href;
        }
    }, 50);
});
// Unified Interactive Dropdown System (with responsive image layout)
(function() {
  'use strict';
  
  var $article = $(".arabica_article-content");
  if (!$article.length) return;
  
  // Common utilities
  var utils = {
    hasArabicText: function(text) {
      return /[\u0600-\u06FF]/.test(text);
    },
    
    generateId: function(prefix) {
      return prefix + "-" + Math.random().toString(36).slice(2, 9);
    },
    
    createDropdownHtml: function(id, content, direction, includeActions, skipTextWrapper) {
      var actionsHtml = includeActions ? 
        '<div class="arabica_ref-actions">' +
          '<span class="arabica_ref-copy-icon" title="نسخ"><i class="fa-regular fa-copy"></i></span>' +
          '<span class="arabica_ref-copied-text">✓ تم النسخ</span>' +
          '<span class="arabica_ref-close-icon" title="إغلاق"><i class="fa-regular fa-circle-xmark"></i></span>' +
        '</div>' : '';
      
      var textDiv = skipTextWrapper ? 
        content : 
        '<div class="arabica_ref-text" dir="' + direction + '">' + content + '</div>';
      
      return '<div id="' + id + '" class="arabica_ref-dropdown ' + this.getDropdownClass(includeActions) + '">' +
               actionsHtml +
               textDiv +
             '</div>';
    },
    
    getDropdownClass: function(includeActions) {
      return includeActions ? 'arabica_ftn-dropdown' : 'arabica_bracket-dropdown arabica_link-dropdown';
    }
  };
  
  // Common dropdown management
  var dropdownManager = {
    position: function($trigger, $dropdown) {
      var $parent = $trigger.offsetParent();
      if (!$parent.length) return;
      
      $dropdown.css({ top: "", left: "" }).removeClass("arabica_ref-dropdown--above");
      
      var triggerR = $trigger[0].getBoundingClientRect();
      var parR = $parent[0].getBoundingClientRect();
      var dropR = $dropdown[0].getBoundingClientRect();
      
      // Calculate horizontal position (center dropdown on trigger)
      var left = triggerR.left - parR.left + triggerR.width/2 - dropR.width/2;
      left = Math.max(0, Math.min(left, parR.width - dropR.width));
      $dropdown.css("left", left + "px");
      
      // Calculate vertical position
      var spaceBelow = window.innerHeight - triggerR.bottom;
      var spaceAbove = triggerR.top;
      var top;
      
      if (spaceBelow < dropR.height + 10 && spaceAbove >= dropR.height + 10) {
        // Show above
        top = triggerR.top - parR.top - dropR.height - 10;
        $dropdown.addClass("arabica_ref-dropdown--above");
      } else {
        // Show below
        top = triggerR.bottom - parR.top + 10;
      }
      $dropdown.css("top", top + "px");
      
      // Position arrow
      var arrowLeft = triggerR.left - parR.left + triggerR.width/2 - left;
      $dropdown.css("--arrow-left", arrowLeft + "px");
    },
    
    setupHoverEvents: function($trigger, $dropdown, dropdownType) {
      var showTimer, hideTimer;
      
      $trigger.on("mouseenter", function(e) {
      e.stopPropagation();
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
      
      showTimer = setTimeout(function() {
        $(".arabica_ref-dropdown.open").removeClass("open");
        dropdownManager.position($trigger, $dropdown);
        $dropdown.addClass("open");
      }, 300);

    });
      
      $trigger.on("mouseleave", function(e) {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        
        hideTimer = setTimeout(function() {
          if (!$dropdown.is(":hover") && !$trigger.is(":hover")) {
            $dropdown.removeClass("open");
          }
        }, 300);
        $trigger.data('hideTimer', hideTimer);
      });
      
      // Keep dropdown open when hovering over it
      $dropdown.on("mouseenter", function(e) {
        clearTimeout($trigger.data('hideTimer'));
        clearTimeout($trigger.data('showTimer'));
      });
      
      $dropdown.on("mouseleave", function(e) {
        var hideTimer = setTimeout(function() {
          if (!$dropdown.is(":hover") && !$trigger.is(":hover")) {
            $dropdown.removeClass("open");
          }
        }, 300);
        $trigger.data('hideTimer', hideTimer);
      });
      
      // Prevent dropdown clicks from bubbling
      $dropdown.on("click", function(e) { 
        e.stopPropagation(); 
      });
    // PREVENT CLICK FROM OPENING DROPDOWNS
      $trigger.on('click', function(e) {
        // Only prevent default for non-link elements
        if ($trigger.is('a')) {
          // Allow normal link behavior
          return true;
        }
        e.preventDefault();
        e.stopPropagation();
      });
    },
    
    setupCopyFunctionality: function($dropdown) {
      $dropdown.find(".arabica_ref-copy-icon").on("click", function (e) {
        e.stopPropagation();
        var $txtEl = $dropdown.find(".arabica_ref-text");
        var htmlC = $txtEl.html().trim();
        var plainC = $txtEl.text().trim().replace(/\s+/g," ");
        var clip = new ClipboardItem({
          "text/html": new Blob([htmlC], {type:"text/html"}),
          "text/plain": new Blob([plainC], {type:"text/plain"})
        });
        navigator.clipboard.write([clip]).then(function(){
          $(this).hide();
          $dropdown.find(".arabica_ref-copied-text").addClass("show");
          setTimeout(function(){
            $dropdown.find(".arabica_ref-copy-icon").show();
            $dropdown.find(".arabica_ref-copied-text").removeClass("show");
          }, 5000);
        }.bind(this)).catch(function(err){ console.error(err); });
      });
      
      $dropdown.find(".arabica_ref-close-icon").on("click", function (e) {
        e.stopPropagation();
        $dropdown.removeClass("open");
      });
    },
    
    createDropdown: function($trigger, content, includeActions, additionalClass, options) {
      options = options || {};
      var direction = options.direction || utils.hasArabicText(content) ? "rtl" : "ltr";
      var skipTextWrapper = options.skipTextWrapper || false;
      
      var ddId = utils.generateId("arabica_dropdown");
      var dropdownHtml = utils.createDropdownHtml(ddId, content, direction, includeActions, skipTextWrapper);
      
      if (additionalClass) {
        dropdownHtml = dropdownHtml.replace('class="arabica_ref-dropdown', 'class="arabica_ref-dropdown ' + additionalClass);
      }
      
      $trigger.after(dropdownHtml);
      var $dropdown = $("#" + ddId);
      $trigger.data("dropdown-id", ddId);
      
      this.setupHoverEvents($trigger, $dropdown);
      
      if (includeActions) {
        this.setupCopyFunctionality($dropdown);
      }
      
      return $dropdown;
    }
  };
  
 var imageLayoutManager = {
  adjustLayout: function($dropdown) {
    var $row = $dropdown.find('.arabica_ref-row');
    if (!$row.length) return;

    var $img = $row.find('img');
    if (!$img.length) return;

    if ($img[0].naturalWidth) {
      this.checkImageRatio($img, $row);
      this.adjustDynamicLayout($dropdown);
    } else {
      $img.one('load', function() {
        imageLayoutManager.checkImageRatio($(this), $row);
        imageLayoutManager.adjustDynamicLayout($dropdown);
      });
    }

    this.observeResize($dropdown);
  },

  checkImageRatio: function($img, $row) {
    var width = $img[0].naturalWidth;
    var height = $img[0].naturalHeight;
    if (width > 0 && height > 0 && width / height > 1.3) {
      $row.addClass('landscape');
    }
  },

  adjustDynamicLayout: function($dropdown) {
    var $row = $dropdown.find('.arabica_ref-row');
    if (!$row.length || $row.hasClass('landscape')) return;

    var $text = $row.find('.arabica_ref-text');
    var $imageContainer = $row.find('.arabica_ref-image');
    var $img = $imageContainer.find('img');

    var textHeight = $text.outerHeight();

    $imageContainer.height(textHeight);
    $img.css({
      'height': textHeight,
      'width': 'auto',
      'object-fit': 'cover'
    });
  },

  observeResize: function($dropdown) {
    var el = $dropdown[0];
    if (!el || el._resizeObserver) return;

    var self = this;
    var observer = new ResizeObserver(function() {
      self.adjustDynamicLayout($dropdown);
    });

    observer.observe(el);
    el._resizeObserver = observer;
  },

  destroyObserver: function($dropdown) {
    var el = $dropdown[0];
    if (el && el._resizeObserver) {
      el._resizeObserver.disconnect();
      delete el._resizeObserver;
    }
  }
};
  
 // 1. Bracket Links Processor (full new)
var bracketProcessor = {
  // Helper: decode HTML entities (e.g., &#123;, &amp;, &quot;)
  decodeHtmlEntities: function(str) {
    var textArea = document.createElement('textarea');
    textArea.innerHTML = str;
    return textArea.value;
  },

  init: function() {
    var articleHtml = $article.html();

    // Normalize HTML entities for curly braces before processing
    articleHtml = articleHtml
        .replace(/&#123;/g, '{')
        .replace(/&#125;/g, '}')
        .replace(/&#x7[bB];/g, '{')
        .replace(/&#x7[dD];/g, '}');

    // Pass 1: Process anchors followed by {{…}} into interactive spans
    // Updated regex to allow optional footnote links between the #a link and {{...}}
    var linkBracketRegex = /((?:<(?:b|strong|em|i|span)\b[^>]*>\s*)?<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>(?:\s*<\/(?:b|strong|em|i|span)>)?)(\s*(?:<a\s+href="#_ftn\d+"[^>]*>\[\d+\]<\/a>\s*)*)?\s*\{\{([\s\S]*?)\}\}/gi;
    
    var processedHtml = articleHtml.replace(linkBracketRegex, function(match, fullLinkHtml, footnoteHtml, bracketContent) {
        // Extract the actual <a> tag from within potential wrapper
        var anchorMatch = fullLinkHtml.match(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>/i);
        if (!anchorMatch) return match;
        
        var $tempLink = $(anchorMatch[0]);
        var href = $tempLink.attr('href');

        var isInternal = href && (
            href === "#" ||
            href === "#a" ||
            href === "#1" ||
            (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//'))
        );
        if (!isInternal) return match;

        var linkText = $tempLink.html().trim();

        var decodedBracketContent = this.decodeHtmlEntities(bracketContent);
        var processedContent = decodedBracketContent;
        var refTitle = linkText;

        var titleMatch = this.extractTitle(decodedBracketContent);
        if (titleMatch) {
            refTitle = titleMatch.title;
            processedContent = titleMatch.content;
        }

        var spanId = utils.generateId("arabica_bracket-span");
        var dataContent = processedContent.replace(/"/g, '&quot;');
        var dataTitle = refTitle.replace(/"/g, '&quot;');

        // Move wrapper tags INSIDE the span to preserve styling on text only
        var innerWrapperStart = '';
        var innerWrapperEnd = '';
        var wrapperMatch = fullLinkHtml.match(/^<(b|strong|em|i|span)\b[^>]*>/i);
        if (wrapperMatch) {
            innerWrapperStart = wrapperMatch[0];
            var tagName = wrapperMatch[1];
            innerWrapperEnd = '</' + tagName + '>';
        }

        // Preserve the footnote link if it exists (trim to remove extra whitespace)
        var footnoteOutput = footnoteHtml ? footnoteHtml.trim() : '';

        return (
            '<span id="' + spanId + '" class="arabica_bracket-span" ' +
            'style="text-decoration: underline; text-decoration-color: #c93; cursor: pointer;" ' +
            'data-bracket-content="' + dataContent + '" ' +
            'data-link-text="' + dataTitle + '">' +
            innerWrapperStart +
            linkText +
            innerWrapperEnd +
            '</span>' +
            footnoteOutput
        );
    }.bind(this));

    // Pass 2: Turn <a href="#a">…</a> with NO {{…}} after it into plain text
    // Also updated to account for optional footnote between link and potential {{
    // Remove the trailing whitespace from the regex to prevent space insertion
    processedHtml = processedHtml.replace(
        /<a\b([^>]*\bhref\s*=\s*["'](?:#|#a|#1)["'][^>]*)>([\s\S]*?)<\/a>(?!\s*(?:<a\s+href="#_ftn\d+"[^>]*>\[\d+\]<\/a>\s*)?\s*\{\{)/gi,
        function(_match, attrs, innerHtml) {
            var $tmp = $('<a ' + attrs + '>' + innerHtml + '</a>');
            return $tmp.text();
        }
    );

    $article.html(processedHtml);
    $article.trigger('content-modified');

    this.setupBracketSpans();
  },

  // Pull out an optional title at the start of the bracket block.
  // Supports:
  //   <strong>Title</strong>: content
  //   <strong>Title:</strong> content
  // (also works with <b>…</b>)
  extractTitle: function(bracketContent) {
    var trimmed = bracketContent.trim();

    // Pattern 1: <strong>Title</strong>:
    var pattern1 = /^<(b|strong)>([^<]+)<\/\1>\s*:\s*([\s\S]*)$/i;

    // Pattern 2: <strong>Title:</strong>
    var pattern2 = /^<(b|strong)>([^<]+?):\s*<\/\1>\s*([\s\S]*)$/i;

    var m = trimmed.match(pattern1);
    if (m) {
      return { title: m[2].trim(), content: m[3].trim() };
    }

    m = trimmed.match(pattern2);
    if (m) {
      return { title: m[2].trim(), content: m[3].trim() };
    }

    return null; // no title pattern found
  },

  setupBracketSpans: function() {
    $article.find('.arabica_bracket-span').each(function() {
      var $span = $(this);
      var bracketContent = $span.data('bracket-content');
      var linkText = $span.data('link-text');
      var linkTextPlain = linkText.replace(/<[^>]*>/g, '');

      var dir = utils.hasArabicText(bracketContent) ? 'rtl' : 'ltr';
      var titleHtml = '<div class="arabica_ref-title">' + linkTextPlain + '</div>';
      var contentHtml =
        '<div class="arabica_ref-wrapper" dir="' + dir + '">' +
        titleHtml + bracketContent +
        '</div>';

      var $dropdown = dropdownManager.createDropdown($span, contentHtml, false, 'arabica_bracket-dropdown');

      $span.on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if ($dropdown.hasClass('open')) {
          $dropdown.removeClass('open');
        } else {
          $('.arabica_ref-dropdown.open').not($dropdown).removeClass('open');
          dropdownManager.position($span, $dropdown);
          $dropdown.addClass('open');
        }
      });
    });
  }
};

  
  // 2. Footnote Processor
  var footnoteProcessor = {
    init: function() {
      var ftnRefs = this.extractFootnotes();
      this.setupFootnoteLinks(ftnRefs);
    },
    
    extractFootnotes: function() {
      var ftnRefs = {};
      var $ftns = $('a[name^="_ftn"]:not([name^="_ftnref"])');
      
      $ftns.each(function () {
        var $ftnAnchor = $(this);
        var name = $ftnAnchor.attr("name");
        var key = name.replace("_ftn", "");
        var $p = $ftnAnchor.closest("p");
        
        if ($p.length) {
          var $clonedP = $p.clone();
          $clonedP.find('a[name^="_ftn"]:not([name^="_ftnref"])').remove();
          var txt = $clonedP.prop('outerHTML');
          
          var $current = $p.next();
          while ($current.length && ["P", "UL", "OL", "DIV"].indexOf($current.prop("tagName")) !== -1) {
            if ($current.find('a[name^="_ftn"]:not([name^="_ftnref"])').length) {
              break;
            }
            txt += $current.prop('outerHTML');
            $current = $current.next();
          }
          
          ftnRefs[key] = txt.trim();
        }
      });
      
      return ftnRefs;
    },
    
    setupFootnoteLinks: function(ftnRefs) {
      $article.find('a[name^="_ftnref"]').each(function () {
        var $ftnrefLink = $(this);
        var key = $ftnrefLink.attr("name").replace("_ftnref", "");
        var refText = ftnRefs[key];
        
        if (refText) {
          var $dropdown = dropdownManager.createDropdown($ftnrefLink, refText, true, 'arabica_ftn-dropdown');
          
          // Allow normal link click behavior
          $ftnrefLink.on('click', function(e) {
            return true;
          });
        }
      });
    }
  };
  
  // 3. Cross-page Link Processor (with image layout adjustment)
  var linkProcessor = {
  linkContentCache: {},

  init: function() {
    this.setupCrossPageLinks();
  },

  isValidInternalLink: function(href) {
  if (!href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')) {
    return false;
  }

  // Check if it's an absolute URL
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    try {
      var url = new URL(href, window.location.origin);
      // If the hostname doesn't match, it's external
      if (url.hostname !== window.location.hostname) {
        return false;
      }
      // If hostname matches, continue to check file extension below
    } catch (e) {
      return false;
    }
  }

  // Check if it's a file download link
  var fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|jpg|jpeg|png|gif|mp3|mp4|avi|svg|webp)$/i;
  return !fileExtensions.test(href);
},

  setupCrossPageLinks: function() {
    var self = this;
    $article.find('a[href]').each(function() {
      var $link = $(this);
      var href = $link.attr('href');

      if (!self.isValidInternalLink(href) || $link.data('dropdown-processed')) {
        return;
      }

      $link.data('dropdown-processed', true);
      self.setupLinkHover($link, href);
    });
  },

  setupLinkHover: function($link, href) {
    var self = this;
    var showTimer, hideTimer;
    var isContentFetched = false;

    function openDropdown() {
      $('.arabica_ref-dropdown.open').removeClass('open');
      var ddId = $link.data('dropdown-id');
      if (!ddId) return;
      var $dd = $('#' + ddId);
      dropdownManager.position($link, $dd);
      $dd.addClass('open');
    }

    function onMouseEnter(e) {
  // Check if editor class exists before proceeding
  if ($('body').hasClass('editor')) {
    return;
  }
  
  e.stopPropagation();
  clearTimeout(hideTimer);
  clearTimeout(showTimer);

  if (isContentFetched && $link.data('dropdown-id')) {
    showTimer = setTimeout(openDropdown, 300);
    return;
  }

  if (!isContentFetched) {
    isContentFetched = true;
    self.fetchPageContent($link, href, function() {
      if ($link.data('dropdown-id') && $link.is(':hover')) {
        showTimer = setTimeout(openDropdown, 300);
      }
      if (!$link.data('dropdown-id')) {
        $link.off('mouseenter', onMouseEnter);
        $link.off('mouseleave', onMouseLeave);
      }
    });
  }
}


    function onMouseLeave() {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function() {
        var ddId = $link.data('dropdown-id');
        if (ddId) {
          var $dd = $('#' + ddId);
          if (!$dd.is(':hover') && !$link.is(':hover')) {
            $dd.removeClass('open');
          }
        }
      }, 300);
    }

    $link.on('mouseenter', onMouseEnter);
    $link.on('mouseleave', onMouseLeave);
    $link.off('click').on('click', function() {
      return true;
    });
  },

  fetchPageContent: function($link, url, callback) {
    var self = this;

    if (self.linkContentCache[url] !== undefined) {
      if (self.linkContentCache[url]) {
        var $dropdown = dropdownManager.createDropdown(
          $link,
          self.linkContentCache[url],
          false,
          'arabica_link-dropdown',
          { skipTextWrapper: true }
        );
        imageLayoutManager.adjustLayout($dropdown);
      }
      if (callback) callback();
      return;
    }

    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'html',
      timeout: 5000,
      success: function(data) {
        var content = null;
        try {
          content = self.extractFactsContent(data, url);
        } catch (err) {
          console.error('Error extracting content:', err);
        }
        self.linkContentCache[url] = content;

        if (content) {
          var $dropdown = dropdownManager.createDropdown(
            $link,
            content,
            false,
            'arabica_link-dropdown',
            { skipTextWrapper: true }
          );
          imageLayoutManager.adjustLayout($dropdown);
        }
        if (callback) callback();
      },
      error: function() {
        self.linkContentCache[url] = null;
        if (callback) callback();
      }
    });
  },

  extractFactsContent: function(data, pageUrl) {
    var $page = $(data);
    var content = '';

    function cleanTemplates(text) {
      return text
        .replace(/\{\{[\s\S]*?\}\}/g, '')
        .replace(/\[(\d+)\]/g, '');
    }

    var pageTitle = $page.find('h1').first().text().trim();

    var imageUrl = null;
    var $imgCont = $page.find('#FactsDiv .arabica_article-image');
    if ($imgCont.length) {
      var $img = $imgCont.find('img').first();
      if ($img.length) imageUrl = $img.attr('src');
    }

    var direction = utils.hasArabicText(pageTitle) ? 'rtl' : 'ltr';

    var textContent = '<div class="arabica_ref-text" dir="' + direction + '">' +
                        '<div class="arabica_ref-title">' + pageTitle + '</div>';

    var $p = $page.find('#ctl00_PlaceHolderMain_ctl02__ControlWrapper_RichHtmlField p').first();
    if ($p.length) {
      var raw = cleanTemplates( $p.text().trim() );
      var truncated = raw.length > 200 ? raw.slice(0, 200).trim() + '…' : raw;
      var paraDir = utils.hasArabicText(raw) ? 'rtl' : 'ltr';
      textContent += $('<p>').attr('dir', paraDir).text(truncated).prop('outerHTML');
    }

    textContent += '<div class="arabica_ref-more"><a href="' + pageUrl + '">اقرأ المزيد</a></div></div>';

    if (imageUrl) {
      content = '<div class="arabica_ref-row">' +
                  '<div class="arabica_ref-image">' +
                    '<a href="' + pageUrl + '">' +
                      '<img src="' + imageUrl + '" alt="' +
                        pageTitle.replace(/"/g, '&quot;') +
                      '">' +
                    '</a>' +
                  '</div>' +
                  textContent +
                '</div>';
    } else {
      content = textContent;
    }

    return content;
  }
};

  // Initialize on document ready
  $(document).ready(function() {
    linkProcessor.init();
  });
  
  // 4. Endnote Processor
  var endnoteProcessor = {
    init: function() {
      var ednRefs = this.extractEndnotes();
      this.setupEndnoteLinks(ednRefs);
      this.setupEndnoteEvents();
    },
    
    extractEndnotes: function() {
      var ednRefs = {};
      var $ends = $article.find('p:has(a[name^="_edn"]:not([name^="_ednref"]))');
      
      $ends.each(function () {
        var $p = $(this);
        var name = $p.find('a[name^="_edn"]:not([name^="_ednref"])').attr("name");
        var key = name.replace("_edn", "");
        var txt = $p.prop('outerHTML');
        var $n = $p.next();
        
        while ($n.length && ["P", "UL", "OL"].indexOf($n.prop("tagName")) !== -1) {
          if ($n.is("p") && $n.find('a[name^="_edn"]:not([name^="_ednref"])').length) break;
          txt += $n.prop('outerHTML');
          $n = $n.next();
        }
        ednRefs[key] = txt.trim();
        
        // Remove the endnote content from the article
        var toRm = [$p];
        $n = $p.next();
        while ($n.length && ["P", "UL", "OL"].indexOf($n.prop("tagName")) !== -1) {
          if ($n.is("p") && $n.find('a[name^="_edn"]:not([name^="_ednref"])').length) break;
          toRm.push($n);
          $n = $n.next();
        }
        for (var x = 0; x < toRm.length; x++) toRm[x].remove();
      });
      
      return ednRefs;
    },
    
    setupEndnoteLinks: function(ednRefs) {
      var self = this;
      
      $article.find('a[name^="_ednref"]').each(function () {
        var $lnk = $(this);
        var key = $lnk.attr("name").replace("_ednref", "");
        var refText = ednRefs[key] || "";
        
        if (refText) {
          var dir = utils.hasArabicText(refText) ? "rtl" : "ltr";
          var ddId = utils.generateId("arabica_edn-dropdown");
          
          var html =
            '<a class="arabica_ref-icon" data-ref-id="' + ddId + '" data-reference="' + refText.replace(/"/g, '&quot;') + '">' +
              '<i class="fa-light fa-circle-info arabica_ref-icon-light active"></i>' +
              '<i class="fa-solid fa-circle-info arabica_ref-icon-solid inactive"></i>' +
            "</a>" +
            '<div id="' + ddId + '" class="arabica_ref-dropdown arabica_edn-dropdown">' +
              '<div class="arabica_ref-actions">' +
                '<span class="arabica_ref-copy-icon" title="نسخ"><i class="fa-regular fa-copy"></i></span>' +
                '<span class="arabica_ref-copied-text">✓ تم النسخ</span>' +
                '<span class="arabica_ref-close-icon" title="إغلاق"><i class="fa-regular fa-circle-xmark"></i></span>' +
              "</div>" +
              '<div class="arabica_ref-text" dir="' + dir + '"><span dir="' + dir + '">' + refText + "</span></div>" +
            "</div>";
          
          $lnk.replaceWith(html);
        }
      });
    },
    
    resetIconStyles: function($icon) {
      $icon.find(".arabica_ref-icon-solid").removeClass("active").addClass("inactive");
      $icon.find(".arabica_ref-icon-light").removeClass("inactive").addClass("active");
    },
    
    setIconActive: function($icon) {
      $icon.find(".arabica_ref-icon-light").removeClass("active").addClass("inactive");
      $icon.find(".arabica_ref-icon-solid").removeClass("inactive").addClass("active");
    },
    
    closeAllEndnoteDropdowns: function() {
      var self = this;
      $(".arabica_edn-dropdown.open").each(function () {
        var $d = $(this);
        $d.removeClass("open");
        var $icon = $d.prev(".arabica_ref-icon");
        if ($icon.length) {
          self.resetIconStyles($icon);
        }
      });
    },
    
    setupEndnoteEvents: function() {
      var self = this;
      
      $article.find(".arabica_ref-icon").each(function () {
        var $icon = $(this);
        var ddId = $icon.data("ref-id");
        var $dd = $("#" + ddId);
        
        // Prevent dropdown clicks from bubbling
        $dd.on("click", function (e) { e.stopPropagation(); });
        
        // Icon click handler
        $icon.on("click", function (e) {
          e.stopPropagation();
          if ($dd.hasClass("open")) {
            $dd.removeClass("open");
            self.resetIconStyles($icon);
          } else {
            self.closeAllEndnoteDropdowns();
            dropdownManager.position($icon, $dd);
            $dd.addClass("open");
            self.setIconActive($icon);
          }
        });
        
        // Icon hover handlers
        $icon.on("mouseenter", function () {
          if (!$dd.hasClass("open")) {
            self.setIconActive($icon);
          }
        });
        
        $icon.on("mouseleave", function () {
          if (!$dd.hasClass("open")) {
            self.resetIconStyles($icon);
          }
        });
        
        // Close button handler
        $dd.find(".arabica_ref-close-icon").on("click", function (e) {
          e.stopPropagation();
          $dd.removeClass("open");
          self.resetIconStyles($icon);
        });
        
        // Copy functionality
        dropdownManager.setupCopyFunctionality($dd);
      });
    }
  };
  
  // Enhanced global events to handle endnote dropdowns
  var globalEvents = {
    init: function() {
      var self = this;
      
      // Close all dropdowns when clicking elsewhere
      $(document).on("click", function(e) {
        if (!$(e.target).closest(".arabica_ref-dropdown, .arabica_bracket-span, a[name^='_ftnref'], a[href], .arabica_ref-icon").length) {
          $(".arabica_ref-dropdown.open").removeClass("open");
          self.resetAllEndnoteIcons();
        }
      });
      
      // Close on ESC key
      $(document).on("keydown", function (e) {
        if (e.key === "Escape") {
          $(".arabica_ref-dropdown.open").removeClass("open");
          self.resetAllEndnoteIcons();
        }
      });
    },
    
    resetAllEndnoteIcons: function() {
      $(".arabica_ref-icon").each(function() {
        var $icon = $(this);
        var ddId = $icon.data("ref-id");
        var $dd = $("#" + ddId);
        if (!$dd.hasClass("open")) {
          endnoteProcessor.resetIconStyles($icon);
        }
      });
    }
  };

  // Initialize all processors
  bracketProcessor.init();
  footnoteProcessor.init();
  linkProcessor.init();
  endnoteProcessor.init();
  globalEvents.init();
  moveFootnoteParagraphs();

})();
  
  // Side content & floating button
  var $toggleBtn = $(".arabica_floating-btn");
  var $sideContent = $(".arabica_side-content");
  var $closeBtn = $(".arabica_close-button");
  var $overlay = $(".arabica_overlay");

  var openSideContent = function () {
    $sideContent.addClass("arabica_show-content");
    $overlay.addClass("arabica_show-overlay");
    $("body").addClass("no-scroll");
  };
  var closeSideContent = function () {
    $sideContent.removeClass("arabica_show-content");
    $overlay.removeClass("arabica_show-overlay");
    $("body").removeClass("no-scroll");
  };

  $toggleBtn.on("click", openSideContent);
  $closeBtn.on("click", closeSideContent);
  $overlay.on("click", closeSideContent);
  $(document).on("keydown", function (e) {
    if (e.key === "Escape") closeSideContent();
  });
  $sideContent.on("click", "a", closeSideContent);

  // Footer toggle visibility
  var $footerWrapper = $(".arabica_footer");
  var checkToggleBtnVisibility = function () {
    if (!$footerWrapper.length) return;
    var footerTop = $footerWrapper.offset().top;
    if (footerTop < window.innerHeight) $toggleBtn.addClass("hidden");
    else $toggleBtn.removeClass("hidden");
  };
  $(window).on("scroll resize", checkToggleBtnVisibility);
  checkToggleBtnVisibility();

  // Float styling
  $('[class*="float-right-"], [class*="float-left-"]').each(function () {
    var $el = $(this);
    var match = $el.attr("class").match(/float-(right|left)-(\d+)/);
    if (match) {
      var dir = match[1], w = match[2] + "%";
      $el.css({ width: w, float: dir, marginBottom: "0" });
    }
  });

  // Sticky sidebar - starts when scroll reaches .arabica_overlay
(function () {
  var $sidebar = $(".arabica_sticky-sidebar");
  var $overlay = $(".arabica_overlay");
  var lastScrollY = $(window).scrollTop();
  var currentTranslation = 0;
  var stickyStartPoint = 0;

  function calculateStickyStart() {
    // Get the offset of overlay from top of document
    stickyStartPoint = $overlay.offset().top;
  }

  function updateSidebarPosition() {
    if (window.innerWidth <= 991) {
      $sidebar.css("position", "static");
      $overlay.css("transform", "none");
      return;
    }

    var scrollY = $(window).scrollTop();
    var viewportH = $(window).height();
    var overlayH = $overlay.outerHeight();
    var maxTrans = overlayH - viewportH;

    // Only apply sticky behavior after reaching the overlay
    if (scrollY < stickyStartPoint) {
      $sidebar.css({ position: "sticky", top: "0px", height: "fit-content" });
      $overlay.css({ transform: "none", paddingBottom: "0" });
      currentTranslation = 0;
      lastScrollY = scrollY;
      return;
    }

    if (scrollY + viewportH >= $(document).height() - 1) {
      currentTranslation = maxTrans;
    } else {
      var delta = scrollY - lastScrollY;
      if (delta > 0) currentTranslation = Math.min(currentTranslation + delta, maxTrans);
      else if (delta < 0) currentTranslation = Math.max(currentTranslation + delta, 0);
    }

    $sidebar.css({ position: "sticky", top: "0px", height: "fit-content" });
    $overlay.css({ transform: "translateY(-" + currentTranslation + "px)", paddingBottom: "30px" });
    lastScrollY = scrollY;
  }

  // Calculate on load and resize
  calculateStickyStart();
  $(window).on("resize", calculateStickyStart);
  $(window).on("scroll resize", updateSidebarPosition);
  updateSidebarPosition();
})();
});

$(function() {
  $('.arabica_author-name').on('click', function(e) {
    e.preventDefault();

    const $info = $(this).closest('.arabica_author-info');
    const name  = $(this).text().trim();
    const bio   = $info.find('.arabica_author-bio').html().trim();
    const lin   = $info.find('.linkedin').text().trim();
    const tw    = $info.find('.x-twitter').text().trim();

    // Fill modal
    $('.arabica_modal-content .author-name').text(name);
    $('.arabica_modal-content .author-bio').html(bio);

    // Build controls row
    const $ctrl = $('.author-controls').empty();
    // search link
    const query = encodeURIComponent(name);
    $ctrl.append(`
      <a href="/pages/articlelisting.aspx?q=${query}" class="search-link" title="بحث عن المؤلف">
        <i class="fa-light fa-list-ol"></i>
        مداخل المؤلف
      </a>
    `);
    // socials (only if non-empty)
    if (lin) {
      $ctrl.append(`
        <a href="${lin}" target="_blank" class="social-icon" title="LinkedIn">
          <i class="fab fa-linkedin-in"></i>
        </a>
      `);
    }
    if (tw) {
      $ctrl.append(`
        <a href="${tw}" target="_blank" class="social-icon" title="X">
          <i class="fa-brands fa-x-twitter"></i>
        </a>
      `);
    }

    // Show modal + disable page scroll
    $('body').addClass('no-scroll');
    $('.arabica_author-modal')
      .fadeIn(200)
      .addClass('active');
  });

  // Close helper
  function closeModal() {
    $('.arabica_author-modal')
      .removeClass('active')
      .fadeOut(200, function() {
        $('body').removeClass('no-scroll');
      });
  }
  // Close on "×"
  $('.close-modal').on('click', closeModal);

  // Close on ESC
  $(document).on('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
  
   // Close when clicking outside the white box
  $('.arabica_author-modal').on('click', function(e) {
    if ($(e.target).is('.arabica_author-modal')) {
      closeModal();
    }
  });
});

function makeExternalLinksOpenInNewTab() {
  $('.arabica_article-content a[href], .arabica_article-foot-wrapper a[href]').each(function() {
    var href = $(this).attr('href');
    if (href && (isExternalLink(href) || isFileDownload(href))) {
      $(this).attr({'target': '_blank', 'rel': 'noopener noreferrer'});
    }
  });
}

function isExternalLink(href) {
  // Skip anchor links, mailto, tel
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  
  // Relative paths are internal
  if (href.charAt(0) === '/' || href.charAt(0) === '?' || href.charAt(0) === '.') {
    return false;
  }
  
  // Protocol-relative URLs
  if (href.indexOf('//') === 0) {
    return href.indexOf(window.location.hostname) === -1;
  }
  
  // Absolute URLs
  if (href.indexOf('http') === 0) {
    var a = document.createElement('a');
    a.href = href;
    return a.hostname !== window.location.hostname;
  }
  
  // Other protocols (ftp:, etc.)
  return href.indexOf(':') !== -1;
}

function isFileDownload(href) {
  var fileExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|jpg|jpeg|png|gif|mp3|mp4|avi|svg|webp)$/i;
  return fileExtensions.test(href);
}

$(document).ready(makeExternalLinksOpenInNewTab);

$(document).ready(function () {
  $(".ms-rte-wpbox").each(function () {
    var $wpbox = $(this);
    if ($wpbox.find("[id$='_pnlEditMode']").length > 0) {
      return; 
    }
    var $preview = $wpbox.find("[id$='_galleryPreview']").first();
    if ($preview.length) {
      $wpbox.html($preview);
    }
  });
});

$(document).ready(function () {

  const $containers = $(".arabica_foot-reference, .arabica_article-sources");

  $containers.each(function () {
    const $container = $(this);
    const $h2s = $container.find("h2");

    $h2s.each(function (index) {
      const $h2 = $(this);
      const sectionTitle = $h2.text().trim();
      const $content = $h2.nextUntil("h2");

      const sectionId = $h2.attr("id") || "";

$h2.replaceWith(`
  <div class="arabica_ref-toggle">
    <h2 id="${sectionId}">${sectionTitle}</h2>
    <div class="arabica_ref-icon-wrapper">
      <i class="fa-regular fa-chevron-down chevron-icon"></i>
    </div>
  </div>
`);


      // Wrap content (without <hr> for now)
      $content.wrapAll(`
        <div class="arabica_ref-wrapper">
          <div class="arabica_ref-body"></div>
        </div>
      `);

      // Add <hr> only if NOT last h2
      if (index < $h2s.length - 1) {
        $content.parent().after("<hr>");
      }
    });
  });

  // Toggle open/close
  $(document).on("click", ".arabica_ref-toggle", function () {
    $(this).toggleClass("active");
    $(this).next(".arabica_ref-wrapper").find(".arabica_ref-body").slideToggle(250);
  });
  
});


function applyDirections() {
    $('.ms-rteStyle-LTR').attr('dir', 'ltr');
    $('.ms-rteStyle-RTL').attr('dir', 'rtl');
}

$(document).ready(function () {
    applyDirections();

    // Watch for new elements added to the page
    new MutationObserver(applyDirections)
        .observe(document.body, { childList: true, subtree: true });
});

// Reading Time Calculator
$(document).ready(function () {
  var $readingTimeLabel = $("#articleReadingTime");
  var $articleContent = $(".arabica_article-content");
  
  if ($readingTimeLabel.length && $articleContent.length) {
    // Clone the article content
    var $contentClone = $articleContent.clone();
    
    // Get text before references
    var $h2s = $contentClone.find("h2");
    var referenceTitles = ["المراجع", "المراج​​ع", "المرا​جع"];
    var referenceIndex = -1;
    
    $h2s.each(function(index) {
      var headingText = $(this).text().trim();
      
      for (var j = 0; j < referenceTitles.length; j++) {
        if (headingText.indexOf(referenceTitles[j]) !== -1) {
          referenceIndex = index;
          return false;
        }
      }
    });
    
    // Remove everything from reference onwards
    if (referenceIndex !== -1) {
      $h2s.slice(referenceIndex).each(function() {
        $(this).nextAll().remove();
        $(this).remove();
      });
    }
    
    // Count words
    var textContent = $contentClone.text().trim();
    var wordCount = textContent.split(/\s+/).filter(function(word) {
      return word.length > 0;
    }).length;
    
    // Calculate time (160 words per minute)
    var totalSeconds = Math.ceil((wordCount / 160) * 60);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    
    // Format seconds with leading zero if needed
    var secondsFormatted = seconds < 10 ? '0' + seconds : seconds;
    
    // Display in format "10:12 د"
    $readingTimeLabel.text(minutes + ':' + secondsFormatted + ' د');
  }
});

// Add name href to links # and #a
function addHrefName() {
  $('.arabica_article-content a').each(function () {
    const href = $(this).attr('href');

    if ((href === '#' || href === '#a') && !this.hasAttribute('name')) {
      this.setAttribute('name', 'href');
    }
  });
}

$(document).ready(function () {
  addHrefName();

  const target = document.querySelector('.arabica_article-content');
  if (!target) return;

  new MutationObserver(function () {
    addHrefName();
  }).observe(target, {
    childList: true,
    subtree: true
  });
});