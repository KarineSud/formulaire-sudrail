// État global du dashboard
const adminState = {
    isLoggedIn: false,
    currentUser: null,
    inscriptions: [],
    filteredInscriptions: [],
    currentFilter: '',
    currentSort: 'date_desc',
    searchText: '',
    isLoading: false,
    stats: {
        total: 0,
        received: 0,
        requested: 0,
        accepted: 0,
        refused: 0,
        transmitted: 0
    }
};

// Éléments DOM
const elements = {
    // Pages
    loginPage: document.getElementById('loginPage'),
    dashboardPage: document.getElementById('dashboardPage'),
    
    // Login
    loginForm: document.getElementById('loginForm'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    loginLoader: document.getElementById('loginLoader'),
    emailError: document.getElementById('emailError'),
    passwordError: document.getElementById('passwordError'),
    
    // Header
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Stats
    statsGrid: document.getElementById('statsGrid'),
    totalInscriptions: document.getElementById('totalInscriptions'),
    statusReceived: document.getElementById('statusReceived'),
    statusRequested: document.getElementById('statusRequested'),
    statusAccepted: document.getElementById('statusAccepted'),
    statusRefused: document.getElementById('statusRefused'),
    statusTransmitted: document.getElementById('statusTransmitted'),
    
    // Email config
    notificationEmail: document.getElementById('notificationEmail'),
    updateEmailBtn: document.getElementById('updateEmailBtn'),
    testEmailBtn: document.getElementById('testEmailBtn'),
    
    // Filters
    statusFilter: document.getElementById('statusFilter'),
    sortBy: document.getElementById('sortBy'),
    searchText: document.getElementById('searchText'),
    refreshBtn: document.getElementById('refreshBtn'),
    
    // Table
    inscriptionsTable: document.getElementById('inscriptionsTable'),
    inscriptionsTableBody: document.getElementById('inscriptionsTableBody'),
    emptyState: document.getElementById('emptyState'),
    
    // Modal
    statusModal: document.getElementById('statusModal'),
    modalClose: document.getElementById('modalClose'),
    modalCancel: document.getElementById('modalCancel'),
    modalSave: document.getElementById('modalSave'),
    modalParticipantName: document.getElementById('modalParticipantName'),
    modalParticipantCP: document.getElementById('modalParticipantCP'),
    modalParticipantUO: document.getElementById('modalParticipantUO'),
    modalStatus: document.getElementById('modalStatus'),
    modalComment: document.getElementById('modalComment')
};

// Variables pour le modal
let currentEditingInscription = null;

// Initialisation
document.addEventListener('DOMContentLoaded', initializeAdmin);

function initializeAdmin() {
    console.log('🎛️ Initialisation du dashboard admin...');
    
    // Vérifier si déjà connecté (session simple)
    const savedLogin = sessionStorage.getItem('admin_logged_in');
    if (savedLogin === 'true') {
        showDashboard();
        loadInscriptions();
    } else {
        showLogin();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Login
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Email configuration
    elements.updateEmailBtn.addEventListener('click', updateNotificationEmail);
    elements.testEmailBtn.addEventListener('click', testEmail);
    
    // Filtres et recherche
    elements.statusFilter.addEventListener('change', applyFilters);
    elements.sortBy.addEventListener('change', applyFilters);
    elements.searchText.addEventListener('input', debounce(applyFilters, 300));
    elements.refreshBtn.addEventListener('click', () => {
        showLoading(true);
        loadInscriptions();
    });
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalCancel.addEventListener('click', closeModal);
    elements.modalSave.addEventListener('click', saveStatusChange);
    
    // Fermer modal en cliquant en dehors
    elements.statusModal.addEventListener('click', (e) => {
        if (e.target === elements.statusModal) {
            closeModal();
        }
    });
    
    // Échapper pour fermer le modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.statusModal.style.display !== 'none') {
            closeModal();
        }
    });
}

// === AUTHENTIFICATION ===

