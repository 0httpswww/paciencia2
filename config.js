/**
 * CONFIGURAÇÃO PÚBLICA (Frontend)
 * 
 * NOTA: Chaves de API sensíveis e credenciais de banco de dados
 * foram movidas para o backend (api.php) para segurança.
 */

var GAME_CONFIG = {
    // Configurações de Banco de Dados e Auth são carregadas via fetch('./api.php?action=get_config')
    supabase: {}, 
    
    // Configurações de Publicidade (Públicas por natureza)
    ads: {
        popunderZone: '10264533',
        pushZone: '10234210',
        vignetteZone: '10273879',
        directLink: 'https://al5sm.com/4/10264533'
    }
};

// Exporta para o Service Worker e Janela
if (typeof window !== 'undefined') {
    window.GAME_CONFIG = GAME_CONFIG;
}
if (typeof self !== 'undefined') {
    self.GAME_CONFIG = GAME_CONFIG;
}