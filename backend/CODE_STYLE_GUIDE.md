# TSN Code Style Guide - Refactoring de Nettoyage

## Objectif
Ce guide documente le refactoring effectué pour nettoyer le code du projet TSN :
- ✅ Suppression des commentaires montrant un développement assisté par IA
- ✅ Renommage systématique des variables et fonctions en français
- ✅ Documentation claire des fonctions avec un format uniforme
- ✅ Suppression des emojis non-essentiels (sauf dans les vues)

---

## 1. Conventions de Nommage

### Fonctions
- **Format français simple** : `verbeNom()` en camelCase
- **Exemples** : `creerNotification()`, `obtenirCompteurNotifications()`, `marquerToutCommeLu()`

### Variables
- **Format français** : `nounAdjectif` en camelCase
- **Exemples** : 
  - `idUtilisateur` (user id)
  - `nomDaffichage` (display name)
  - `scoreFinal` (final score)
  - `idsGroupes` (group ids array)

### Constantes
- **Format UPPERCASE_SNAKE_CASE** : `CONSTANTE_IMPORTANTE`
- **Exemples** : `MAX_POSTS_PER_FEED = 50`

### Collections (arrays, sets, maps)
- **Pluriel français** : `idsUtilisateurs`, `listeCommentaires`, `carteScores`

---

## 2. Documentation des Fonctions

### Format Uniforme
```javascript
//////////
// Description brève de ce que fait la fonction
// Détail du processus interne (optionnel)
// Retourne: type de données retournées
//////////
export async function nomDeLaFonction(parametres) {
  // Code...
}
```

### Exemples
```javascript
//////////
// Crée une notification et l'envoie via SSE
// Récupère les infos complètes et met à jour le compteur unread
// Retourne: objet notification complet
//////////
export async function creerNotification({ type, toUserId, ... }) {
  // ...
}

//////////
// Obtient le compteur de notifications non lues
// Compte les notifications avec readAt = NULL
// Retourne: nombre entier (count)
//////////
export async function obtenirCompteurNotifications(idUtilisateur) {
  // ...
}
```

---

## 3. Refactoring Effectué

### ✅ Middlewares (100% refactorisé)
- `attachUnreadCount` → `ajouterCompteurNotificationsNonLues`
- `attachUnreadMessages` → `ajouterCompteurMessagesNonLus`
- `requireAuth` → `exigerAuthentification`

### ✅ Services (100% refactorisé)
- `createNotification` → `creerNotification`
- `markAllRead` → `marquerToutCommeLu`
- `getUnreadCount` → `obtenirCompteurNotifications`

### ✅ Realtime/SSE (100% refactorisé)
- `addClient` → `ajouterClient`
- `removeClient` → `retirerClient`
- `pushToUser` → `envoyerAUtilisateur`
- `broadcastMessage` → `diffuserMessage`

### ✅ Routes - Posts (100% refactorisé)
- `postsRouter` → `routesPosts`
- Variables renommées : `meId` → `idUtilisateur`, `debug` → `affichageDebug`, etc.
- Algorithme feed complètement documenté avec variables explicites

### ⏳ À Refactoriser (32 fichiers restants)
Voir sections ci-dessous pour priorité

---

## 4. Ordre de Refactorisation Suggéré

### Priorité 1 - Fichiers Critiques (Routes principales)
- [ ] `src/users/users.routes.js` - Recommandations et follow system
- [ ] `src/users/profiles.routes.js` - Profils utilisateurs
- [ ] `src/messages/messages.routes.js` - Messaging system
- [ ] `src/notifications/notifications.routes.js` - Notifications
- [ ] `src/comments/comments.routes.js` - Comments system

### Priorité 2 - Fichiers Importants (Groupes, Intérêts)
- [ ] `src/groups/groups.routes.js`
- [ ] `src/interests/interests.routes.js`
- [ ] `src/friends/friends.routes.js`
- [ ] `src/events/events.routes.js`

### Priorité 3 - Services et Controllers
- [ ] `src/users/users.service.js`
- [ ] `src/users/users.controller.js`
- [ ] `src/posts/posts.service.js`
- [ ] `src/posts/posts.controller.js`
- [ ] `src/services/privacy.js`

### Priorité 4 - Fichiers Utilitaires
- [ ] `src/db.js` - Database helpers
- [ ] `src/config.js` - Configuration
- [ ] `src/public/utils/validations.js`
- [ ] `src/public/utils/asyncHandler.js`

---

## 5. Commentaires à Utiliser

### Documentation de Blocs
```javascript
//////////
// Description de la fonctionnalité
//////////
```

### Commentaires Explicatifs
```javascript
// Vérifier les permissions de visibilité
// Récupérer les posts des utilisateurs suivis
// Incrémenter le compteur de likes
```

### ❌ À Éviter
- ❌ Emojis (sauf dans les vues HTML)
- ❌ "Aha!", "Trouvé!", "Parfait!", "Bon!", etc.
- ❌ Commentaires montrant une génération par IA
- ❌ Blocs de code commentés (utiliser git history)

---

## 6. Exemples de Patterns Refactorisés

### Variables Intermédiaires
```javascript
// AVANT
const myFollows = await query(...);
const already = new Set(...);
const hop1 = myFollows.map(...);

// APRÈS
const mesAbonnements = await query(...);
const deja = new Set(...);
const sautUn = mesAbonnements.map(...);
```

### Conditionnelles
```javascript
// AVANT
if (!req.user?.id) { ... }

// APRÈS
if (!idUtilisateur) { ... }
```

### Noms de Paramètres
```javascript
// AVANT
function computeScore(p) { ... }

// APRÈS
function calculerDetailsScore(publication) { ... }
```

---

## 7. Checklist pour Nouveau Refactoring

Avant de valider un refactoring :
- [ ] Tous les noms de fonction sont en français
- [ ] Toutes les variables sont en français
- [ ] Les constantes sont en UPPERCASE_SNAKE_CASE
- [ ] Les fonctions ont un bloc de description `//////////`
- [ ] Aucun emoji en dehors des vues EJS
- [ ] Aucun commentaire "dev IA"
- [ ] Le code passe les tests (si applicable)
- [ ] Les imports sont mis à jour dans les fichiers qui utilisent ces fonctions

---

## 8. État du Projet

### Refactorisé ✅
- Middlewares d'authentification
- Services de notifications
- Routes et SSE pour le realtime
- Route posts (feed + création)

### En Cours ⏳
- Routes principales (users, messages, etc.)

### À Faire 📋
- Services et controllers
- Fichiers utilitaires
- Routes secondaires (friends, interests, events, etc.)

---

## Notes

- Ce refactoring est **progressif** et **non-bloquant**
- Le code continue à fonctionner avec les anciens noms importés
- Les changements sont appliqués module par module
- Priorité : fonctionnalité > esthétique du code