async function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    
    // Clear previous errors
    elements.emailError.textContent = '';
    elements.passwordError.textContent = '';
    
    // Validation basique
    if (!email) {
        elements.emailError.textContent = 'Email requis';
        return;
    }
    
    if (!password) {
        elements.passwordError.textContent = 'Mot de passe requis';
        return;
    }
    
    // Show loading
    elements.loginLoader.style.display = 'inline-block';
    const submitBtn = elements.loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    try {
        // Vérification avec les constantes
        if (email === APP_CONSTANTS.ADMIN.EMAIL && password === APP_CONSTANTS.ADMIN.PASSWORD) {
            // Connexion réussie
            adminState.isLoggedIn = true;
            adminState.currentUser = email;
            sessionStorage.setItem('admin_logged_in', 'true');
            
            showDashboard();
            await loadInscriptions();
        } else {
            // Échec de la connexion
            elements.passwordError.textContent = 'Email ou mot de passe incorrect';
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        elements.passwordError.textContent = 'Erreur de connexion. Veuillez réessayer.';
    } finally {
        elements.loginLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    adminState.isLoggedIn = false;
    adminState.currentUser = null;
    sessionStorage.removeItem('admin_logged_in');
    
    // Clear form
    elements.emailInput.value = '';
    elements.passwordInput.value = '';
    
    showLogin();
}

function showLogin() {
    elements.loginPage.style.display = 'block';
    elements.dashboardPage.style.display = 'none';
    elements.emailInput.focus();
}

function showDashboard() {
    elements.loginPage.style.display = 'none';
    elements.dashboardPage.style.display = 'block';
}

// === CHARGEMENT DES DONNÉES ===

async function loadInscriptions() {
    try {
        showLoading(true);
        
        // TODO: Remplacer par vraie requête Supabase
        const data = await fetchInscriptionsFromDatabase();
        
        adminState.inscriptions = data;
        adminState.filteredInscriptions = [...data];
        
        updateStats();
        applyFilters();
        renderTable();
        
        console.log(`✅ ${data.length} inscription(s) chargée(s)`);
    } catch (error) {
        console.error('Erreur lors du chargement des inscriptions:', error);
        showError('Erreur lors du chargement des données');
    } finally {
        showLoading(false);
    }
}

async function fetchInscriptionsFromDatabase() {
    // Simulation avec données de test
    if (typeof supabase === 'undefined') {
        console.warn('Supabase non configuré, utilisation de données de test');
        return generateTestData();
    }
    
    try {
        const { data, error } = await supabase
            .from('inscriptions')
            .select('*')
            .order('date_inscription', { ascending: false });
        
        if (error) {
            console.error('Erreur Supabase:', error);
            return generateTestData();
        }
        
        return data || [];
    } catch (error) {
        console.error('Erreur de connexion Supabase:', error);
        return generateTestData();
    }
}

function generateTestData() {
    return [
        {
            id: '1',
            numero_cp: '8710320P',
            nom_prenom: 'Karine Sud Rail',
            lieu_affectation_uo: 'UO PCD-COGC',
            statut: 'Demande reçue',
            date_inscription: '2025-08-11T10:30:00Z',
            date_modification: '2025-08-11T10:30:00Z',
            commentaires: null
        },
        {
            id: '2',
            numero_cp: '1234567A',
            nom_prenom: 'Jean Dupont',
            lieu_affectation_uo: 'UO Lyon Part-Dieu',
            statut: 'Demande de dégagement demandée',
            date_inscription: '2025-08-11T09:15:00Z',
            date_modification: '2025-08-11T11:20:00Z',
            commentaires: 'Demande transmise au chef de service'
        },
        {
            id: '3',
            numero_cp: 'TESTCP01',
            nom_prenom: 'Marie Martin',
            lieu_affectation_uo: 'UO Gare du Nord',
            statut: 'Demande acceptée',
            date_inscription: '2025-08-10T16:45:00Z',
            date_modification: '2025-08-11T08:30:00Z',
            commentaires: 'Dégagement accordé par la hiérarchie'
        }
    ];
}

// === STATISTIQUES ===

function updateStats() {
    const stats = {
        total: adminState.inscriptions.length,
        received: 0,
        requested: 0,
        accepted: 0,
        refused: 0,
        transmitted: 0
    };
    
    adminState.inscriptions.forEach(inscription => {
        switch (inscription.statut) {
            case APP_CONSTANTS.STATUSES.RECEIVED:
                stats.received++;
                break;
            case APP_CONSTANTS.STATUSES.REQUESTED:
                stats.requested++;
                break;
            case APP_CONSTANTS.STATUSES.ACCEPTED:
                stats.accepted++;
                break;
            case APP_CONSTANTS.STATUSES.REFUSED:
                stats.refused++;
                break;
            case APP_CONSTANTS.STATUSES.TRANSMITTED:
                stats.transmitted++;
                break;
        }
    });
    
    adminState.stats = stats;
    
    // Mettre à jour l'affichage
    elements.totalInscriptions.textContent = stats.total;
    elements.statusReceived.textContent = stats.received;
    elements.statusRequested.textContent = stats.requested;
    elements.statusAccepted.textContent = stats.accepted;
    elements.statusRefused.textContent = stats.refused;
    elements.statusTransmitted.textContent = stats.transmitted;
}

// === FILTRES ET TRI ===

function applyFilters() {
    let filtered = [...adminState.inscriptions];
    
    // Filtre par statut
    const statusFilter = elements.statusFilter.value;
    if (statusFilter) {
        filtered = filtered.filter(inscription => inscription.statut === statusFilter);
    }
    
    // Recherche textuelle
    const searchText = elements.searchText.value.toLowerCase().trim();
    if (searchText) {
        filtered = filtered.filter(inscription => 
            inscription.nom_prenom.toLowerCase().includes(searchText) ||
            inscription.numero_cp.toLowerCase().includes(searchText) ||
            inscription.lieu_affectation_uo.toLowerCase().includes(searchText)
        );
    }
    
    // Tri
    const sortBy = elements.sortBy.value;
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.date_inscription) - new Date(a.date_inscription);
            case 'date_asc':
                return new Date(a.date_inscription) - new Date(b.date_inscription);
            case 'nom_asc':
                return a.nom_prenom.localeCompare(b.nom_prenom);
            case 'nom_desc':
                return b.nom_prenom.localeCompare(a.nom_prenom);
            case 'statut':
                return a.statut.localeCompare(b.statut);
            default:
                return 0;
        }
    });
    
    adminState.filteredInscriptions = filtered;
    renderTable();
}

