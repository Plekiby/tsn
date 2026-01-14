# TSN - Système de Recommandation pour Réseau Social

## Réalisations principales

### Implémentation complète
- **Système de scoring du feed** 
- **Algorithme FOAF** (Friends of Friends)
- **Similarité Jaccard** pour matching d'intérêts
- **Système de confidentialité** (blocage/mute avec filtrage du feed)
- **Architecture modulaire** et scalable
- **Tests unitaires** complets des algorithmes
- **Base de données** normalisée (9 tables relationnelles)

---

## Algorithmes implémentés

### 1. **Scoring Multi-Critères du Feed** (Principal)

Chaque post reçoit un score basé sur 5 dimensions indépendantes, ensuite agrégées:

```
SCORE_TOTAL = RELATION + INTÉRÊTS + FRAÎCHEUR + ENGAGEMENT + BONUS_GROUPE
```

#### Composante 1: Score de Relation
Évalue le lien entre l'auteur et le lecteur:

```javascript
Ami mutuel (follow bidirectionnel):  100 pts  [Poids: 50%]
Suivi (follow unilatéral):            50 pts  [Poids: 25%]
Public (inconnu):                     10 pts  [Poids: 25%]
```

**Justification:** La relation sociale est le facteur le plus important pour nous.
#### Composante 2: Score d'Intérêts (Similarité Jaccard)
Mesure le chevauchement d'intérêts entre utilisateurs:

```javascript
Formule: Jaccard(A, B) = |A ∩ B| / |A ∪ B|
Score = nombre_intérêts_communs × 6 pts (max 30 pts pour 5 intérêts)
```

**Exemple numérique:**
```
Utilisateur A: {gaming, musique, cinéma, tech}
Utilisateur B: {gaming, musique, sport, art}

Intersection: {gaming, musique} = 2 éléments
Union: {gaming, musique, cinéma, tech, sport, art} = 6 éléments
Jaccard = 2/6 = 33.3%
Score d'intérêts = 2 × 6 = 12 pts
```

#### Composante 3: Score de Fraîcheur
Décroissance temporelle pour valoriser le contenu récent:

```javascript
Formule: max(0, 40 - heures_écoulées)
Score max: 40 pts

Exemples:
- Post d'il y a 1 heure:    ~39 pts
- Post d'il y a 12 heures:  ~28 pts  
- Post d'il y a 2 jours:     0 pts
```

**Raisonnement:** Fonction linéaire décroissante qui rend les posts plus anciens moins pertinents sans les éliminer complètement.

#### Composante 4: Score d'Engagement 
Cumule les engagements utilisateur:

```javascript
Formule: min(12, likes) + min(12, commentaires)
Score max: 24 pts

Saturation à 12 pts/métrique pour éviter l'inflation des posts viraux
```

**Justification:** L'engagement valide la pertinence du contenu.

#### Composante 5: Bonus de Groupe
Valorise les posts d'utilisateurs du même groupe:

```javascript
Condition: L'auteur est membre d'un groupe où je suis aussi membre
Bonus: 20 pts (sinon 0)
```

**Justification:** Renforce la cohésion et pertinence intra-groupe.


### 2. **Algorithme FOAF (Friends of Friends)**

Recommande des utilisateurs potentiels :

```javascript
// Pseudo-code
FOAF(utilisateur_id):
  amis_directs = Set des utilisateurs suivis directement
  candidates = Set vide
  
  POUR chaque ami IN amis_directs:
    amis_de_ami = Set des utilisateurs suivis par ami
    POUR chaque user IN amis_de_ami:
      SI user ∉ amis_directs ET user ≠ utilisateur_id:
        candidates.ajouter(user)
  
  RETOURNER candidates TRIÉS par Jaccard(intérêts)

Complexité: O(n × m) où n=amis directs, m=moyenne amis/personne
```

**Exemple pratique:**
```
Vous suivez: Alice, Bob
Alice suit: Charlie, David, vous-même
Bob suit: Eve, David, Franck

Recommandations FOAF: {Charlie, David, Eve, Franck}
```

**Avantages:**
- Découvertes via réseau fiable (vos amis les connaissent)
- Crée des ponts entre communautés


---

### 3. **Similarité Jaccard pour Intérêts**

Utilisée à deux niveaux:

**Niveau 1:** Calcul du score d'intérêts (voir Composante 2)

**Niveau 2:** Tri des recommandations FOAF
```javascript
POUR chaque candidat FOAF:
  similarite = |intérêts_miens ∩ intérêts_candidat| / 
               |intérêts_miens ∪ intérêts_candidat|
  score_recommandation = similarite × 100
```

Permet un tri secondaire des recommandations par pertinence d'intérêts.

---

## Architecture Technique

### Stack technologique choisi
- **Backend:** Node.js + Express.js (asynchrone, scalable)
- **Base de données:** MySQL
- **Frontend:** EJS templating 
- **Real-time:** Server-Sent Events / SSE (notifications)
- **Authentification:** JWT 

### Schéma relationnel

```
User (compte + profil)
├─ Follow (relations sociales)
├─ UserBlock (blocages bidirectionnels)
├─ UserMute (mutes unidirectionnels)
├─ UserInterest (intérêts de l'utilisateur)
├─ UserPrivacy (paramètres de confidentialité)
└─ Post (contenu utilisateur)
   ├─ Like (votes positifs)
   └─ Comment (réponses)

Group (communautés)
├─ GroupMember (adhésion)
└─ Post (contenu de groupe)

Conversation (discussions privées)
└─ ConversationMember
   └─ Message (contenu textuel)

Notification (notifications temps-réel)
```


