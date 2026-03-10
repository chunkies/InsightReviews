(function () {
  'use strict';

  var WIDGET_VERSION = '1.0.0';

  function initWidget() {
    var container = document.getElementById('insightreviews-widget');
    if (!container) return;

    var slug = container.getAttribute('data-slug');
    if (!slug) {
      console.error('InsightReviews Widget: data-slug attribute is required.');
      return;
    }

    var theme = container.getAttribute('data-theme') || 'light';
    var maxReviews = parseInt(container.getAttribute('data-max') || '5', 10);
    var layout = container.getAttribute('data-layout') || 'carousel';
    var siteUrl = container.getAttribute('data-url') || detectSiteUrl();

    if (!siteUrl) {
      console.error('InsightReviews Widget: Could not detect API URL. Set data-url on the widget div.');
      return;
    }

    fetchReviews(siteUrl, slug, function (data) {
      if (!data || !data.reviews) {
        console.error('InsightReviews Widget: Failed to load reviews.');
        return;
      }

      var reviews = data.reviews.slice(0, maxReviews);
      var business = data.business;
      var avgRating = calcAvgRating(data.reviews);
      var totalCount = data.reviews.length;

      renderWidget(container, {
        reviews: reviews,
        business: business,
        avgRating: avgRating,
        totalCount: totalCount,
        theme: theme,
        layout: layout,
        siteUrl: siteUrl,
        slug: slug,
      });
    });
  }

  function detectSiteUrl() {
    var scripts = document.querySelectorAll('script[src*="widget.js"]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src) {
        try {
          var url = new URL(src, window.location.href);
          return url.origin;
        } catch (e) { /* ignore */ }
      }
    }
    return null;
  }

  function fetchReviews(siteUrl, slug, callback) {
    var url = siteUrl.replace(/\/$/, '') + '/api/embed/' + encodeURIComponent(slug);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            callback(JSON.parse(xhr.responseText));
          } catch (e) {
            callback(null);
          }
        } else {
          callback(null);
        }
      }
    };
    xhr.send();
  }

  function calcAvgRating(reviews) {
    if (!reviews.length) return 0;
    var sum = 0;
    for (var i = 0; i < reviews.length; i++) {
      sum += reviews[i].rating;
    }
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  function renderStars(rating, size) {
    size = size || 16;
    var html = '';
    for (var i = 1; i <= 5; i++) {
      var fill = i <= rating ? '#facc15' : '#d1d5db';
      html += '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + fill + '" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">' +
        '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' +
        '</svg>';
    }
    return html;
  }

  function formatDate(dateStr) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ── Theme colors ── */

  function getColors(theme) {
    if (theme === 'dark') {
      return {
        bg: '#1e1e2e',
        cardBg: '#2a2a3c',
        text: '#e2e2e9',
        textSecondary: '#a0a0b0',
        border: '#3a3a4c',
        accent: '#818cf8',
        shadow: 'rgba(0,0,0,0.4)',
        badgeBg: '#2a2a3c',
        badgeText: '#e2e2e9',
      };
    }
    return {
      bg: '#ffffff',
      cardBg: '#ffffff',
      text: '#1a1a2e',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      accent: '#6366f1',
      shadow: 'rgba(0,0,0,0.08)',
      badgeBg: '#ffffff',
      badgeText: '#1a1a2e',
    };
  }

  /* ── Render main widget ── */

  function renderWidget(container, opts) {
    var shadow = container.attachShadow({ mode: 'open' });
    var c = getColors(opts.theme);

    var wrapper = document.createElement('div');
    wrapper.setAttribute('style', 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.5;');

    if (opts.layout === 'badge') {
      renderBadge(wrapper, opts, c);
    } else if (opts.layout === 'grid') {
      renderGrid(wrapper, opts, c);
    } else {
      renderCarousel(wrapper, opts, c);
    }

    shadow.appendChild(wrapper);
  }

  /* ── Badge layout ── */

  function renderBadge(wrapper, opts, c) {
    var expanded = false;

    var badge = document.createElement('div');
    badge.setAttribute('style',
      'display:inline-flex;align-items:center;gap:8px;padding:10px 18px;' +
      'background:' + c.badgeBg + ';border:1px solid ' + c.border + ';' +
      'border-radius:50px;cursor:pointer;box-shadow:0 2px 8px ' + c.shadow + ';' +
      'transition:transform 0.2s,box-shadow 0.2s;user-select:none;'
    );
    badge.innerHTML =
      '<span style="font-weight:700;font-size:16px;color:' + c.badgeText + ';">' + opts.avgRating + '</span>' +
      renderStars(Math.round(opts.avgRating), 16) +
      '<span style="font-size:13px;color:' + c.textSecondary + ';">(' + opts.totalCount + ' review' + (opts.totalCount !== 1 ? 's' : '') + ')</span>';

    badge.addEventListener('mouseenter', function () {
      badge.style.transform = 'scale(1.03)';
      badge.style.boxShadow = '0 4px 16px ' + c.shadow;
    });
    badge.addEventListener('mouseleave', function () {
      badge.style.transform = 'scale(1)';
      badge.style.boxShadow = '0 2px 8px ' + c.shadow;
    });

    var expandPanel = document.createElement('div');
    expandPanel.setAttribute('style',
      'max-height:0;overflow:hidden;transition:max-height 0.35s ease,opacity 0.3s ease;opacity:0;' +
      'margin-top:8px;'
    );

    var panelInner = document.createElement('div');
    panelInner.setAttribute('style',
      'background:' + c.bg + ';border:1px solid ' + c.border + ';border-radius:12px;' +
      'padding:16px;box-shadow:0 4px 16px ' + c.shadow + ';'
    );

    if (opts.business.name) {
      panelInner.innerHTML += '<div style="font-weight:600;font-size:15px;color:' + c.text + ';margin-bottom:12px;">' +
        escapeHtml(opts.business.name) + ' Reviews</div>';
    }

    for (var i = 0; i < opts.reviews.length; i++) {
      panelInner.innerHTML += buildReviewCard(opts.reviews[i], c, true);
    }

    if (opts.totalCount === 0) {
      panelInner.innerHTML += '<div style="color:' + c.textSecondary + ';font-size:14px;text-align:center;padding:16px 0;">No reviews yet</div>';
    }

    expandPanel.appendChild(panelInner);

    badge.addEventListener('click', function () {
      expanded = !expanded;
      if (expanded) {
        expandPanel.style.maxHeight = (panelInner.offsetHeight + 40) + 'px';
        expandPanel.style.opacity = '1';
      } else {
        expandPanel.style.maxHeight = '0';
        expandPanel.style.opacity = '0';
      }
    });

    wrapper.appendChild(badge);
    wrapper.appendChild(expandPanel);
  }

  /* ── Grid layout ── */

  function renderGrid(wrapper, opts, c) {
    var header = document.createElement('div');
    header.setAttribute('style',
      'display:flex;align-items:center;gap:10px;margin-bottom:16px;'
    );
    header.innerHTML =
      '<span style="font-weight:700;font-size:20px;color:' + c.text + ';">' + opts.avgRating + '</span>' +
      renderStars(Math.round(opts.avgRating), 20) +
      '<span style="font-size:14px;color:' + c.textSecondary + ';">Based on ' + opts.totalCount + ' review' + (opts.totalCount !== 1 ? 's' : '') + '</span>';

    var grid = document.createElement('div');
    grid.setAttribute('style',
      'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;'
    );

    for (var i = 0; i < opts.reviews.length; i++) {
      grid.innerHTML += buildReviewCard(opts.reviews[i], c, false);
    }

    if (opts.reviews.length === 0) {
      grid.innerHTML = '<div style="color:' + c.textSecondary + ';font-size:14px;grid-column:1/-1;text-align:center;padding:32px 0;">No reviews yet</div>';
    }

    wrapper.appendChild(header);
    wrapper.appendChild(grid);
  }

  /* ── Carousel layout ── */

  function renderCarousel(wrapper, opts, c) {
    var header = document.createElement('div');
    header.setAttribute('style',
      'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;'
    );
    header.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span style="font-weight:700;font-size:20px;color:' + c.text + ';">' + opts.avgRating + '</span>' +
        renderStars(Math.round(opts.avgRating), 20) +
        '<span style="font-size:14px;color:' + c.textSecondary + ';">(' + opts.totalCount + ')</span>' +
      '</div>' +
      '<div class="ir-nav" style="display:flex;gap:6px;"></div>';

    wrapper.appendChild(header);

    var track = document.createElement('div');
    track.setAttribute('style',
      'display:flex;gap:16px;overflow-x:auto;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;' +
      'scrollbar-width:none;padding:4px 0;'
    );

    // Hide scrollbar via style element in shadow DOM
    var style = document.createElement('style');
    style.textContent = ':host { display: block; } div::-webkit-scrollbar { display: none; }';
    wrapper.insertBefore(style, wrapper.firstChild);

    for (var i = 0; i < opts.reviews.length; i++) {
      var card = document.createElement('div');
      card.setAttribute('style',
        'min-width:300px;max-width:340px;flex-shrink:0;'
      );
      card.innerHTML = buildReviewCard(opts.reviews[i], c, false);
      track.appendChild(card);
    }

    if (opts.reviews.length === 0) {
      track.innerHTML = '<div style="color:' + c.textSecondary + ';font-size:14px;text-align:center;padding:32px 16px;width:100%;">No reviews yet</div>';
    }

    wrapper.appendChild(track);

    // Navigation buttons
    if (opts.reviews.length > 1) {
      var navContainer = wrapper.querySelector('.ir-nav');

      var prevBtn = buildNavButton('←', c);
      var nextBtn = buildNavButton('→', c);

      prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -320, behavior: 'smooth' });
      });
      nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: 320, behavior: 'smooth' });
      });

      navContainer.appendChild(prevBtn);
      navContainer.appendChild(nextBtn);

      // Auto-scroll
      var autoScroll = setInterval(function () {
        var maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 10) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }, 5000);

      track.addEventListener('mouseenter', function () { clearInterval(autoScroll); });
      track.addEventListener('mouseleave', function () {
        autoScroll = setInterval(function () {
          var maxScroll = track.scrollWidth - track.clientWidth;
          if (track.scrollLeft >= maxScroll - 10) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            track.scrollBy({ left: 320, behavior: 'smooth' });
          }
        }, 5000);
      });
    }
  }

  function buildNavButton(label, c) {
    var btn = document.createElement('button');
    btn.textContent = label;
    btn.setAttribute('style',
      'width:32px;height:32px;border-radius:50%;border:1px solid ' + c.border + ';' +
      'background:' + c.cardBg + ';color:' + c.text + ';cursor:pointer;font-size:14px;' +
      'display:flex;align-items:center;justify-content:center;transition:background 0.2s;' +
      'line-height:1;padding:0;'
    );
    btn.addEventListener('mouseenter', function () { btn.style.background = c.border; });
    btn.addEventListener('mouseleave', function () { btn.style.background = c.cardBg; });
    return btn;
  }

  /* ── Review card builder ── */

  function buildReviewCard(review, c, compact) {
    var padding = compact ? '12px' : '20px';
    var marginBottom = compact ? '8px' : '0';
    var comment = escapeHtml(review.comment || '');
    if (compact && comment.length > 120) {
      comment = comment.substring(0, 120) + '&hellip;';
    }

    return '<div style="' +
      'background:' + c.cardBg + ';border:1px solid ' + c.border + ';border-radius:12px;' +
      'padding:' + padding + ';margin-bottom:' + marginBottom + ';' +
      'box-shadow:0 1px 3px ' + c.shadow + ';' +
      '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        renderStars(review.rating, 16) +
        '<span style="font-size:12px;color:' + c.textSecondary + ';">' + formatDate(review.created_at) + '</span>' +
      '</div>' +
      (comment ? '<div style="font-size:14px;color:' + c.text + ';margin-bottom:10px;line-height:1.6;">&ldquo;' + comment + '&rdquo;</div>' : '') +
      '<div style="font-size:13px;font-weight:600;color:' + c.textSecondary + ';">' +
        escapeHtml(review.customer_name || 'Anonymous') +
      '</div>' +
    '</div>';
  }

  /* ── Init ── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
