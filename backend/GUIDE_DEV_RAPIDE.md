# TSN - Guide Rapide Développement

## 🚀 Démarrage

```bash
cd backend
npm install
npm start
# Serveur sur http://localhost:3000
```

---

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── index.js                    # Point d'entrée Express
│   ├── db.js                       # Helpers MySQL (query, queryOne)
│   ├── config.js                   # Configuration
│   │
│   ├── auth/                       # Authentification
│   │   ├── auth.routes.js
│   │   ├── auth.middleware.js      # exigerAuthentification()
│   │   └── jwt.js
│   │
│   ├── posts/                      # Publications & Feed
│   │   └── posts.routes.js         # Algorithme scoring feed
│   │
│   ├── users/                      # Utilisateurs
│   │   ├── users.routes.js         # Recommandations FOAF
│   │   └── profiles.routes.js      # Profils & édition
│   │
│   ├── notifications/              # Notifications
│   │   ├── notifications.routes.js
│   │   ├── notifications.service.js
│   │   └── unread.middleware.js
│   │
│   ├── messages/                   # Messagerie
│   │   └── messages.routes.js
│   │
│   ├── groups/                     # Groupes
│   │   └── groups.routes.js
│   │
│   ├── realtime/                   # SSE Temps réel
│   │   └── sse.js                  # envoyerAUtilisateur()
│   │
│   ├── services/
│   │   └── privacy.js              # Vérification visibilité
│   │
│   └── views/                      # Templates EJS
│       ├── feed/
│       ├── users/
│       ├── profiles/
│       └── ...
│
└── package.json
```

---

## 🔑 Points d'Entrée Clés

### Feed (Algorithme Principal)
- **Fichier** : `src/posts/posts.routes.js`
- **Route** : `GET /posts/feed`
- **Algorithme** : Scoring based on :
  - Relation (ami, suivi, public) → 10-100 pts
  - Intérêts communs (Jaccard) → jusqu'à 20 pts
  - Fraîcheur → jusqu'à 40 pts
  - Engagement (likes, commentaires) → jusqu'à 24 pts
  - Bonus groupe → 20 pts
- **Retourne** : Top 50 posts triés par score

### Recommandations Utilisateurs
- **Fichier** : `src/users/users.routes.js`
- **Route** : `GET /users/recommendations`
- **Algo** : FOAF + Jaccard similarity
- **Retourne** : Top 20 candidats recommandés

### Notifications
- **Service** : `src/notifications/notifications.service.js`
  - `creerNotification()` - Crée et envoie via SSE
  - `obtenirCompteurNotifications()` - Compte unread
- **Middleware** : `src/notifications/unread.middleware.js`
  - Attache le compteur à `res.locals`

### Temps Réel (SSE)
- **Fichier** : `src/realtime/sse.js`
- **Fonctions** :
  - `ajouterClient(idUtilisateur, reponse)` - Subscribe
  - `envoyerAUtilisateur(idUtilisateur, charge)` - Send event
- **Usage** : Notifications, messages live, etc.

---

## 💡 Conventions Code

### Noms de Fonctions (Français)
```javascript
// ✅ BON
export function obtenirUtilisateur(id) { }
export async function creerNotification(data) { }
export function peutVoirPublication(user, post) { }

// ❌ MAUVAIS
export function getUser(id) { }
export function createNotif(data) { }
```

### Noms de Variables (Français + Explicite)
```javascript
// ✅ BON
const idUtilisateur = req.user.id;
const nomAffichage = user.displayName;
const isActive = true;

// ❌ MAUVAIS
const userId = req.user.id;
const dn = user.displayName;
```

### Documentation Fonctions
```javascript
//////////
// Description brève de ce que fait la fonction
// Détail du processus si complexe
// Retourne: type de données retournées
//////////
export async function obtenirUtilisateurs(limite) {
  // ...
}
```

### Commentaires Internes
```javascript
// Récupérer les utilisateurs actifs
// Filtrer par date
const actifs = await query(`...`);

// ❌ ÉVITER
// get active users (mauvais mélange langue)
// TODO: optimize this later (orphelin)
// Aha! This works! (amateur)
```

---

## 🔄 Pattern Récurrent : Route avec Permissions

```javascript
//////////
// Récupère les données si permises
// Vérifie la visibility de l'objet
// Retourne: vue ou erreur 403
//////////
routesExemple.get("/:id", exigerAuthentification, async (req, res) => {
  const idObjet = Number(req.params.id);
  
  const objet = await queryOne(
    "SELECT * FROM Objet WHERE id = ?",
    [idObjet]
  );
  
  if (!objet) return res.status(404).render("errors/404");
  
  // Vérifier les permissions
  if (objet.visibility === "PRIVATE" && objet.ownerId !== req.user.id) {
    return res.status(403).render("errors/404");
  }
  
  res.render("objet/show", { user: req.user, objet });
});
```

---

## 📚 Helpers Disponibles

### Database
```javascript
import { query, queryOne } from "../db.js";

const rows = await query("SELECT * FROM User", []);
const unRow = await queryOne("SELECT * FROM User WHERE id = ?", [1]);
```

### Authentication
```javascript
import { exigerAuthentification } from "../auth/auth.middleware.js";

routeur.get("/...", exigerAuthentification, (req, res) => {
  // req.user.id est disponible
});
```

### Notifications
```javascript
import { creerNotification } from "../notifications/notifications.service.js";

await creerNotification({
  type: "LIKE",
  toUserId: 123,
  fromUserId: 456,
  postId: 789
});
```

### SSE Realtime
```javascript
import { envoyerAUtilisateur } from "../realtime/sse.js";

envoyerAUtilisateur(idUtilisateur, {
  type: "new_message",
  message: "Hello!"
});
```

---

## 🧪 Checklist Nouveau Endpoint

- [ ] Nommer la fonction en français : `async function obtenirXXX() {}`
- [ ] Ajouter documentation `//////////` bloc
- [ ] Utiliser `exigerAuthentification` si besoin auth
- [ ] Vérifier les permissions (visibility, ownership)
- [ ] Mapper les données avant render
- [ ] Ajouter gestion d'erreur try/catch
- [ ] Tester manuellement
- [ ] Mettre à jour doc si algo complexe

---

## 🐛 Debugging

### Logs
```javascript
console.log("DEBUG:", variable);
console.error("ERREUR:", err.message);
```

### Database Debug
```javascript
// Voir la vraie requête SQL avec ?
console.log("SQL:", sql, params);
const result = await query(sql, params);
```

### SSE Debug
```javascript
// Voir les clients connectés
console.log("Clients:", clients.size);
```

---

## 🚀 Déploiement

La structure est prête pour hébergement sur :
- Alwaysdata (MySQL + Node.js)
- Heroku
- Railway
- DigitalOcean

Changements nécessaires :
1. Déplacer `config.js` → variables d'env
2. Ajouter `.env` au gitignore
3. Tester en production

---

## 📞 Support Rapide

**Questions courantes ?** Voir `CODE_STYLE_GUIDE.md` et `REFACTORING_RAPPORT.md`

**Problem ?** Cherche dans :
1. Messages de console (npm start)
2. Erreurs SQL (vérifier requête)
3. Logs middleware

Bon développement ! 🚀
