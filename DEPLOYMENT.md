# 🚀 Guide de Déploiement - Formulaire SUD Rail

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer complètement le système d'inscription SUD Rail, de la base de données Supabase au déploiement sur Netlify.

## ✅ Prérequis

- [x] Compte Supabase créé (`karinesudrail@gmail.com`)
- [x] Compte GitHub configuré (`KarineSud`)
- [x] Compte Netlify créé (`karinesudrail@gmail.com`)
- [x] Repository GitHub prêt

## 🗄️ Étape 1 : Configuration de la Base de Données

### 1.1 Accéder au Dashboard Supabase
1. Connectez-vous sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet : **"Formulaire"**
3. Allez dans l'onglet **"SQL Editor"**

### 1.2 Exécuter le Script d'Initialisation
1. Copiez le contenu du fichier `database/init.sql`
2. Collez-le dans l'éditeur SQL Supabase
3. Cliquez sur **"Run"** pour exécuter le script

### 1.3 Vérifier l'Installation
Exécutez cette requête pour vérifier que tout est correct :

```sql
-- Vérifier les tables créées
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('inscriptions', 'historique_statuts', 'configuration');

-- Vérifier les données de test
SELECT numero_cp, nom_prenom, statut FROM inscriptions;

-- Vérifier la configuration
SELECT email_notification FROM configuration;
```

Vous devriez voir :
- ✅ 3 tables créées
- ✅ 3 inscriptions de test
- ✅ Email de notification configuré

## 🌐 Étape 2 : Configuration Edge Functions (Optionnel)

### 2.1 Créer la Edge Function pour l'Email
Dans Supabase, allez dans **"Edge Functions"** et créez une nouvelle fonction :

```typescript
// Fichier: send-notification-email.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface NotificationData {
  nom_prenom: string;
  numero_cp: string;
  lieu_affectation_uo: string;
  date_inscription: string;
  email_notification: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nom_prenom, numero_cp, lieu_affectation_uo, date_inscription, email_notification }: NotificationData = await req.json()

    // Template de l'email
    const emailContent = `
Bonjour Karine,

Nouvelle inscription reçue pour le forum du 07 octobre 2025 :

👤 Nom/Prénom : ${nom_prenom}
🏢 Numéro CP : ${numero_cp}
📍 Lieu d'affectation (UO) : ${lieu_affectation_uo}
📅 Date d'inscription : ${new Date(date_inscription).toLocaleString('fr-FR')}

➡️ Accéder au dashboard : https://karinesud.github.io/formulaire-sudrail/admin.html

Cordialement,
Système d'inscription SUD Rail
    `;

    // TODO: Intégrer avec un service d'email (SendGrid, Resend, etc.)
    console.log('Email à envoyer à:', email_notification);
    console.log('Contenu:', emailContent);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification envoyée' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

## 🔗 Étape 3 : Vérifier les URLs et Clés

### 3.1 Variables Supabase
Vérifiez dans **Project Settings > API** :

- **URL** : `https://kihijnybtfvwmjdtabyy.supabase.co` ✅
- **Clé publique** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ✅

### 3.2 Mettre à Jour les Fichiers de Configuration
Si les clés ont changé, mettez à jour `config/supabase.js`.

## 🌍 Étape 4 : Déploiement sur Netlify

