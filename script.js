// État de l'application
const appState = {
    isSubmitting: false,
    cpCheckTimeout: null,
    isValidating: false
};

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
    
    // Vérifier si le CP est marqué comme disponible
    if (!inputs.numeroCP.classList.contains('success')) {
        showError('numeroCP', 'Veuillez vérifier la disponibilité du numéro de CP');
        return false;
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
        // Simuler l'appel API pour le moment
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // TODO: Remplacer par vrai appel Supabase
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
        showValidationMessage('Erreur lors de la vérification. Veuillez réessayer.', 'taken');
    } finally {
        appState.isValidating = false;
    }
}

// Simulation vérification base de données
async function checkCPInDatabase(cp) {
    // TODO: Implémenter avec Supabase
    try {
        if (typeof supabase === 'undefined') {
            console.warn('Supabase non configuré, simulation de la vérification');
            // Simuler quelques CP déjà pris pour les tests
            const takenCPs = ['8710320P', '1234567A', 'TESTCP01', '9999999Z'];
            return !takenCPs.includes(cp);
        }
        
        const { data, error } = await supabase
            .from('inscriptions')
            .select('numero_cp')
            .eq('numero_cp', cp)
            .single();
        
        // Si pas d'erreur, le CP existe déjà
        return error && error.code === 'PGRST116'; // Code "not found"
    } catch (error) {
        console.error('Erreur Supabase:', error);
        // En cas d'erreur de connexion, considérer comme disponible
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
    // TODO: Implémenter avec Supabase
    try {
        if (typeof supabase === 'undefined') {
            console.warn('Supabase non configuré, simulation de l\'inscription');
            // Simuler une inscription réussie
            await new Promise(resolve => setTimeout(resolve, 1500));
            return true;
        }
        
        const { error } = await supabase
            .from('inscriptions')
            .insert([data]);
        
        if (error) {
            console.error('Erreur Supabase insert:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur de connexion Supabase:', error);
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
document.addEventListener('DOMContentLoaded', () => {
    console.log('Formulaire d\'inscription SUD Rail initialisé');
    
    // Focus sur le premier champ
    inputs.nom.focus();
});