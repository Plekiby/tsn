# Migration vers le système Follow uniquement

## 📋 Résumé

Migration du système **Follow + Friendship** vers un système simplifié **Follow uniquement** avec détection automatique des mutuals.

---

## 🎯 Objectifs

- ✅ **Simplifier** : Un seul type de connexion (Follow)
- ✅ **Moderniser** : Adopter le modèle Twitter/Instagram
- ✅ **Conserver les notifications** : Notifier quand quelqu'un vous suit
- ✅ **Détecter les mutuals** : Identifier automatiquement les connexions bidirectionnelles

---

## ⚙️ Changements effectués

### 1. **Algorithme de recommandations** (`users.routes.js`)

**Avant :**
```javascript
// Amis confirmés (table Friendship)
const friendships = await query(
  "SELECT userAId, userBId FROM Friendship WHERE userAId = ? OR userBId = ?",
  [meId, meId]
);
// Score : amis = 25 pts, follows = 10 pts
```

**Après :**
```javascript
// Mutuals détectés automatiquement (Follow bidirectionnel)
const mutuals = await query(
  "SELECT * FROM Follow WHERE followerId = ? AND followedId = ?",
  [mutual, cand]
);
// Score : mutuals = 20 pts, follows = 10 pts
```

**Impact :**
- Symbole changé : ⭐ (ami) → 🔄 (mutual)
- Score mutuals : 25 pts → 20 pts (toujours prioritaire mais moins que "ami confirmé")

---

### 2. **Feed de posts** (`posts.routes.js`)

**Changement :**
- Remplacé `Friendship` par détection de mutuals via Follow
- Posts "FRIENDS" maintenant visibles pour les mutuals

```javascript
// Ancien : SELECT FROM Friendship
// Nouveau : détection de follow bidirectionnel
const mutuals = await query(
  `SELECT followerId FROM Follow
   WHERE followedId = ? AND followerId IN (?)`,
  [meId, followingIds]
);
```

---

### 3. **Commentaires** (`comments.routes.js`)

**Changement :**
- Même logique que le feed
- Permission "FRIENDS" = permission "MUTUALS"

---

### 4. **Page Friends** (`friends.routes.js`)

**Avant :**
- `/friends?tab=followers` : mes followers
- `/friends?tab=following` : mes follows
- Routes `/friends/request/:id`, `/friends/accept/:id`, `/friends/reject/:id`

**Après :**
```javascript
// Simplifié
- `/friends?tab=followers` : mes followers
- `/friends?tab=following` : mes follows
- `/friends?tab=mutuals` : mes mutuals (NOUVEAU)
// Plus de routes request/accept/reject
```

**Nouveau :** Onglet **Mutuals** qui affiche les connexions bidirectionnelles

---

### 5. **Notifications**

**Conservées :**
- ✅ Notification quand quelqu'un vous suit (`FOLLOW`)

**Supprimées :**
- ❌ Notification de demande d'ami (`FRIEND_REQUEST`)
- ❌ Notification d'acceptation (`FRIEND_ACCEPTED`)

---

## 🗑️ Tables supprimées

### `FriendRequest`
```sql
DROP TABLE IF EXISTS FriendRequest;
```
- Contenait les demandes d'ami en attente
- Plus nécessaire avec le système Follow

### `Friendship`
```sql
DROP TABLE IF EXISTS Friendship;
```
- Contenait les amitiés confirmées
- Remplacée par détection automatique de mutuals

---

## 🔄 Comment exécuter la migration ?

### Option 1 : Script Node.js interactif (RECOMMANDÉ)

```bash
cd backend
node remove-friendship-tables.js
```

**Le script va :**
1. Afficher un résumé des données à supprimer
2. Demander confirmation (taper "OUI")
3. Supprimer les notifications liées
4. Supprimer les tables FriendRequest et Friendship

### Option 2 : SQL direct

```bash
# Depuis MySQL client
mysql -h mysql-cltsn.alwaysdata.net -u cltsn -p cltsn_db < remove-friendship-tables.sql
```

---

## 📊 Équivalences

| Ancien système | Nouveau système |
|----------------|-----------------|
| Ami confirmé ⭐ (Friendship) | Mutual 🔄 (Follow bidirectionnel) |
| Demande d'ami → Acceptation | Follow → Notification (1 étape) |
| Score ami = 25 pts | Score mutual = 20 pts |
| Posts "FRIENDS" | Posts pour "MUTUALS" |

---

## 🎨 Interface utilisateur

### Page Recommandations
- **Avant :** "5 amis en commun ⭐"
- **Après :** "5 mutuals 🔄"

### Badges
- **Avant :** `dev1 ⭐` (ami confirmé)
- **Après :** `dev1 🔄` (vous vous suivez mutuellement)

### Explication
```
(🔄 = vous vous suivez mutuellement)
```

---

## 🧪 Tests après migration

### 1. Vérifier les recommandations
```
GET /users/recommendations
→ Doit afficher les mutuals avec 🔄
```

### 2. Vérifier le feed
```
GET /posts/feed
→ Posts "FRIENDS" visibles pour les mutuals
```

### 3. Vérifier la page Friends
```
GET /friends?tab=mutuals
→ Affiche la liste des connexions bidirectionnelles
```

### 4. Vérifier les notifications
```
POST /users/:id/follow
→ Crée une notification FOLLOW (pas FRIEND_REQUEST)
```

---

## 🐛 Problèmes potentiels

### Erreur "Table doesn't exist"
Si l'app crash avec "Friendship doesn't exist" :
```bash
# Redémarrer le serveur après la migration
npm run dev
```

### Posts "FRIENDS" non visibles
Vérifier que les deux utilisateurs se suivent mutuellement :
```sql
-- User A suit User B
SELECT * FROM Follow WHERE followerId = A AND followedId = B;
-- User B suit User A
SELECT * FROM Follow WHERE followerId = B AND followedId = A;
```

---

## 💡 Avantages du nouveau système

### Simplicité
- ❌ 3 tables (Follow, FriendRequest, Friendship)
- ✅ 1 table (Follow)

### UX moderne
- ❌ Envoyer demande → Attendre acceptation → Devenir amis
- ✅ Follow → Notification → L'autre peut follow back

### Code maintenable
- ❌ Gérer les statuts PENDING/ACCEPTED/REJECTED
- ✅ Un seul état : Follow existe ou non

### Performance
- ❌ JOINs complexes sur 3 tables
- ✅ Queries simples sur Follow

---

## 🔮 Évolutions futures possibles

### Court terme
- Ajouter un bouton "Follow back" dans les notifications
- Afficher un badge "Mutual" sur les profils

### Moyen terme
- Page dédiée "/mutuals" avec statistiques
- Suggestions de mutuals basées sur les intérêts

### Long terme
- "Close friends" : liste privée de mutuals favoris
- Stories visibles uniquement par les close friends

---

## 📝 Conclusion

Cette migration simplifie considérablement l'architecture en adoptant un modèle éprouvé (Twitter/Instagram) tout en conservant la possibilité de détecter les connexions fortes (mutuals).

**Le système est maintenant :**
- ✅ Plus simple
- ✅ Plus moderne
- ✅ Plus maintenable
- ✅ Tout aussi puissant pour l'algorithme de recommandation

**Les notifications de Follow permettent toujours aux utilisateurs d'être informés** quand quelqu'un les suit, sans la friction d'un système de demande d'ami.
