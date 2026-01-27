# TSN - Documentation Complète du Projet

## Réseau Social avec Système de Recommandation Intelligent

---

## 1. Vue d'Ensemble

**Nom du projet :** TSN (Système de Recommandation pour Réseau Social)
**Type :** Application Web Full-Stack de réseau social

### Stack Technique
| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js + Express.js |
| Frontend | EJS (Templating) |
| Base de données | MySQL (hébergée sur alwaysdata) |
| Temps réel | Server-Sent Events (SSE) |
| Authentification | JWT (JSON Web Tokens) |
| Upload fichiers | Multer |
| Emails | Nodemailer |

---

## 2. Architecture du Projet

### Structure des dossiers
```
tsn/
├── backend/
│   ├── routes/           # 15 fichiers de routes
│   ├── services/         # Logique métier (notifications, privacy, algorithmes)
│   ├── views/            # Templates EJS
│   ├── public/           # Fichiers statiques + uploads
│   ├── tests/            # Tests unitaires
│   └── app.js            # Point d'entrée
```

### Pattern architectural
```
Routes → Services → Base de données
```
- **Routes** : Gestion des endpoints HTTP
- **Services** : Logique métier isolée
- **Database** : Pool de connexions MySQL avec requêtes préparées

---

## 3. Schéma de Base de Données

### 9 Tables Principales

```
User (authentification & profil)
├── UserInterest (mapping des intérêts)
├── UserPrivacy (paramètres de confidentialité)
├── UserBlock (système de blocage)
├── UserMute (système de masquage)
├── Follow (relations unidirectionnelles)
└── Post (contenu avec images)
    ├── Like (engagement)
    └── Comment (commentaires)

Group (communautés)
├── GroupMember (adhésion & rôles)
├── GroupInvite (invitations directes)
├── GroupInviteLink (liens d'invitation partageables)
└── Post (contenu de groupe)

Conversation (messagerie directe)
├── ConversationMember (1-1 ou groupe)
└── Message (contenu des messages)

Event (événements de groupe)
└── EventAttendee (gestion RSVP)

Notification (alertes temps réel)

Interest (table de référence des intérêts)
```

---

## 4. Fonctionnalités Réalisées

### 4.1 Algorithme de Feed Intelligent

**Système de scoring multi-critères** - Chaque post reçoit un score composite basé sur 5 dimensions :

#### Dimension 1 : Score de Relation (0-100 pts)
| Relation | Points |
|----------|--------|
| Propre post | 100 pts |
| Follow mutuel (bidirectionnel) | 60 pts |
| Follow simple | 30 pts |
| Public (inconnu) | 10 pts |

#### Dimension 2 : Similarité d'Intérêts (0-30 pts)
- Utilise la **Similarité de Jaccard** : |A ∩ B| / |A ∪ B|
- Formule : intérêts_communs × 6 pts
- Maximum 30 pts (5 intérêts communs × 6)

#### Dimension 3 : Score de Fraîcheur (0-40 pts)
- Décroissance linéaire : max(0, 40 - heures_écoulées)
- Posts > 48h reçoivent 0 pts
- Promeut le contenu récent sans éliminer les anciens posts

#### Dimension 4 : Score d'Engagement (0-24 pts)
- Likes : min(12, nombre) pts
- Commentaires : min(12, nombre) pts
- La saturation empêche les posts viraux de dominer

#### Dimension 5 : Bonus Groupe (0-20 pts)
- +20 pts si l'auteur du post est dans le même groupe
- Renforce la cohésion communautaire

**Score Final :** Relation + Intérêts + Fraîcheur + Engagement + BonusGroupe

**Mode Debug :** `?debug=1` pour voir le détail des scores

---

### 4.2 Moteur de Recommandation FOAF (Friends of Friends)

**Algorithme en deux phases :**

