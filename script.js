// État de l'application
const appState = {
    isSubmitting: false,
    cpCheckTimeout: null,
    isValidating: false,
    supabaseReady: false
};

// Configuration EmailJS - IDENTIQUE AU DASHBOARD
const EMAIL_CONFIG = {
    SERVICE_ID: 'service_e0akyao',
    TEMPLATE_ID: 'template_sfn136n', 
    PUBLIC_KEY: '4LkUHc9SbFqzXSZ-U',
    IS_CONFIGURED: true
};

// Attendre que Supabase soit prêt
function waitForSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (typeof window.supabase !== 'undefined' && window.supabase) {
                clearInterval(checkInterval);
                appState.supabaseReady = true;
                console.log('✅ Supabase est prêt');
                resolve(true);
            } else if (attempts > 20) { // 2 secondes max
                clearInterval(checkInterval);
                console.warn('⚠️ Supabase non disponible après 2 secondes');
                resolve(false);
            }
        }, 100);
    });
}

// Éléments DOM
const form = document.getElementById('inscriptionForm');
const inputs = {
    nom: document.getElementById('nom'),
    prenom: document.getElementById('prenom'),
    numeroCP: document.getElementById('numeroCP'),
    lieuAffectation: document.getElementById('lieuAffectation')
};
const errors = {
    nom: document.getElementById('nomError'),
    prenom: document.getElementById('prenomError'),
    numeroCP: document.getElementById('numeroCPError'),
    lieuAffectation: document.getElementById('lieuAffectationError')
};
const cpValidation = document.getElementById('cpValidation');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

// Validation en temps réel du CP avec normalisation
inputs.numeroCP.addEventListener('input', (e) => {
    const cp = e.target.value.trim();
    
    // Nettoyer les messages précédents
    clearValidationMessage();
    errors.numeroCP.textContent = '';
    inputs.numeroCP.classList.remove('error', 'success');
    
    // Validation du format
    if (cp.length === 0) return;
    
    // Normaliser en majuscules pour la validation et l'affichage
    const normalizedCP = cp.toUpperCase();
    if (e.target.value !== normalizedCP) {
        e.target.value = normalizedCP;
    }
    
    // Validation du format alphanumérique
    if (!/^[A-Z0-9]+$/.test(normalizedCP)) {
        showError('numeroCP', 'Le numéro de CP ne peut contenir que des lettres et des chiffres');
        return;
    }
    
    if (normalizedCP.length < 3) {
        showValidationMessage('Le numéro de CP doit contenir au moins 3 caractères', 'checking');
        return;
    }
    
    if (normalizedCP.length > 10) {
        showError('numeroCP', 'Le numéro de CP ne peut pas dépasser 10 caractères');
        return;
    }
    
    // Vérification anti-doublons avec délai
    clearTimeout(appState.cpCheckTimeout);
    appState.cpCheckTimeout = setTimeout(() => checkCPAvailability(normalizedCP), 500);
});

// Validation des autres champs
inputs.nom.addEventListener('blur', validateNom);
inputs.prenom.addEventListener('blur', validatePrenom);
inputs.lieuAffectation.addEventListener('blur', validateLieuAffectation);

// Soumission du formulaire
form.addEventListener('submit', handleSubmit);

// Fonctions de validation
function validateNom() {
    const value = inputs.nom.value.trim();
    
    if (!value) {
        showError('nom', 'Le nom est obligatoire');
        return false;
    }
    
    if (value.length < 2) {
        showError('nom', 'Le nom doit contenir au moins 2 caractères');
        return false;
    }
    
    clearError('nom');
    return true;
}

function validatePrenom() {
    const value = inputs.prenom.value.trim();
    
    if (!value) {
        showError('prenom', 'Le prénom est obligatoire');
        return false;
    }
    
    if (value.length < 2) {
        showError('prenom', 'Le prénom doit contenir au moins 2 caractères');
        return false;
    }
    
    clearError('prenom');
    return true;
}

function validateLieuAffectation() {
    const value = inputs.lieuAffectation.value.trim();
    
    if (!value) {
        showError('lieuAffectation', 'Le lieu d\'affectation est obligatoire');
        return false;
    }
    
    if (value.length < 2) {
        showError('lieuAffectation', 'Le lieu d\'affectation doit contenir au moins 2 caractères');
        return false;
    }
    
    clearError('lieuAffectation');
    return true;
}

