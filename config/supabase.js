// Configuration Supabase
const SUPABASE_URL = 'https://kihijnybtfvwmjdtabyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaGlqbnlidGZ2d21qZHRhYnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTY2MDIsImV4cCI6MjA3MDQ5MjYwMn0.Vha5pkZaKSMnIXK9aYU-tg8aqjrZ0_tpr4OFCYEDegA';

// Initialisation du client Supabase
let supabase;

// Fonction d'initialisation de Supabase
function initSupabase() {
    try {
        // Vérifier si le CDN Supabase est chargé
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            // Créer le client Supabase
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false // Pas de session persistante pour l'anon
                }
            });
            
            // Rendre disponible globalement
            window.supabase = supabase;
            
            console.log('✅ Supabase initialisé avec succès');
            console.log('📡 URL:', SUPABASE_URL);
            
            // Test de connexion
            testSupabaseConnection();
            
            return true;
        } else {
            console.error('❌ Supabase CDN non chargé correctement');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
        return false;
    }
}

// Test de connexion à Supabase
async function testSupabaseConnection() {
    try {
        console.log('🔍 Test de connexion Supabase...');
        
        const { data, error } = await supabase
            .from('inscriptions')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Erreur de connexion Supabase:', error);
        } else {
            console.log('✅ Connexion Supabase OK');
        }
    } catch (error) {
        console.error('❌ Erreur lors du test de connexion:', error);
    }
}

// Attendre que le DOM et Supabase soient prêts
function waitForSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // 3 secondes max
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            // Essayer d'initialiser Supabase
            if (initSupabase()) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Impossible d\'initialiser Supabase après 3 secondes');
                resolve(false);
            }
        }, 100);
    });
}

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSupabase);
} else {
    waitForSupabase();
}

// Export pour utilisation dans d'autres fichiers
window.initSupabase = initSupabase;
window.waitForSupabase = waitForSupabase;