#### Phase 1 - Découverte (Réseau FOAF)
- Récupère tous les utilisateurs que je suis (1-hop)
- Récupère tous les utilisateurs qu'ils suivent (2-hop)
- Exclut : soi-même, déjà suivi

#### Phase 2 - Scoring Multi-dimensionnel
Pour chaque candidat :
| Critère | Points |
|---------|--------|
| Connexions simples | 10 pts chaque |
| Connexions mutuelles | 15 pts chaque |
| Intérêts communs | 8 pts par intérêt |
| Bonus similarité Jaccard | 0-30 pts |

#### Phase 3 - Fallback (Nouveaux utilisateurs)
- Si pas de candidats FOAF : recommandation par intérêts
- Trouve les utilisateurs avec des intérêts communs
- Classe par pourcentage de correspondance

**Retourne :** Top 20 recommandations triées par score total

---

### 4.3 Système d'Authentification

#### Flux d'Inscription
1. Validation email (regex)
2. Hashage mot de passe (bcrypt, 12 rounds)
3. Génération token de vérification (crypto.randomBytes)
4. Envoi email de vérification (Nodemailer)
5. Utilisateur inactif jusqu'à vérification (expiration 24h)

#### Flux de Connexion
1. Validation email/mot de passe
2. Comparaison mot de passe avec bcrypt
3. Génération JWT (expiration 7 jours)
4. Stockage cookie HttpOnly, SameSite

#### Post-Vérification
- Connexion JWT automatique
- Redirection vers le feed

#### Renvoi de Token
- Génération nouveau token de vérification
- Renvoi email si le premier expire

---

### 4.4 Réseau Social

#### Système de Follow (Unidirectionnel)
- Suivre n'importe quel utilisateur (crée une notification)
- Ne plus suivre par toggle
- Voir les listes abonnés/abonnements/mutuels
- Métriques de comptage sur les profils

#### Système de Profil
- Nom d'affichage, bio, localisation, site web, date de naissance
- Images avatar & bannière (5MB max, multer)
- Compteurs : posts, abonnés, abonnements
- Paramètres de confidentialité : PUBLIC / FOLLOWERS / PRIVATE

#### Niveaux de Visibilité du Profil
| Niveau | Description |
|--------|-------------|
| PUBLIC | Tout le monde peut tout voir |
| FOLLOWERS | Seuls les abonnés voient les posts |
| PRIVATE | Profil complètement masqué |

---

### 4.5 Gestion des Posts et Contenus

#### Création de Post
- Niveaux de visibilité : PUBLIC / FOLLOWERS / FRIENDS / PRIVATE
- Upload d'image optionnel (JPEG, PNG, GIF, WebP)
- Posts dans le feed personnel
- Posts spécifiques aux groupes

#### Logique de Visibilité des Posts
| Niveau | Qui peut voir |
|--------|---------------|
| PUBLIC | Tous les utilisateurs connectés |
| FOLLOWERS | Abonnés uniquement |
| FRIENDS | Follows mutuels uniquement |
| PRIVATE | Propriétaire uniquement |
| Groupe | Membres du groupe uniquement |

#### Engagement sur les Posts
- Fonctionnalité Like/Unlike
- Système de commentaires (max 1000 caractères)
- L'auteur du commentaire peut supprimer son commentaire
- L'auteur du post peut supprimer n'importe quel commentaire (modération)
- Compteurs likes/commentaires
- Affiche les 3 derniers commentaires dans le feed

#### Gestion des Images
- Multer diskStorage avec noms de fichiers assainis
- Timestamp + nombre aléatoire + nom original
- Suppression des accents (à→a, é→e, etc.)
- Stockage dans `/public/uploads/`
- Format URL : `/uploads/[filename]`

---

### 4.6 Système de Groupes

#### Gestion des Groupes
- Création de groupes avec nom, description, niveau de confidentialité
- Niveaux de confidentialité : PUBLIC / PRIVATE / SECRET
- Le créateur devient automatiquement OWNER
- Rôles des membres : OWNER / ADMIN / MEMBER

