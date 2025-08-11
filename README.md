# 🎯 Formulaire d'Inscription SUD Rail

Formulaire d'inscription en ligne pour le forum contractuels SUD Rail du **07 octobre 2025**.

## 🚀 Démonstration

- **Formulaire public** : [GitHub Pages](https://karinesud.github.io/formulaire-sudrail/)
- **Dashboard admin** : [admin.html](https://karinesud.github.io/formulaire-sudrail/admin.html)

## 📋 Fonctionnalités

### Pour les Agents
- ✅ Inscription simple avec 3 champs obligatoires
- ✅ Vérification anti-doublons en temps réel
- ✅ Interface responsive (mobile/desktop)
- ✅ Validation côté client instantanée
- ✅ Message de confirmation

### Pour l'Administration
- 📊 Dashboard de suivi complet
- 📧 Notifications email automatiques
- 🔄 Gestion du workflow des demandes (5 statuts)
- 📈 Statistiques en temps réel
- 🔍 Filtres et tri des inscriptions

## 🏗️ Architecture

- **Frontend** : HTML5, CSS3, JavaScript Vanilla
- **Backend** : Supabase (PostgreSQL + API REST)
- **Hébergement** : Netlify / GitHub Pages
- **Email** : Supabase Edge Functions

## 🔧 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/KarineSud/formulaire-sudrail.git
cd formulaire-sudrail
```

### 2. Configuration Supabase
Mettre à jour les variables dans `config/supabase.js` :
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Déploiement
Le projet est statique et peut être déployé sur :
- Netlify (recommandé)
- GitHub Pages
- Vercel
- Tout serveur web

## 📊 Structure de la Base de Données

### Table `inscriptions`
```sql
CREATE TABLE inscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_cp TEXT UNIQUE NOT NULL,
    nom_prenom TEXT NOT NULL,
    lieu_affectation_uo TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'Demande reçue',
    date_inscription TIMESTAMP DEFAULT NOW(),
    date_modification TIMESTAMP DEFAULT NOW(),
    commentaires TEXT
);
```

### Table `configuration`
```sql
CREATE TABLE configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_notification TEXT NOT NULL DEFAULT 'karinesudrail@gmail.com',
    derniere_modification TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Workflow des Demandes

1. **🟡 Demande reçue** - État initial après inscription
2. **🔵 Demande de dégagement demandée** - Transmise aux responsables
3. **✅ Demande acceptée** - Dégagement accordé
4. **❌ Demande refusée** - Dégagement refusé
5. **📧 Réponse transmise à l'agent** - Processus terminé

## 🎨 Charte Graphique

- **Couleur principale** : `#2E8B57` (Vert syndical)
- **Couleur secondaire** : `#DC143C` (Rouge syndical)
- **Police** : Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- **Design** : Modern, responsive, accessible

## 🔐 Sécurité

- ✅ Validation côté client et serveur
- ✅ Protection contre les doublons
- ✅ Rate limiting par IP
- ✅ Sanitisation des données
- ✅ HTTPS obligatoire
- ✅ RLS (Row Level Security) Supabase

## 📱 Responsive

- **Mobile** : < 768px - Interface optimisée
- **Tablet** : 768px - 1024px - Adaptation intermédiaire  
- **Desktop** : > 1024px - Version complète

## 🚀 Déploiement

### Variables d'environnement
```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

### Netlify
1. Connecter le repository GitHub
2. Build command : (aucune)
3. Publish directory : `./`
4. Ajouter les variables d'environnement

## 📞 Support

Pour toute question technique :
- 📧 Email : karinesudrail@gmail.com
- 🐛 Issues : [GitHub Issues](https://github.com/KarineSud/formulaire-sudrail/issues)

## 📜 Licence

© 2025 SUD Rail - Projet interne syndical

---

**Développé avec ❤️ pour SUD Rail**