- Index sur clés étrangères et critères de recherche
- Contraintes d'intégrité (FK, UNIQUE, NOT NULL)

### Pattern architectural: Routes → Services → DB

```javascript
Route (reçoit requête HTTP)
  ↓ 
Service (logique métier + algorithmes)
  ↓ 
Database (requêtes efficaces + indexes)
  ↓ 
Response formattée (JSON ou EJS)
  ↓
View (rendu client)
```



## Fonctionnalités développées

### Système Social
- **Suivi/Followers:** Relations unidirectionnelles avec compteurs
- **Profils:** Bio, avatar, bannière, localisation, date de naissance
- **Visibilité:** 4 niveaux (PUBLIC, FOLLOWERS, FRIENDS, PRIVATE)

### Posts et Contenu
- **Posts personnels:** Avec paramétrage granulaire de visibilité
- **Posts de groupe:** Visibles uniquement aux membres
- **Likes et commentaires:** Système complet avec compteurs
- **Feed intelligent:** Tri par score décroissant avec 5 critères

### Système de Recommandations
- **Feed scoring:** 5 critères 
- **FOAF** 
- **Matching d'intérêts:** Via similarité Jaccard
- **Filtre blocage/mute:** Intégré au feed et messages

### Groupes
- **Création et gestion:** CRUD complet
- **Membership:** Invitation et rejoindre
- **Posts de groupe:** Visibilité restreinte aux membres
- **Liens d'invitation:** Partage public et rapide

### Messagerie & Notifications
- **Messages directs:** 1-1 et conversations de groupe
- **Notifications temps-réel:** Via SSE (Server-Sent Events)
- **Filtrage mute:** Notifications des utilisateurs mutés masquées
- **Compteurs:** Unread count et statut de lecture

### Système de Confidentialité
- **Blocage:** Masque tous les posts + empêche les messages bidirectionnels
- **Mute:** Masque les posts + masque les notifications (messages autorisés)
- **Intégration complète:** Filtre appliqué au feed, messages et notifications
- **Paramètres profil:** Contrôle des messages directs acceptés

---

## Tests et Validation

### Tests Unitaires Implémentés

Fichier: `backend/tests/algorithmes.test.js`

6 suites de tests couvrant 100% des algorithmes

1. **Test Score de Relation** (3 cas)
   - Ami mutuel: 100 pts 
   - Suivi: 50 pts 
   - Public: 10 pts 

2. **Test Score d'Intérêts Jaccard** (3 cas)
   - 60% similarité → 18 pts 
   - 0% similarité → 0 pts 
   - 100% similarité → 30 pts 

3. **Test Score Fraîcheur** (3 cas)
   - 1 heure: ~39 pts 
   - 12 heures: ~28 pts 
   - 48 heures: 0 pts 

4. **Test Score Engagement** (3 cas)
   - 5 likes + 3 commentaires → 8 pts 
   - 20 likes + 15 commentaires (saturé) → 24 pts 
   - 0 engagement → 0 pts 

5. **Test Score Total Composite** (3 scénarios)
   - Post idéal → 202 pts 
   - Post faible → 10 pts 
   - Post moyen → 94 pts 

6. **Test FOAF Algorithm** (logique)
   - Recommandations correctes à 2-hop 
   - Exclusion amis directs 
   - Exclusion self 

### Validation Fonctionnelle

Mode debug accessible: `GET /posts/feed?debug=1`

Affiche pour chaque post:
```json
{
  "scoreTotal": 181.00,
  "scoreRelation": 100,
  "scoreInterets": 12,
  "scoreFraicheur": 38,
  "scoreEngagement": 11,
  "bonusGroupe": 20,
  "interetsCommuns": 2
}
```

---

## Complexité Algorithmique

### Scoring du Feed

```
SCORE_FEED(utilisateur_id):
  T1 = Récupérer follows: O(F) où F = follow count
  T2 = Récupérer mutuals: O(F²) pour set intersection
  T3 = Récupérer intérêts: O(I) où I = intérêt count
  T4 = Récupérer posts visibles: O(P log P) avec SQL LIMIT + ORDER BY
  T5 = Mapper scores: O(P × S) où S = score computation (5 opérations)
  T6 = Trier posts: O(P log P)
  
  TOTAL: O(F² + P log P + P×S)
  
  Où:
  - F = nombre de follows (typiquement <1000)
  - P = nombre de posts chargés (50-80)
  - S = constante faible (5 opérations)
  
  Complexité réelle: O(P log P) car F << P
```

**Optimisations appliquées:**
- Pagination: limit 80 posts max
- Index SQL sur (authorId, visibility, createdAt)
- Caching des intérêts utilisateur en mémoire
- Early exit pour blocked users (Set intersection O(1))

### Algorithme FOAF

```
FOAF(utilisateur_id):
  T1 = Récupérer amis directs: O(F)
  T2 = Récupérer amis de chaque ami: O(F × avg_follow)
  T3 = Filtrer (exclure directs + self): O(F²) worst case
  
  TOTAL: O(F × avg_follow) 
  Pratiquement: O(F × 100) ≈ O(F) car avg_follow est constant
```

### Similarité Jaccard

```
JACCARD(set_A, set_B):
  intersection = |A ∩ B|: O(min(|A|, |B|))
  union = |A ∪ B|: O(|A| + |B|)
  
  TOTAL: O(|A| + |B|)
  Typiquement O(20) car sets d'intérêts limités à ~50 max
```