#### Fonctionnalités des Groupes
- Voir les détails et statistiques du groupe
- Lister les membres
- Poster dans les groupes (membres uniquement)
- Créer des événements de groupe
- Voir le calendrier du groupe
- Endpoints API pour événements et stats

#### Contrôle d'Accès aux Groupes
| Type | Accès |
|------|-------|
| PUBLIC | N'importe quel utilisateur peut rejoindre |
| PRIVATE | Public mais visibilité sur invitation |
| SECRET | Sur invitation uniquement |

#### Adhésion aux Groupes
- Rejoindre les groupes PUBLIC/PRIVATE
- Recevoir des invitations (invitation directe)
- Accepter/refuser les invitations
- Partager des liens d'invitation (tokens générés)
- Quitter les groupes (les owners ne peuvent pas partir)

#### Système d'Invitation
- Invitations directes (OWNER/ADMIN uniquement)
- Liens token partageables (cryptographiquement sécurisés)
- Les deux créent des notifications
- Flux accepter/refuser avec notifications

---

### 4.7 Messagerie et Conversations

#### Messages Directs
- Conversations 1-to-1 entre utilisateurs
- Vérification si l'utilisateur accepte les DMs (paramètre de confidentialité)
- Vérification non bloqué par le destinataire
- Création de conversation à la demande

#### Gestion des Conversations
- Liste de toutes les conversations avec dernier message
- Compteur de messages non lus par conversation
- Marquage comme lu à la consultation
- Suivi du timestamp de dernière lecture

#### Fonctionnalités des Messages
- Envoi de messages texte
- Livraison temps réel via SSE
- Affichage des infos de l'expéditeur
- Historique de conversation (limite 100 messages)
- 10 derniers messages visibles dans la liste

#### Conversations de Groupe
- Conversations associées aux groupes
- Plusieurs membres
- Même interface que les DMs
- Contexte de groupe préservé

#### Intégration du Blocage
- Les utilisateurs bloqués ne peuvent pas envoyer de messages
- Impossible d'envoyer aux utilisateurs qui vous ont bloqué
- Vérification du blocage à l'envoi
- Messages empêchés avant insertion en base

---

### 4.8 Notifications (Temps Réel)

#### Types de Notifications
| Type | Description |
|------|-------------|
| LIKE | Quelqu'un a aimé votre post |
| COMMENT | Quelqu'un a commenté votre post |
| FOLLOW | Quelqu'un vous a suivi |
| GROUP_JOIN | Quelqu'un a rejoint votre groupe |
| GROUP_INVITE | Vous avez été invité à un groupe |
| EVENT_CREATED | Événement créé dans votre groupe |
| EVENT_RSVP | Quelqu'un a répondu à l'événement |

#### Livraison Temps Réel (Server-Sent Events)
- Endpoint SSE : `/events` (alternative WebSocket)
- Heartbeat toutes les 25 secondes (prévention timeout proxy)
- Clients connectés stockés en mémoire (Map<userId, Set<response>>)
- Notifications poussées immédiatement à la création
- Affiche le compteur non lu dans le payload

#### Filtrage des Notifications
- Exclut les notifications des utilisateurs masqués
- Le masquage filtre à la création (pas affiché en BDD)
- Maintient le compteur non lu excluant les utilisateurs masqués

#### Persistance des Notifications
- Stockées en base avec timestamps
- Marquées comme lues à la consultation
- Possibilité de tout marquer comme lu
- Affichage dans le centre de notifications

---

### 4.9 Confidentialité et Blocage

#### Système de Blocage
- Bloquer des utilisateurs spécifiques
- Posts bloqués masqués du feed
- Messages empêchés bidirectionnellement
- Possibilité de débloquer
- Impossible de messagser les utilisateurs bloqués