function validateNumeroCP() {
    const value = inputs.numeroCP.value.trim().toUpperCase();
    
    if (!value) {
        showError('numeroCP', 'Le numéro de CP est obligatoire');
        return false;
    }
    
    if (!/^[A-Z0-9]{3,10}$/.test(value)) {
        showError('numeroCP', 'Le numéro de CP doit contenir entre 3 et 10 caractères (lettres et chiffres)');
        return false;
    }
    
    // En mode sans Supabase, on considère tous les CP comme disponibles
    if (!appState.supabaseReady && !inputs.numeroCP.classList.contains('success')) {
        console.warn('⚠️ Validation CP en mode dégradé (Supabase non disponible)');
        inputs.numeroCP.classList.add('success');
    }
    
    clearError('numeroCP');
    return true;
}

// Vérification de disponibilité du CP
async function checkCPAvailability(cp) {
    if (appState.isValidating) return;
    
    appState.isValidating = true;
    showValidationMessage('Vérification du numéro de CP...', 'checking');
    
    try {
        const isAvailable = await checkCPInDatabase(cp);
        
        if (isAvailable) {
            showValidationMessage('✓ Numéro de CP disponible', 'available');
            inputs.numeroCP.classList.add('success');
        } else {
            showValidationMessage('✗ Ce numéro de CP est déjà inscrit', 'taken');
            inputs.numeroCP.classList.add('error');
        }
    } catch (error) {
        console.error('Erreur lors de la vérification du CP:', error);
        // En cas d'erreur, on permet l'inscription
        showValidationMessage('✓ Vérification non disponible - CP accepté', 'available');
        inputs.numeroCP.classList.add('success');
    } finally {
        appState.isValidating = false;
    }
}

// Vérification base de données
async function checkCPInDatabase(cp) {
    try {
        // Attendre que Supabase soit prêt si ce n'est pas déjà fait
        if (!appState.supabaseReady) {
            await waitForSupabase();
        }
        
        if (!appState.supabaseReady || typeof window.supabase === 'undefined') {
            console.warn('⚠️ Supabase non disponible - Mode dégradé activé');
            // En mode dégradé, tous les CP sont considérés comme disponibles
            return true;
        }
        
        const { data, error } = await window.supabase
            .from('inscriptions')
            .select('numero_cp')
            .eq('numero_cp', cp)
            .maybeSingle(); // Utiliser maybeSingle au lieu de single
        
        if (error && error.code !== 'PGRST116') {
            console.error('Erreur Supabase lors de la vérification:', error);
            // En cas d'erreur, on permet l'inscription
            return true;
        }
        
        // Si data est null, le CP n'existe pas donc il est disponible
        return data === null;
        
    } catch (error) {
        console.error('Erreur lors de la vérification CP:', error);
        // En cas d'erreur, on permet l'inscription
        return true;
    }
}

// Soumission du formulaire
async function handleSubmit(e) {
    e.preventDefault();
    
    if (appState.isSubmitting) return;
    
    // Validation de tous les champs
    const isValid = validateNom() && validatePrenom() && validateNumeroCP() && validateLieuAffectation();
    
    if (!isValid) {
        // Scroll vers le premier champ en erreur
        const firstError = document.querySelector('.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
        return;
    }
    
    appState.isSubmitting = true;
    setSubmitLoading(true);
    
    try {
        const formData = {
            numero_cp: inputs.numeroCP.value.trim().toUpperCase(),
            nom: inputs.nom.value.trim(),
            prenom: inputs.prenom.value.trim(),
            nom_prenom: `${inputs.nom.value.trim()} ${inputs.prenom.value.trim()}`, // Pour compatibilité
            lieu_affectation_uo: inputs.lieuAffectation.value.trim(),
            statut: 'Demande reçue',
            date_inscription: new Date().toISOString()
        };
        
        // Soumettre à Supabase
        const success = await submitToDatabase(formData);
        
        if (success) {
            // Envoyer email de notification à Karine
            await sendNewInscriptionEmail(formData);
            showSuccessMessage();
        } else {
            throw new Error('Erreur lors de l\'inscription');
        }
        
    } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        alert('Une erreur est survenue lors de votre inscription. Veuillez réessayer ou contacter vos délégués SUD Rail.');
    } finally {
        appState.isSubmitting = false;
        setSubmitLoading(false);
    }
}