### 4.1 Connecter le Repository
1. Allez sur [netlify.com](https://netlify.com)
2. Cliquez sur **"Add new site"**
3. Choisissez **"Import an existing project"**
4. Connectez votre compte GitHub
5. Sélectionnez le repository `formulaire-sudrail`

### 4.2 Configuration du Build
- **Build command** : (laisser vide)
- **Publish directory** : `./`
- **Branch to deploy** : `main`

### 4.3 Variables d'Environnement
Ajoutez les variables suivantes dans **Site settings > Environment variables** :

```
SUPABASE_URL=https://kihijnybtfvwmjdtabyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.4 Déployer
Cliquez sur **"Deploy site"**. Netlify va :
1. Récupérer le code depuis GitHub
2. Déployer automatiquement
3. Vous donner une URL (ex: `https://magical-name-123456.netlify.app`)

### 4.5 Configurer un Domaine Custom (Optionnel)
Dans **Site settings > Domain management**, vous pouvez :
- Changer le nom du site : `formulaire-sudrail.netlify.app`
- Ajouter un domaine personnalisé

## 🧪 Étape 5 : Tests Complets

### 5.1 Test du Formulaire Public
1. Allez sur votre URL Netlify
2. Remplissez le formulaire avec :
   - **Nom** : `Test Déploiement`
   - **Prénom** : `Karine`
   - **CP** : `TEST2025`
   - **UO** : `Test Netlify`
3. Vérifiez que l'inscription fonctionne

### 5.2 Test du Dashboard Admin
1. Allez sur `https://votre-site.netlify.app/admin.html`
2. Connectez-vous avec :
   - **Email** : `karinesudrail@gmail.com`
   - **Mot de passe** : `Karinesudr@il2025`
3. Vérifiez que vous voyez les inscriptions
4. Testez la modification de statut

### 5.3 Vérification Base de Données
Dans Supabase, vérifiez que la nouvelle inscription apparaît :

```sql
SELECT * FROM inscriptions ORDER BY date_inscription DESC LIMIT 5;
```

## 🔧 Étape 6 : Configuration GitHub Pages (Alternative)

Si vous préférez GitHub Pages à Netlify :

### 6.1 Activer GitHub Pages
1. Dans le repository GitHub, allez dans **Settings**
2. Descendez à **"Pages"**
3. Source : **"Deploy from a branch"**
4. Branch : **"main"**
5. Folder : **"/ (root)"**

### 6.2 URLs GitHub Pages
- **Formulaire** : `https://karinesud.github.io/formulaire-sudrail/`
- **Admin** : `https://karinesud.github.io/formulaire-sudrail/admin.html`

## 📧 Étape 7 : Configuration Email (À Compléter)

Pour recevoir les vraies notifications email :

### 7.1 Choisir un Service Email
- **Resend** (recommandé pour Supabase)
- **SendGrid**
- **Mailgun**

### 7.2 Intégrer avec Edge Functions
Modifiez la Edge Function pour utiliser le service choisi.

## 🔍 Étape 8 : Monitoring et Maintenance

### 8.1 Monitoring Supabase
- **Dashboard** : Surveillez les requêtes et performances
- **Logs** : Vérifiez les erreurs dans les logs

### 8.2 Monitoring Netlify
- **Analytics** : Trafic et performances du site
- **Function logs** : Si vous utilisez les Netlify Functions

### 8.3 GitHub
- **Actions** : Surveillez les déploiements automatiques

## 🚨 Dépannage

### Problème : Formulaire ne s'envoie pas
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les clés Supabase dans `config/supabase.js`
3. Vérifiez les politiques RLS dans Supabase

### Problème : Dashboard admin ne charge pas
1. Vérifiez l'URL d'accès
2. Vérifiez les identifiants dans `config/constants.js`
3. Vérifiez la console pour erreurs JavaScript

### Problème : Base de données vide
1. Ré-exécutez le script `database/init.sql`
2. Vérifiez les politiques RLS
3. Vérifiez les triggers et fonctions

## ✅ Checklist Final

### Étapes Obligatoires
- [ ] Base de données Supabase initialisée
- [ ] Script `database/init.sql` exécuté avec succès
- [ ] Site déployé sur Netlify (ou GitHub Pages)
- [ ] Test complet du formulaire public
- [ ] Test complet du dashboard admin
- [ ] Verification des inscriptions en base

### Étapes Optionnelles
- [ ] Edge Functions configurées pour email
- [ ] Service email intégré
- [ ] Domaine personnalisé configuré
- [ ] Monitoring mis en place

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans Supabase et Netlify
2. Consultez la documentation dans le README.md
3. Vérifiez les issues GitHub existantes

---

**🎉 Félicitations ! Votre système d'inscription SUD Rail est maintenant opérationnel !**

Les agents peuvent s'inscrire via le formulaire public, et vous pouvez gérer toutes les demandes via le dashboard administrateur.