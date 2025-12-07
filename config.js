/**
 * ARQUIVO DE CONFIGURAÇÃO CENTRAL
 * 
 * SEGURANÇA:
 * As credenciais abaixo foram ofuscadas (fragmentadas) para evitar exposição direta em texto plano
 * e proteger contra bots de scraping básicos.
 * 
 * NOTA: Chaves 'anon' do Supabase são seguras para uso público desde que o RLS (Row Level Security)
 * esteja configurado no banco de dados.
 */

// Fragmentos da URL do Supabase
var _u1 = "https://";
var _u2 = "yscuszxakpepfrxcpnkc";
var _u3 = ".supabase.co";

// Fragmentos da Chave API (JWT)
var _k1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
var _k2 = "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzY3Vzenhha3BlcGZyeGNwbmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTIxMDcsImV4cCI6MjA4MDM4ODEwN30";
var _k3 = "7yB1Y0hyJHJAd9IC-tWbpKLIGv0s1qbn30MTNEygGto";

var GAME_CONFIG = {
    supabase: {
        // Reconstrói a URL em tempo de execução
        url: _u1 + _u2 + _u3,
        // Reconstrói a Chave com os separadores corretos
        key: _k1 + "." + _k2 + "." + _k3
    },
    ads: {
        popunderZone: '10264533',
        pushZone: '10234210',
        vignetteZone: '10273879',
        directLink: 'https://al5sm.com/4/10264533'
    }
};

// Exporta para o escopo global dependendo do ambiente (Janela ou Service Worker)
if (typeof window !== 'undefined') {
    window.GAME_CONFIG = GAME_CONFIG;
}
if (typeof self !== 'undefined') {
    self.GAME_CONFIG = GAME_CONFIG;
}