// Constantes de l'application
const APP_CONSTANTS = {
    // Informations de l'événement
    EVENT: {
        NAME: 'Forum Contractuels SUD Rail',
        DATE: '07 octobre 2025',
        TIME: '9h30',
        LOCATION: 'Théâtre Traversière',
        ADDRESS: '15 bis rue Traversière 75012 Paris'
    },
    
    // Statuts des demandes (dans l'ordre du workflow)
    STATUSES: {
        RECEIVED: 'Demande reçue',
        REQUESTED: 'Demande de dégagement demandée',
        ACCEPTED: 'Demande acceptée', 
        REFUSED: 'Demande refusée',
        TRANSMITTED: 'Réponse transmise à l\'agent'
    },
    
    // Configuration de l'authentification admin
    ADMIN: {
        EMAIL: 'karinesudrail@gmail.com',
        PASSWORD: 'Karinesudr@il2025'
    },
    
    // Validation des champs
    VALIDATION: {
        CP_PATTERN: /^[0-9]{5}$/,
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100,
        MAX_UO_LENGTH: 100,
        MIN_UO_LENGTH: 2
    },
    
    // Configuration de sécurité
    SECURITY: {
        MAX_INSCRIPTIONS_PER_IP: 5,
        TIME_WINDOW_HOURS: 1,
        CP_CHECK_DELAY: 500 // ms
    },
    
    // Messages utilisateur
    MESSAGES: {
        SUCCESS: {
            TITLE: 'Inscription confirmée !',
            TEXT: 'Votre inscription a bien été prise en compte. Vous recevrez les détails pratiques par email.',
            CONTACT: 'Pour toute question, n\'hésitez pas à contacter vos délégués SUD Rail de proximité.'
        },
        ERRORS: {
            CP_REQUIRED: 'Le numéro de CP est obligatoire',
            CP_FORMAT: 'Le numéro de CP doit contenir exactement 5 chiffres',
            CP_NUMBERS_ONLY: 'Le numéro de CP ne peut contenir que des chiffres',
            CP_ALREADY_EXISTS: 'Ce numéro de CP est déjà inscrit',
            CP_CHECK_ERROR: 'Erreur lors de la vérification. Veuillez réessayer.',
            NAME_REQUIRED: 'Le nom et prénom sont obligatoires',
            NAME_MIN_LENGTH: 'Le nom et prénom doivent contenir au moins 2 caractères',
            UO_REQUIRED: 'Le lieu d\'affectation est obligatoire',
            UO_MIN_LENGTH: 'Le lieu d\'affectation doit contenir au moins 2 caractères',
            SUBMISSION_ERROR: 'Une erreur est survenue lors de votre inscription. Veuillez réessayer ou contacter vos délégués SUD Rail.'
        },
        VALIDATION: {
            CP_CHECKING: 'Vérification du numéro de CP...',
            CP_AVAILABLE: '✓ Numéro de CP disponible',
            CP_TAKEN: '✗ Ce numéro de CP est déjà inscrit',
            CP_FORMAT_ERROR: 'Le numéro de CP doit contenir exactement 5 chiffres'
        }
    },
    
    // Configuration email
    EMAIL: {
        TEMPLATE: {
            SUBJECT: '[SUD Rail] Nouvelle inscription - {{nom_prenom}}',
            BODY: `Bonjour Karine,

Nouvelle inscription reçue pour le forum du 07 octobre 2025 :

👤 Nom/Prénom : {{nom_prenom}}
🏢 Numéro CP : {{numero_cp}}
📍 Lieu d'affectation (UO) : {{lieu_affectation}}
📅 Date d'inscription : {{date_inscription}}

➡️ Accéder au dashboard : {{dashboard_url}}

Cordialement,
Système d'inscription SUD Rail`
        }
    },
    
    // Couleurs de l'interface
    COLORS: {
        PRIMARY: '#2E8B57',    // Vert syndical
        SECONDARY: '#DC143C',  // Rouge syndical
        SUCCESS: '#28a745',
        ERROR: '#dc3545',
        WARNING: '#ffc107',
        INFO: '#17a2b8'
    }
};

// Export global
window.APP_CONSTANTS = APP_CONSTANTS;

// Helper functions
window.APP_HELPERS = {
    // Formatage de date
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Validation du format CP
    isValidCP: (cp) => {
        return APP_CONSTANTS.VALIDATION.CP_PATTERN.test(cp);
    },
    
    // Nettoyage des chaînes
    sanitizeString: (str) => {
        return str.trim().replace(/\s+/g, ' ');
    },
    
    // Template simple pour les emails
    interpolateTemplate: (template, data) => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });
    }
};