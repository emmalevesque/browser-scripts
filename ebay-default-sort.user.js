// ==UserScript==
// @name         eBay Default Sort: Price + Shipping Lowest First
// @namespace    https://github.com/emmalevesque-schaefer
// @version      1.0.0
// @description  Forces eBay search/browse pages to sort by Price + Shipping: lowest first
// @match        *://*.ebay.*/*
// @exclude      *://signin.ebay.*/*
// @exclude      *://*.ebay.*/*/itm/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  // Ensure we only run in the top-level browsing context
  try { if (window.top !== window.self) return; } catch (_e) { /* cross-origin */ return; }

  const SORT_PARAM = '_sop';
  const LOWEST_FIRST = '15'; // eBay code for "Price + Shipping: lowest first"
  const US_ONLY_PARAM = 'LH_PrefLoc';
  const US_ONLY_VALUE = '1'; // eBay query string to restrict to US-only sellers

  const STORAGE_KEY = 'ebayUserScriptPrefs:v1';

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { usOnly: true };
      const parsed = JSON.parse(raw);
      return {
        usOnly: Boolean(parsed.usOnly),
      };
    } catch (_e) {
      return { usOnly: true };
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (_e) {
      // no-op
    }
  }

  function isLikelyResultsPage(url) {
    // Avoid item pages, auth, and homepage
    const path = url.pathname || '';
    if (!url.search) return false;
    if (path.includes('/itm/')) return false;
    if (path === '/' || path === '') return false;

    // Common eBay result/browse patterns and signals
    const hasResultPath =
      path.includes('/sch') || // search results
      path.includes('/i.html') || // classic search landing
      path.startsWith('/b/'); // browse category pages

    const hasResultParams =
      url.searchParams.has('_nkw') || // keyword search
      url.searchParams.has('_sacat') || // category
      url.searchParams.has('_udlo') || // price filters imply results
      url.searchParams.has('_ipg'); // items per page

    return hasResultPath || hasResultParams;
  }

  function applyPreferences(currentLocation) {
    const prefs = loadPrefs();
    const url = new URL(currentLocation.href);
    if (!isLikelyResultsPage(url)) return;

    let modified = false;

    if (url.searchParams.get(SORT_PARAM) !== LOWEST_FIRST) {
      url.searchParams.set(SORT_PARAM, LOWEST_FIRST);
      modified = true;
    }

    if (prefs.usOnly) {
      if (url.searchParams.get(US_ONLY_PARAM) !== US_ONLY_VALUE) {
        url.searchParams.set(US_ONLY_PARAM, US_ONLY_VALUE);
        modified = true;
      }
    } else if (url.searchParams.has(US_ONLY_PARAM)) {
      url.searchParams.delete(US_ONLY_PARAM);
      modified = true;
    }

    if (modified && url.href !== currentLocation.href) {
      currentLocation.replace(url.toString());
    }
  }

  // Run as early as possible to affect initial navigation
  try {
    applyPreferences(window.location);
  } catch (err) {
    // no-op
  }

  // Handle client-side navigations (if eBay uses pushState/replaceState)
  (function installNavigationGuards() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function onNavigate() {
      try {
        applyPreferences(window.location);
      } catch (err) {
        // no-op
      }
    }

    history.pushState = function pushStateWrapped(_state, _title, _url) {
      const result = originalPushState.apply(this, arguments);
      onNavigate();
      return result;
    };

    history.replaceState = function replaceStateWrapped(_state, _title, _url) {
      const result = originalReplaceState.apply(this, arguments);
      onNavigate();
      return result;
    };

    window.addEventListener('popstate', onNavigate, { passive: true });
    document.addEventListener('DOMContentLoaded', function onReadyOnce() {
      onNavigate();
      try { injectPrefsUI(); } catch (_e) {}
    }, { once: true });

    // If DOM is already ready when the script runs, inject immediately
    if (document.readyState !== 'loading') {
      try { injectPrefsUI(); } catch (_e) {}
      onNavigate();
    }
  })();

  function injectPrefsUI() {
    // idempotent
    if (document.getElementById('tmk-ebay-prefs')) return;

    const prefs = loadPrefs();

    const panel = document.createElement('div');
    panel.id = 'tmk-ebay-prefs';
    panel.style.position = 'fixed';
    panel.style.bottom = '16px';
    panel.style.right = '16px';
    panel.style.zIndex = '2147483647';
    panel.style.background = 'rgba(0,0,0,0.75)';
    panel.style.color = '#fff';
    panel.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    panel.style.fontSize = '12px';
    panel.style.padding = '8px 10px';
    panel.style.borderRadius = '6px';
    panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

    const title = document.createElement('div');
    title.textContent = 'eBay Prefs';
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    panel.appendChild(title);

    const usOnlyRow = document.createElement('label');
    usOnlyRow.style.display = 'flex';
    usOnlyRow.style.alignItems = 'center';
    usOnlyRow.style.gap = '6px';
    usOnlyRow.style.margin = '4px 0';
    const usOnlyCheckbox = document.createElement('input');
    usOnlyCheckbox.type = 'checkbox';
    usOnlyCheckbox.checked = !!prefs.usOnly;
    usOnlyCheckbox.addEventListener('change', () => {
      const updated = { ...loadPrefs(), usOnly: usOnlyCheckbox.checked };
      savePrefs(updated);
    });
    const usOnlyText = document.createElement('span');
    usOnlyText.textContent = 'US-only sellers';
    usOnlyRow.appendChild(usOnlyCheckbox);
    usOnlyRow.appendChild(usOnlyText);
    panel.appendChild(usOnlyRow);

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '8px';
    buttons.style.marginTop = '6px';
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Apply now';
    applyBtn.style.cursor = 'pointer';
    applyBtn.style.border = '1px solid rgba(255,255,255,0.25)';
    applyBtn.style.background = 'transparent';
    applyBtn.style.color = '#fff';
    applyBtn.style.padding = '2px 6px';
    applyBtn.style.borderRadius = '4px';
    applyBtn.addEventListener('click', () => {
      try { applyPreferences(window.location); } catch (_e) {}
    });
    buttons.appendChild(applyBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Hide';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.border = '1px solid rgba(255,255,255,0.25)';
    closeBtn.style.background = 'transparent';
    closeBtn.style.color = '#fff';
    closeBtn.style.padding = '2px 6px';
    closeBtn.style.borderRadius = '4px';
    closeBtn.addEventListener('click', () => {
      panel.remove();
    });
    buttons.appendChild(closeBtn);

    panel.appendChild(buttons);
    document.body.appendChild(panel);
  }

})();


