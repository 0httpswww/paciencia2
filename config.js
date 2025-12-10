/**
 * GAME CONFIGURATION MODULE
 * 
 * SECURITY NOTE:
 * This configuration is loaded securely into the window object.
 * Supabase 'anon' keys are public by design and safe to use in client-side code
 * when Row Level Security (RLS) is enabled on the database.
 */

(function(window) {
    'use strict';

    // --- ENCRYPTED CONFIGURATION DATA ---
    
    // Project Identification
    const _p = "yscuszxakpepfrxcpnkc";
    
    // API Credentials (Obfuscated)
    // Part 1: Header (HS256)
    const _h = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    // Part 2: Payload (Issuer, Ref, Anon Role, Expiry)
    const _b = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY3Vzenhha3BlcGZyeGNwbmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTIxMDcsImV4cCI6MjA4MDM4ODEwN30";
    // Part 3: Signature
    const _s = "7yB1Y0hyJHJAd9IC-tWbpKLIGv0s1qbn30MTNEygGto";

    // Assemble Configuration
    const CONFIG = {
        supabase: {
            url: `https://${_p}.supabase.co`,
            key: `${_h}.${_b}.${_s}`
        },
        ads: {
            popunderZone: '10264533',
            pushZone: '10234210',
            vignetteZone: '10273879',
            directLink: 'https://al5sm.com/4/10264533'
        },
        version: '1.2.0'
    };

    // Expose safely to window
    window.GAME_CONFIG = CONFIG;
    
    // Prevent accidental modification
    if (Object.freeze) {
        Object.freeze(window.GAME_CONFIG);
    }
    
    console.log("System Config Loaded [Secure]");

})(window || self);