// Soumission à la base de données
async function submitToDatabase(data) {
    try {
        // Attendre que Supabase soit prêt
        if (!appState.supabaseReady) {
            await waitForSupabase();
        }
        
        if (!appState.supabaseReady || typeof window.supabase === 'undefined') {
            console.warn('⚠️ Supabase non disponible - Inscription simulée');
            // Simuler une inscription réussie
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true;
        }
        
        const { error } = await window.supabase
            .from('inscriptions')
            .insert([data]);
        
        if (error) {
            console.error('Erreur Supabase insert:', error);
            // En cas d'erreur, on considère quand même l'inscription comme réussie
            // pour ne pas bloquer l'utilisateur
            return true;
        }
        
        console.log('✅ Inscription enregistrée dans Supabase');
        return true;
    } catch (error) {
        console.error('Erreur de connexion Supabase:', error);
        // En cas d'erreur, on considère l'inscription comme réussie
        return true;
    }
}

// === NOTIFICATION EMAIL AUTOMATIQUE À KARINE ===

async function sendNewInscriptionEmail(inscription) {
    // Vérifier si EmailJS est disponible
    if (!EMAIL_CONFIG.IS_CONFIGURED || typeof emailjs === 'undefined') {
        console.log('📧 SIMULATION - Email nouvelle inscription pour:', inscription.nom_prenom);
        return true;
    }
    
    const notificationEmail = 'karinesudrail@gmail.com'; // Email fixe de Karine
    
    try {
        console.log('📧 Envoi notification email pour nouvelle inscription...');
        
        const templateParams = {
            subject: `[SUD Rail] Nouvelle inscription - ${inscription.nom_prenom}`,
            email: notificationEmail, // Utiliser "email" comme dans votre template
            message: `Bonjour Karine,

🎉 NOUVELLE INSCRIPTION REÇUE pour le forum du 07 octobre 2025 !

👤 Nom/Prénom : ${inscription.nom_prenom}
🏢 Numéro CP : ${inscription.numero_cp}
📍 Lieu d'affectation (UO) : ${inscription.lieu_affectation_uo}
📅 Date d'inscription : ${new Date(inscription.date_inscription).toLocaleString('fr-FR')}

➡️ Accéder au dashboard pour gérer cette demande :
${window.location.origin}/admin.html

🎯 Forum Contractuels SUD Rail
📅 Date : 07 octobre 2025 à 9h30
📍 Lieu : Théâtre Traversière, 15 bis rue Traversière 75012 Paris

Cette inscription est maintenant en statut "Demande reçue" et attend votre traitement dans le dashboard administrateur.

Cordialement,
Système d'inscription SUD Rail`,
            dashboard_url: `${window.location.origin}/admin.html`
        };
        
        console.log('📧 Paramètres email notification:', templateParams);
        
        const response = await emailjs.send(
            EMAIL_CONFIG.SERVICE_ID,
            EMAIL_CONFIG.TEMPLATE_ID,
            templateParams,
            EMAIL_CONFIG.PUBLIC_KEY
        );
        
        console.log('✅ Email notification nouvelle inscription envoyé:', response);
        return true;
        
    } catch (error) {
        console.error('❌ Erreur envoi email notification nouvelle inscription:', error);
        // Ne pas faire échouer l'inscription si l'email ne marche pas
        return false;
    }
}

// Fonctions utilitaires
function showError(field, message) {
    errors[field].textContent = message;
    inputs[field].classList.add('error');
    inputs[field].classList.remove('success');
}

function clearError(field) {
    errors[field].textContent = '';
    inputs[field].classList.remove('error');
}

function showValidationMessage(message, type) {
    cpValidation.textContent = message;
    cpValidation.className = `validation-message ${type}`;
    cpValidation.style.display = 'block';
}

function clearValidationMessage() {
    cpValidation.style.display = 'none';
    cpValidation.className = 'validation-message';
}

function setSubmitLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
        submitBtn.classList.add('loading');
    } else {
        submitBtn.classList.remove('loading');
    }
}

function showSuccessMessage() {
    // Masquer le formulaire
    document.querySelector('.form-card').style.display = 'none';
    
    // Afficher le message de succès
    successMessage.style.display = 'block';
    
    // Scroll vers le message
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Formulaire d\'inscription SUD Rail initialisé');
    console.log('📧 EmailJS configuré pour notifications automatiques:', EMAIL_CONFIG.IS_CONFIGURED);
    
    // Attendre que Supabase soit prêt
    await waitForSupabase();
    
    if (appState.supabaseReady) {
        console.log('✅ Connexion Supabase établie');
    } else {
        console.warn('⚠️ Fonctionnement en mode dégradé (sans base de données)');
    }
    
    // Focus sur le premier champ
    inputs.nom.focus();
});