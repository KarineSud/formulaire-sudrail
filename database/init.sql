-- ===============================================
-- SCRIPT SQL D'INITIALISATION SUPABASE
-- Projet: Formulaire d'inscription SUD Rail
-- Date: Août 2025
-- ===============================================

-- Supprimer les tables existantes si elles existent (pour réinitialisation)
DROP TABLE IF EXISTS historique_statuts CASCADE;
DROP TABLE IF EXISTS inscriptions CASCADE;
DROP TABLE IF EXISTS configuration CASCADE;

-- Supprimer les fonctions et triggers existants
DROP TRIGGER IF EXISTS on_inscription_created ON inscriptions;
DROP FUNCTION IF EXISTS notify_new_inscription();
DROP FUNCTION IF EXISTS update_modification_date();

-- ===============================================
-- 1. TABLE DES INSCRIPTIONS (table principale)
-- ===============================================

CREATE TABLE inscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_cp TEXT UNIQUE NOT NULL,
    nom_prenom TEXT NOT NULL,
    lieu_affectation_uo TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'Demande reçue',
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    commentaires TEXT,
    
    -- Contraintes de validation
    CONSTRAINT check_numero_cp_length CHECK (length(numero_cp) >= 3 AND length(numero_cp) <= 10),
    CONSTRAINT check_nom_prenom_length CHECK (length(nom_prenom) >= 2 AND length(nom_prenom) <= 100),
    CONSTRAINT check_lieu_affectation_length CHECK (length(lieu_affectation_uo) >= 2 AND length(lieu_affectation_uo) <= 100),
    CONSTRAINT check_statut_valide CHECK (statut IN (
        'Demande reçue',
        'Demande de dégagement demandée',
        'Demande acceptée',
        'Demande refusée',
        'Réponse transmise à l''agent'
    ))
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_inscriptions_numero_cp ON inscriptions(numero_cp);
CREATE INDEX idx_inscriptions_statut ON inscriptions(statut);
CREATE INDEX idx_inscriptions_date_inscription ON inscriptions(date_inscription DESC);

-- ===============================================
-- 2. TABLE D'HISTORIQUE DES CHANGEMENTS DE STATUT
-- ===============================================

CREATE TABLE historique_statuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscription_id UUID NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
    ancien_statut TEXT,
    nouveau_statut TEXT NOT NULL,
    date_changement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    commentaire TEXT
);

-- Index pour l'historique
CREATE INDEX idx_historique_inscription_id ON historique_statuts(inscription_id);
CREATE INDEX idx_historique_date ON historique_statuts(date_changement DESC);

-- ===============================================
-- 3. TABLE DE CONFIGURATION
-- ===============================================

CREATE TABLE configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_notification TEXT NOT NULL DEFAULT 'karinesudrail@gmail.com',
    derniere_modification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte pour s'assurer qu'il n'y a qu'une seule ligne de config
    CONSTRAINT unique_config CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Insérer la configuration par défaut
INSERT INTO configuration (id, email_notification) 
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'karinesudrail@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- 4. FONCTIONS UTILITAIRES
-- ===============================================

-- Fonction pour mettre à jour automatiquement la date de modification
CREATE OR REPLACE FUNCTION update_modification_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour date_modification automatiquement
CREATE TRIGGER trigger_update_modification_date
    BEFORE UPDATE ON inscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_modification_date();

-- Fonction pour créer un historique automatique lors des changements de statut
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Insérer dans l'historique seulement si le statut a changé
    IF OLD.statut IS DISTINCT FROM NEW.statut THEN
        INSERT INTO historique_statuts (
            inscription_id,
            ancien_statut,
            nouveau_statut,
            commentaire
        ) VALUES (
            NEW.id,
            OLD.statut,
            NEW.statut,
            NEW.commentaires
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'historique des statuts
CREATE TRIGGER trigger_status_history
    AFTER UPDATE ON inscriptions
    FOR EACH ROW
    EXECUTE FUNCTION create_status_history();

-- ===============================================
-- 5. FONCTION DE NOTIFICATION EMAIL
-- ===============================================

CREATE OR REPLACE FUNCTION notify_new_inscription()
RETURNS TRIGGER AS $$
DECLARE
    notification_email TEXT;
BEGIN
    -- Récupérer l'email de notification depuis la configuration
    SELECT email_notification INTO notification_email
    FROM configuration
    WHERE id = '00000000-0000-0000-0000-000000000000'::uuid;
    
    -- TODO: Intégrer avec Supabase Edge Functions pour l'envoi d'email
    -- Pour le moment, on log juste l'événement
    RAISE LOG 'Nouvelle inscription: % (CP: %) - Email à envoyer à: %', 
        NEW.nom_prenom, NEW.numero_cp, notification_email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les notifications de nouvelles inscriptions
CREATE TRIGGER trigger_new_inscription_notification
    AFTER INSERT ON inscriptions
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_inscription();

-- ===============================================
-- 6. CONFIGURATION RLS (ROW LEVEL SECURITY)
-- ===============================================

-- Activer RLS sur toutes les tables
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_statuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les insertions publiques (formulaire)
CREATE POLICY "Allow public insert" ON inscriptions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Politique pour permettre la lecture publique pour vérification CP
CREATE POLICY "Allow public select for CP check" ON inscriptions
    FOR SELECT TO anon
    USING (true);

-- Politique pour permettre tout aux utilisateurs authentifiés (admin)
CREATE POLICY "Allow all for authenticated users" ON inscriptions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on history" ON historique_statuts
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on config" ON configuration
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- ===============================================
-- 7. DONNÉES DE TEST (OPTIONNEL)
-- ===============================================

-- Insérer quelques données de test pour valider le système
INSERT INTO inscriptions (numero_cp, nom_prenom, lieu_affectation_uo, statut, commentaires) VALUES
('8710320P', 'Karine Sud Rail', 'UO PCD-COGC', 'Demande reçue', 'Inscription de test de Karine'),
('1234567A', 'Jean Dupont', 'UO Lyon Part-Dieu', 'Demande de dégagement demandée', 'Demande transmise au chef de service'),
('TESTCP01', 'Marie Martin', 'UO Gare du Nord', 'Demande acceptée', 'Dégagement accordé par la hiérarchie')
ON CONFLICT (numero_cp) DO NOTHING;

-- ===============================================
-- 8. VUES UTILES (OPTIONNEL)
-- ===============================================

-- Vue pour les statistiques par statut
CREATE OR REPLACE VIEW v_stats_statuts AS
SELECT 
    statut,
    COUNT(*) as nombre,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as pourcentage
FROM inscriptions
GROUP BY statut
ORDER BY nombre DESC;

-- Vue pour l'historique complet avec détails
CREATE OR REPLACE VIEW v_historique_complet AS
SELECT 
    h.id,
    h.date_changement,
    i.numero_cp,
    i.nom_prenom,
    h.ancien_statut,
    h.nouveau_statut,
    h.commentaire
FROM historique_statuts h
JOIN inscriptions i ON h.inscription_id = i.id
ORDER BY h.date_changement DESC;

-- ===============================================
-- SCRIPT TERMINÉ
-- ===============================================

-- Afficher un résumé des tables créées
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('inscriptions', 'historique_statuts', 'configuration')
ORDER BY tablename;

-- Afficher les contraintes créées
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname IN ('inscriptions', 'historique_statuts', 'configuration')
)
ORDER BY conname;