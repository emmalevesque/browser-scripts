// ==UserScript==
// @name         Archive.org Dark Mode
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adapts archive.org to dark mode based on system settings
// @author       You
// @match        https://archive.org/*
// @match        https://*.archive.org/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        /* Light mode (default) - minimal changes */
        @media (prefers-color-scheme: light) {
            /* Keep default archive.org styles */
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
            /* Main background and text colors */
            body, html {
                background-color: #1a1a1a !important;
                color: #e0e0e0 !important;
            }

            /* Force dark backgrounds on common white elements */
            div, section, article, aside, main, header, nav {
                background-color: inherit !important;
            }

            /* Top level containers */
            #wrap, #maincontent, .container, .container-fluid {
                background-color: #1a1a1a !important;
                color: #e0e0e0 !important;
            }

            /* Header */
            #navwrap1, #nav-tophat, .navbar, #navwrap2 {
                background-color: #2d2d2d !important;
                border-color: #404040 !important;
                color: #e0e0e0 !important;
            }

            /* Links */
            a {
                color: #6db3f2 !important;
            }

            a:visited {
                color: #b19cd9 !important;
            }

            a:hover {
                color: #8fc9ff !important;
            }

            /* Content containers */
            .container, .container-fluid, #maincontent, .welcome,
            .item-details-about, .boxy, .box {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
            }

            /* Search boxes and inputs */
            input[type="text"], input[type="search"], input[type="email"],
            input[type="password"], textarea, select {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            input::placeholder, textarea::placeholder {
                color: #888 !important;
            }

            /* Buttons */
            .btn, button, input[type="submit"], input[type="button"] {
                background-color: #3d3d3d !important;
                color: #e0e0e0 !important;
                border-color: #505050 !important;
            }

            .btn:hover, button:hover {
                background-color: #4d4d4d !important;
            }

            .btn-primary {
                background-color: #2563eb !important;
                border-color: #1d4ed8 !important;
            }

            .btn-primary:hover {
                background-color: #1d4ed8 !important;
            }

            /* Cards and panels */
            .panel, .panel-default, .card {
                background-color: #2d2d2d !important;
                border-color: #404040 !important;
                color: #e0e0e0 !important;
            }

            .panel-heading, .card-header {
                background-color: #353535 !important;
                border-color: #404040 !important;
                color: #e0e0e0 !important;
            }

            .panel-body, .card-body {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }

            /* Tables */
            table {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
            }

            th {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            td {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            tr:hover td {
                background-color: #2d2d2d !important;
            }

            /* Modals */
            .modal-content {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            .modal-header, .modal-footer {
                background-color: #353535 !important;
                border-color: #404040 !important;
            }

            /* Dropdowns */
            .dropdown-menu {
                background-color: #2d2d2d !important;
                border-color: #404040 !important;
            }

            .dropdown-item {
                color: #e0e0e0 !important;
            }

            .dropdown-item:hover {
                background-color: #3d3d3d !important;
            }

            /* Footer */
            #footer, footer {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            /* Breadcrumbs */
            .breadcrumb {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }

            /* Code blocks */
            pre, code {
                background-color: #1a1a1a !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            /* Alerts and notifications */
            .alert {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            /* Metadata and descriptions */
            .metadata, .item-description, .item-title {
                color: #e0e0e0 !important;
            }

            /* Dividers */
            hr {
                border-color: #404040 !important;
            }

            /* Special archive.org elements */
            .ikind, .item-ia {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }

            /* Carousel and media items */
            .carousel, .item-tile, .results, .item {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
            }

            /* Details page specific elements */
            #theatre-ia, .theatre-ia, #theater-ia {
                background-color: #1a1a1a !important;
            }

            #tabby, .tabby-data, #tabby-theatre, #tabby-downloads,
            #tabby-about, #tabby-reviews, #tabby-collection, #tabby-forum {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
            }

            .welcome-left, .welcome-right, .col-sm-7, .col-sm-8, .col-sm-9 {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
            }

            /* Tab navigation */
            .nav-tabs {
                background-color: #2d2d2d !important;
                border-color: #404040 !important;
            }

            .nav-tabs > li > a {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            .nav-tabs > li.active > a,
            .nav-tabs > li.active > a:hover,
            .nav-tabs > li.active > a:focus {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            .nav-tabs > li > a:hover {
                background-color: #353535 !important;
                border-color: #404040 !important;
            }

            /* Item details and metadata sections */
            .item-details-metadata, .metadata-definition,
            .item-details-fieldset, .item-details-field {
                background-color: #242424 !important;
                color: #e0e0e0 !important;
            }

            dt, dd {
                color: #e0e0e0 !important;
            }

            /* Lists */
            ul, ol, li {
                color: #e0e0e0 !important;
            }

            /* Well and info boxes */
            .well, .well-sm, .well-lg, .info-box {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
                border-color: #404040 !important;
            }

            /* Theater controls and player */
            .jw-wrapper, .jw-controls, .jw-display,
            .ia-player, .iaux-box {
                background-color: #1a1a1a !important;
                color: #e0e0e0 !important;
            }

            /* Format options and download sections */
            .download-pill, .format-group, .stealth {
                background-color: #2d2d2d !important;
                color: #e0e0e0 !important;
            }

            /* Text headings remain visible */
            h1, h2, h3, h4, h5, h6 {
                color: #e0e0e0 !important;
            }

            /* Labels and badges */
            .label, .badge {
                background-color: #3d3d3d !important;
                color: #e0e0e0 !important;
            }

            /* Forms and fieldsets */
            fieldset, legend {
                border-color: #404040 !important;
                color: #e0e0e0 !important;
            }

            /* Prevent bright white flashes */
            * {
                background-color: inherit;
            }

#right-column {
    background-color: #1a1a1a !important;
        }
    `);
})();
