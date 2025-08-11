// Configuration Supabase
const SUPABASE_URL = 'https://kihijnybtfvwmjdtabyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaGlqbnlidGZ2d21qZHRhYnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTY2MDIsImV4cCI6MjA3MDQ5MjYwMn0.Vha5pkZaKSMnIXK9aYU-tg8aqjrZ0_tpr4OFCYEDegA';

// Initialisation du client Supabase
// Note: Le CDN Supabase sera chargé via script tag dans le HTML
let supabase;

// Fonction d'initialisation de Supabase
function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            // Client Supabase déjà disponible via CDN
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase initialisé avec succès');
        } else {
            console.warn('⚠️ Supabase CDN non chargé, mode simulation activé');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
    }
}

// Initialiser dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Attendre un peu que le CDN se charge
    setTimeout(initSupabase, 100);
});

// Export pour utilisation dans d'autres fichiers
window.initSupabase = initSupabase;