#### Système de Masquage (Mute)
- Masquer les posts d'utilisateurs spécifiques
- Masquer les notifications des utilisateurs masqués
- Messages toujours autorisés (contrairement au blocage)
- Unidirectionnel (asymétrique)
- UX différente du blocage

#### Acceptation des Messages
- Paramètre de confidentialité utilisateur : canReceiveMessages (boolean)
- Vérifié avant de démarrer une conversation
- Retourne une erreur si l'utilisateur a désactivé les DMs
- Peut être basculé dans les paramètres de confidentialité

#### Confidentialité du Profil
- profileVisibility : PUBLIC / FOLLOWERS / PRIVATE
- Restreint la visualisation des posts du profil
- Affiche un message "restreint" si accès refusé
- Les propriétaires voient toujours leur propre profil

---

### 4.10 Intérêts et Correspondance

#### Gestion des Intérêts
- Liste globale d'intérêts (table de référence)
- Les utilisateurs peuvent sélectionner plusieurs intérêts
- Toggle on/off (ajout/suppression de UserInterest)
- Page de visualisation de tous les intérêts

#### Fonctionnalités Basées sur les Intérêts
- Utilisés dans l'algorithme de recommandation
- Affichés sur les profils
- Utilisés dans le scoring FOAF (8 pts par intérêt commun)
- Calcul de similarité Jaccard
- Pourcentage d'intérêts dans la liste /users/all

#### Affichage des Intérêts Communs
- Montre les intérêts partagés entre utilisateurs
- Calcule le pourcentage d'intersection
- Affichage dans les recommandations
- Affichage dans la liste de tous les utilisateurs

---

### 4.11 Découverte d'Utilisateurs

#### Liste de Tous les Utilisateurs
- Liste paginée (30 utilisateurs par page)
- Recherche par displayName, bio, ou email
- Montre les intérêts communs
- Montre le statut de relation follow (following/followers/mutual)
- Pourcentage de correspondance d'intérêts
- Comparaison totale des intérêts