// === RENDU DU TABLEAU ===

function renderTable() {
    const tbody = elements.inscriptionsTableBody;
    const emptyState = elements.emptyState;
    
    if (adminState.filteredInscriptions.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        elements.inscriptionsTable.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    elements.inscriptionsTable.style.display = 'table';
    
    tbody.innerHTML = adminState.filteredInscriptions.map(inscription => {
        const [nom, prenom] = inscription.nom_prenom.split(' ', 2);
        
        return `
            <tr>
                <td>${nom || ''}</td>
                <td>${prenom || ''}</td>
                <td><code>${inscription.numero_cp}</code></td>
                <td>${inscription.lieu_affectation_uo}</td>
                <td>
                    <span class="status-badge status-${getStatusClass(inscription.statut)}">
                        ${getStatusIcon(inscription.statut)} ${inscription.statut}
                    </span>
                </td>
                <td>${APP_HELPERS.formatDate(inscription.date_inscription)}</td>
                <td>
                    <button class="btn-action" onclick="openStatusModal('${inscription.id}')">
                        Modifier
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(statut) {
    switch (statut) {
        case APP_CONSTANTS.STATUSES.RECEIVED: return 'received';
        case APP_CONSTANTS.STATUSES.REQUESTED: return 'requested';
        case APP_CONSTANTS.STATUSES.ACCEPTED: return 'accepted';
        case APP_CONSTANTS.STATUSES.REFUSED: return 'refused';
        case APP_CONSTANTS.STATUSES.TRANSMITTED: return 'transmitted';
        default: return 'received';
    }
}

function getStatusIcon(statut) {
    switch (statut) {
        case APP_CONSTANTS.STATUSES.RECEIVED: return '🟡';
        case APP_CONSTANTS.STATUSES.REQUESTED: return '🔵';
        case APP_CONSTANTS.STATUSES.ACCEPTED: return '✅';
        case APP_CONSTANTS.STATUSES.REFUSED: return '❌';
        case APP_CONSTANTS.STATUSES.TRANSMITTED: return '📧';
        default: return '⚪';
    }
}

// === MODAL DE MODIFICATION ===

function openStatusModal(inscriptionId) {
    const inscription = adminState.inscriptions.find(i => i.id === inscriptionId);
    if (!inscription) return;
    
    currentEditingInscription = inscription;
    
    // Remplir les informations
    elements.modalParticipantName.textContent = inscription.nom_prenom;
    elements.modalParticipantCP.textContent = inscription.numero_cp;
    elements.modalParticipantUO.textContent = inscription.lieu_affectation_uo;
    elements.modalStatus.value = inscription.statut;
    elements.modalComment.value = inscription.commentaires || '';
    
    // Afficher le modal
    elements.statusModal.style.display = 'flex';
    elements.modalStatus.focus();
}

function closeModal() {
    elements.statusModal.style.display = 'none';
    currentEditingInscription = null;
    elements.modalComment.value = '';
}

async function saveStatusChange() {
    if (!currentEditingInscription) return;
    
    const newStatus = elements.modalStatus.value;
    const comment = elements.modalComment.value.trim();
    
    try {
        showLoading(true);
        
        // TODO: Sauvegarder en base de données
        const success = await updateInscriptionStatus(
            currentEditingInscription.id,
            newStatus,
            comment
        );
        
        if (success) {
            // Mettre à jour localement
            currentEditingInscription.statut = newStatus;
            currentEditingInscription.commentaires = comment;
            currentEditingInscription.date_modification = new Date().toISOString();
            
            // Rafraîchir l'affichage
            updateStats();
            applyFilters();
            
            closeModal();
            
            showSuccess('Statut mis à jour avec succès');
        } else {
            showError('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showError('Erreur lors de la sauvegarde');
    } finally {
        showLoading(false);
    }
}

async function updateInscriptionStatus(id, newStatus, comment) {
    // Simulation
    if (typeof supabase === 'undefined') {
        console.warn('Supabase non configuré, simulation de la mise à jour');
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
    }
    
    try {
        const { error } = await supabase
            .from('inscriptions')
            .update({
                statut: newStatus,
                commentaires: comment,
                date_modification: new Date().toISOString()
            })
            .eq('id', id);
        
        return !error;
    } catch (error) {
        console.error('Erreur Supabase update:', error);
        return false;
    }
}

// === GESTION EMAIL ===

async function updateNotificationEmail() {
    const newEmail = elements.notificationEmail.value.trim();
    
    if (!newEmail || !isValidEmail(newEmail)) {
        showError('Adresse email invalide');
        return;
    }
    
    try {
        showLoading(true);
        
        // TODO: Sauvegarder en base
        const success = await saveEmailConfiguration(newEmail);
        
        if (success) {
            showSuccess('Email de notification mis à jour');
        } else {
            showError('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Erreur mise à jour email:', error);
        showError('Erreur lors de la sauvegarde');
    } finally {
        showLoading(false);
    }
}

async function testEmail() {
    const email = elements.notificationEmail.value.trim();
    
    if (!email || !isValidEmail(email)) {
        showError('Adresse email invalide');
        return;
    }
    
    try {
        showLoading(true);
        
        // TODO: Envoyer email de test
        await sendTestEmail(email);
        
        showSuccess('Email de test envoyé');
    } catch (error) {
        console.error('Erreur envoi test:', error);
        showError('Erreur lors de l\'envoi du test');
    } finally {
        showLoading(false);
    }
}

async function saveEmailConfiguration(email) {
    // Simulation
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
}

async function sendTestEmail(email) {
    // Simulation
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
}

// === UTILITAIRES ===

function showLoading(loading) {
    adminState.isLoading = loading;
    document.body.style.cursor = loading ? 'wait' : 'default';
}

function showError(message) {
    // Simple alert pour le moment
    alert('❌ ' + message);
}

function showSuccess(message) {
    // Simple alert pour le moment
    alert('✅ ' + message);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export pour utilisation dans le HTML (onclick)
window.openStatusModal = openStatusModal;

console.log('🎛️ Dashboard admin initialisé');