#### Page de Recommandations
- Recommandations FOAF (jusqu'à 20)
- Recommandations basées sur les intérêts (fallback)
- Montre les chemins de connexion (indicateurs follow mutuel)
- Montre les noms d'amis communs
- Montre le score de similarité Jaccard
- Montre le détail des scores

---

### 4.12 Événements (dans les Groupes)

#### Gestion des Événements
- Créer des événements dans les groupes (membres uniquement)
- Obligatoire : titre, date de début
- Optionnel : lieu, description, date de fin
- Notifications automatiques à tous les membres

#### Fonctionnalités des Événements
- Vue calendrier dans le groupe
- Lister les événements à venir
- Lister tous les événements
- Système RSVP (GOING/DECLINED)
- Suivi du compteur de participants
- Notifications quand RSVP reçu

#### Endpoints API
- `/groups/:id/api/events` (JSON)
- `/groups/:id/api/stats` (compteurs membres/événements)

---

## 5. Architecture Frontend (Vues EJS)

### Hiérarchie des Vues
```
layouts/
├── base.ejs (wrapper principal)
└── header/footer partials

auth/
├── login.ejs
├── register.ejs
└── email-verification.ejs

feed/
├── index.ejs (feed principal avec option debug scoring)

users/
├── profile.ejs (vue profil public)
├── profile-edit.ejs (formulaire d'édition)
├── recommendations.ejs (FOAF + intérêts)
├── all.ejs (découverte utilisateurs avec pagination)

friends/
├── index.ejs (onglets abonnés/abonnements/mutuels)

messages/
├── index.ejs (liste conversations)
└── conversation.ejs (conversation unique)

notifications/
├── index.ejs (notifications + invitations groupe)

groups/
├── index.ejs (liste groupes + mes adhésions)
└── show.ejs (détail groupe avec posts/événements)

interests/
├── index.ejs (sélection d'intérêts)

errors/
├── 404.ejs
└── 500.ejs
```

---

## 6. Sécurité

### Authentification
- JWT avec cookies httpOnly
- Vérification email avant activation du compte
- Hashage mot de passe avec bcrypt (12 rounds)
- Expiration des tokens (7 jours)

### Autorisation
- Middleware `exigerAuthentification` sur toutes les routes protégées
- Vérification JWT à chaque requête
- Accès basé sur les rôles (OWNER/ADMIN pour gestion de groupe)

### Validation des Données
- Validation email par regex
- Mot de passe minimum 6 caractères
- Nom d'affichage minimum 2 caractères
- Vérifications Number.isFinite() sur les IDs
- Requêtes préparées pour prévention injection SQL

### Sécurité Upload Fichiers
- Whitelist types d'images (JPEG, PNG, GIF, WebP)
- Limite taille fichier (5MB)
- Assainissement noms de fichiers (suppression caractères spéciaux)
- Stockage hors référence racine web

### Confidentialité
- Niveaux de visibilité des posts appliqués
- Système blocage/masquage fonctionnel
- Paramètres de confidentialité profil respectés
- Préférences d'acceptation des messages
- Exigences d'adhésion aux groupes

---

## 7. Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/auth/login` | Formulaire connexion |
| POST | `/auth/login` | Soumettre connexion |
| GET | `/auth/register` | Formulaire inscription |
| POST | `/auth/register` | Soumettre inscription |
| GET | `/auth/verification-email` | Page vérification |
| GET | `/auth/verifier-email/:token` | Vérifier email |
| POST | `/auth/renvoyer-email` | Renvoyer vérification |
| POST | `/auth/logout` | Déconnexion |
| GET | `/posts/feed` | Feed principal (avec scoring) |
| POST | `/posts` | Créer post |
| POST | `/posts/:id/like` | Liker post |
| POST | `/posts/:id/comments` | Commenter post |
| POST | `/comments/:id/delete` | Supprimer commentaire |
| GET | `/users/recommendations` | Recommandations FOAF |
| POST | `/users/:id/follow` | Suivre/ne plus suivre |
| GET | `/users/all` | Découverte utilisateurs |
| GET | `/friends` | Listes d'amis |
| POST | `/messages/start/:userId` | Démarrer conversation |
| GET | `/messages` | Liste conversations |
| GET | `/messages/:id` | Voir conversation |
| POST | `/messages/:id/send` | Envoyer message |
| GET | `/notifications` | Centre notifications |
| POST | `/notifications/read-all` | Tout marquer lu |
| GET | `/events` | Connexion SSE |
| POST | `/:id/rsvp` | RSVP événement |
| GET | `/groups` | Liste groupes |
| POST | `/groups` | Créer groupe |
| GET | `/groups/:id` | Voir groupe |
| POST | `/groups/:id/join` | Rejoindre groupe |
| POST | `/groups/:id/leave` | Quitter groupe |
| POST | `/groups/:id/posts` | Poster dans groupe |
| POST | `/groups/:id/events` | Créer événement |
| POST | `/groups/:id/invite/:userId` | Inviter utilisateur |
| POST | `/groups/:id/invite-link` | Générer lien invitation |
| GET | `/groups/invite/accept` | Accepter lien invitation |
| POST | `/groups/invites/:id/accept` | Accepter invitation directe |
| POST | `/groups/invites/:id/refuse` | Refuser invitation |
| GET | `/interests` | Gérer intérêts |
| POST | `/interests/:id/toggle` | Basculer intérêt |
| GET | `/profiles/:id` | Voir profil |
| GET | `/profiles/:id/edit` | Formulaire édition profil |
| POST | `/profiles/:id/edit` | Sauvegarder profil |
| POST | `/privacy/block/:id` | Bloquer utilisateur |
| POST | `/privacy/unblock/:id` | Débloquer utilisateur |
| POST | `/privacy/mute/:id` | Masquer utilisateur |
| POST | `/privacy/unmute/:id` | Démasquer utilisateur |
| POST | `/privacy/profile-settings` | Mettre à jour paramètres confidentialité |

---

## 8. Optimisations de Performance

### Base de Données
- Pool de connexions (MySQL pool, limite 10)
- Requêtes préparées (prévention injection SQL)
- Requêtes par lots pour réduire N+1
- Index sur clés étrangères et colonnes de recherche

### Chargement du Feed
- LIMIT 80 posts, slice top 50
- Complexité O(P log P) avec tri
- Intersection d'ensembles pour filtrage mute/block
- Récupération par lots des intérêts auteurs

### Calculs de Recommandation
- Requêtes FOAF par lots
- Mise en cache des intérêts utilisateurs en mémoire
- Sortie anticipée pour utilisateurs bloqués

### Temps Réel
- SSE avec heartbeat (prévient timeout)
- Registre clients en mémoire
- Pas d'écritures base pour notifications transitoires

---

## 9. Tests

### Suite de Tests : `backend/tests/algorithmes.test.js`

6 suites de tests couvrant :
1. Score de relation (3 cas : mutual/follow/public)
2. Jaccard intérêts (3 cas : similarité 60%/0%/100%)
3. Fraîcheur (3 cas : 1h/12h/48h)
4. Saturation engagement (3 cas : léger/lourd/aucun)
5. Scoring composite (3 scénarios : idéal/faible/moyen)
6. Algorithme FOAF (tests logiques)

### Mode Debug
Le feed supporte `?debug=1` pour afficher le détail des scores :
```json
{
  "scoreTotal": 181.00,
  "scoreRelation": 100,
  "scoreInterets": 12,
  "scoreFraicheur": 38,
  "scoreEngagement": 11,
  "bonusGroupe": 20
}
```

---

## 10. Analyse de Complexité

| Algorithme | Complexité | Notes |
|------------|------------|-------|
| Scoring Feed | O(P log P) | P = posts (fixé à 80) |
| Recommandation FOAF | O(F × avg_follow) | F = nombre de follows |
| Similarité Jaccard | O(\|A\| + \|B\|) | Ensembles d'intérêts limités à ~50 |

---

## 11. Configuration de Déploiement

### Base de Données
- Host : `mysql-cltsn.alwaysdata.net`
- Database : `cltsn_db`
- User : `cltsn`

### Environnement
- Node v18+
- Express 5.x
- MySQL 8.x
- Port : 3000 (par défaut, configurable via variable d'environnement PORT)

### Dépendances
| Package | Usage |
|---------|-------|
| bcrypt | Hashage mot de passe |
| jsonwebtoken | JWT |
| mysql2 | Base de données |
| multer | Upload fichiers |
| ejs | Templating |
| express | Framework |
| nodemailer | Email |

---

## 12. Points Forts du Projet

1. **Classement de Contenu Intelligent** - Algorithme de scoring à 5 dimensions équilibrant signaux sociaux, intérêts, récence et engagement

2. **Recommandations FOAF** - Découverte intelligente via graphe de réseau avec similarité Jaccard

3. **Contrôle de Confidentialité Complet** - Systèmes de blocage, masquage et niveaux de visibilité granulaires

4. **Notifications Temps Réel** - Mises à jour instantanées basées sur SSE sans polling

5. **Contenu Riche** - Support d'images pour posts, avatars et bannières

6. **Fonctionnalités Communautaires** - Groupes, événements et messagerie de groupe

7. **Correspondance par Intérêts** - Recommandations pilotées par algorithme basées sur le chevauchement d'intérêts

---

## 13. Historique des Commits Récents

| Commit | Description |
|--------|-------------|
| 6c67343 | supp |
| 362012a | last |
| 72418be | add |
| b9706c6 | inscription |
| fd47606 | responsive notif |

---

*Document généré le 19 janvier 2026*
