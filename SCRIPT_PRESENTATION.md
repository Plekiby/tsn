# Script de Présentation TSN

## Réseau Social avec Système de Recommandation Intelligent

**Présentateurs :** Pierre (PC - écran projeté) & Djibril (Téléphone)

---

## Configuration Avant la Présentation

### Comptes à préparer à l'avance :

**Compte Djibril** (déjà créé avec un réseau social existant) :
- [ ] Email : `djibril@test.com` / Mot de passe : `password123`
- [ ] Profil complété (photo, bio, intérêts : Technologie, Gaming, Sport, Cuisine)
- [ ] **Djibril suit déjà 4-5 utilisateurs fictifs** :
  - `Alice` (intérêts : Technologie, Musique, Voyage)
  - `Bob` (intérêts : Sport, Gaming, Cinéma)
  - `Clara` (intérêts : Technologie, Cuisine, Lecture)
  - `David` (intérêts : Musique, Sport, Voyage)
  - `Emma` (intérêts : Gaming, Cinéma, Technologie)
- [ ] Ces utilisateurs ont des posts récents (pour que le feed soit rempli)

**Utilisateurs fictifs** (créés à l'avance) :
- [ ] Alice, Bob, Clara, David, Emma avec profils complétés
- [ ] Quelques follows entre eux (pour créer un réseau réaliste)
- [ ] Quelques posts avec des likes/commentaires

**Matériel** :
- [ ] Pierre : Navigateur ouvert sur `localhost:3000` (page login)
- [ ] Djibril : Navigateur mobile connecté à son compte
- [ ] Images prêtes pour upload (avatar, bannière, post)

---

## PARTIE 1 : Inscription et Authentification

### Étape 1.1 - Inscription de Pierre (PC)

**Pierre dit :**
> "Bonjour, je suis Pierre et je vais vous présenter notre réseau social TSN. Je commence par créer mon compte."

**Actions Pierre :**
1. Cliquer sur "S'inscrire"
2. Remplir le formulaire :
   - Email : `pierre@test.com`
   - Mot de passe : `password123`
   - Nom d'affichage : `Pierre`
3. Soumettre le formulaire

**Pierre explique :**
> "Le mot de passe est hashé avec bcrypt en 12 rounds. Un email de vérification est envoyé."

---

### Étape 1.2 - Vérification Email (PC)

**Pierre dit :**
> "Je vais vérifier mon email pour activer mon compte."

**Actions Pierre :**
1. Ouvrir la boîte mail (ou simuler en allant directement sur le lien)
2. Cliquer sur le lien de vérification
3. Montrer la redirection automatique vers le feed

**Pierre explique :**
> "Le token de vérification expire après 24h. Une fois vérifié, je suis automatiquement connecté via JWT."

---

### Étape 1.3 - Présentation de Djibril (Téléphone)

**Pierre dit :**
> "Djibril, lui, a déjà un compte avec un réseau social établi. Il va nous aider à démontrer les fonctionnalités d'interaction."

**Djibril dit :**
> "Oui, j'ai déjà mon compte avec plusieurs amis : Alice, Bob, Clara, David et Emma. On va voir comment Pierre peut découvrir ces personnes grâce à l'algorithme de recommandation."

**Djibril montre brièvement sur son téléphone :**
1. Son profil complété
2. Sa liste d'abonnements (5 personnes)

---

## PARTIE 2 : Configuration du Profil

### Étape 2.1 - Édition du Profil (PC)

**Pierre dit :**
> "Maintenant je vais personnaliser mon profil."

**Actions Pierre :**
1. Cliquer sur son profil (ou icône profil)
2. Cliquer sur "Modifier le profil"
3. Ajouter :
   - Bio : "Développeur passionné"
   - Localisation : "Paris"
   - Site web : "https://pierre.dev"
   - Photo de profil (upload une image)
   - Bannière (upload une image)
4. Sauvegarder

**Pierre explique :**
> "Les images sont uploadées via Multer avec une limite de 5MB. Les noms de fichiers sont sécurisés."

---

### Étape 2.2 - Sélection des Intérêts (PC)

**Pierre dit :**
> "Je vais maintenant sélectionner mes centres d'intérêt, c'est important pour l'algorithme de recommandation."

**Actions Pierre :**
1. Aller dans la page "Intérêts"
2. Sélectionner 4-5 intérêts (ex: Technologie, Musique, Sport, Cinéma, Voyage)
3. Montrer le toggle on/off

**Pierre explique :**
> "Ces intérêts seront utilisés pour calculer la similarité avec d'autres utilisateurs via l'algorithme de Jaccard."

---

### Étape 2.3 - Intérêts de Djibril (déjà configurés)

**Pierre dit :**
> "Djibril a déjà configuré ses intérêts : Technologie, Gaming, Sport et Cuisine. On a donc 2 intérêts en commun : Technologie et Sport. Ça va influencer le score de recommandation."

---

## PARTIE 3 : Publications et Interactions

### Étape 3.1 - Premier Post (PC)

**Pierre dit :**
> "Je vais créer ma première publication."

**Actions Pierre :**
1. Aller sur le Feed
2. Écrire un post : "Hello ! C'est mon premier post sur TSN 🎉"
3. Ajouter une image
4. Choisir la visibilité : **PUBLIC**
5. Publier

**Pierre explique :**
> "Le post peut avoir 4 niveaux de visibilité : Public, Abonnés, Amis (follows mutuels), ou Privé."

---

### Étape 3.2 - Djibril voit le post et interagit (Téléphone)

**Djibril dit :**
> "Je vois le post de Pierre dans mon feed, je vais liker et commenter."

**Actions Djibril :**
1. Rafraîchir le feed
2. Liker le post de Pierre
3. Commenter : "Bienvenue sur TSN !"

---

### Étape 3.3 - Notification en temps réel (PC)

**Pierre dit :**
> "Et là, regardez, je reçois une notification en temps réel !"

**Actions Pierre :**
1. Montrer la notification qui apparaît (badge ou popup)
2. Cliquer sur les notifications
3. Montrer le like et le commentaire de Djibril

**Pierre explique :**
> "Les notifications utilisent Server-Sent Events (SSE), pas de polling. C'est instantané et économe en ressources."

---

### Étape 3.4 - Répondre au commentaire (PC)

**Actions Pierre :**
1. Répondre au commentaire de Djibril : "Merci Djibril !"

---

## PARTIE 4 : Système de Follow et Recommandations FOAF

### Étape 4.1 - Page Recommandations AVANT de suivre Djibril (PC)

**Pierre dit :**
> "Regardons d'abord mes recommandations. Pour l'instant, je ne suis personne."

**Actions Pierre :**
1. Aller sur "Recommandations" ou "Découvrir"
2. Montrer que les recommandations sont basées uniquement sur les intérêts (fallback)

**Pierre explique :**
> "Comme je n'ai pas encore de réseau, l'algorithme me suggère des personnes basées uniquement sur nos intérêts communs."

---

### Étape 4.2 - Pierre suit Djibril (PC)

**Pierre dit :**
> "Maintenant, je vais suivre Djibril et voir comment mes recommandations changent."

**Actions Pierre :**
1. Aller sur le profil de Djibril
2. Cliquer sur "Suivre"

**Djibril :**
1. Montrer la notification de nouveau follower sur son téléphone
2. Suivre Pierre en retour (follow mutuel)

---

### Étape 4.3 - Page Recommandations APRÈS avoir suivi Djibril (PC) ⭐

**Pierre dit :**
> "Et maintenant, regardons mes recommandations !"

**Actions Pierre :**
1. Retourner sur "Recommandations"
2. **Montrer que Alice, Bob, Clara, David, Emma apparaissent maintenant !**

**Pierre explique (moment clé de la démo) :**
> "Voilà le cœur de notre algorithme FOAF - Friends of Friends !
>
> L'algorithme a détecté que Djibril suit Alice, Bob, Clara, David et Emma. Comme je suis maintenant ami avec Djibril, ces personnes me sont recommandées.
>
> Chaque recommandation est scorée selon :
> - **Connexions communes** : +10 pts par ami commun (ici Djibril)
> - **Follow mutuel** : +5 pts bonus si Djibril a un follow mutuel avec eux
> - **Intérêts communs** : +8 pts par intérêt partagé avec moi
> - **Similarité Jaccard** : jusqu'à +30 pts selon le ratio d'intérêts communs
>
> Par exemple, Alice qui a 'Technologie' en commun avec moi est mieux classée !"

---

### Étape 4.4 - Voir la liste d'amis (PC)

**Actions Pierre :**
1. Aller dans "Amis"
2. Montrer les 3 onglets : Abonnés / Abonnements / Mutuels
3. Montrer que Djibril apparaît dans "Mutuels"

**Pierre explique :**
> "On est maintenant en follow mutuel. Ça change le score de relation dans l'algorithme du feed : un follow mutuel vaut 60 points contre 30 pour un follow simple."

---

### Étape 4.5 - Découverte d'utilisateurs (PC)

**Actions Pierre :**
1. Aller sur "Tous les utilisateurs"
2. Montrer la recherche
3. Montrer le pourcentage d'intérêts en commun affiché pour chaque utilisateur
4. Montrer la pagination

---

## PARTIE 5 : Algorithme du Feed (Demo Debug)

### Étape 5.1 - Mode Debug du Feed (PC)

**Pierre dit :**
> "Je vais vous montrer comment fonctionne notre algorithme de scoring du feed."

**Actions Pierre :**
1. Aller sur le feed avec `?debug=1` dans l'URL
2. Montrer le détail des scores sur chaque post

**Pierre explique en montrant un post :**
> "Chaque post reçoit un score composite :
> - **Score Relation** : 100 pts si c'est mon post, 60 pts si follow mutuel, 30 pts si je le suis, 10 pts sinon
> - **Score Intérêts** : jusqu'à 30 pts selon les intérêts communs avec l'auteur
> - **Score Fraîcheur** : 40 pts max, -1 pt par heure (0 après 48h)
> - **Score Engagement** : likes + commentaires (max 24 pts)
> - **Bonus Groupe** : +20 pts si on est dans le même groupe"

---

## PARTIE 6 : Groupes

### Étape 6.1 - Création d'un Groupe (PC)

**Pierre dit :**
> "Je vais créer un groupe."

**Actions Pierre :**
1. Aller sur "Groupes"
2. Cliquer sur "Créer un groupe"
3. Remplir :
   - Nom : "Fans de Tech"
   - Description : "Pour les passionnés de technologie"
   - Confidentialité : **PUBLIC**
4. Créer

**Pierre explique :**
> "Il y a 3 types de groupes :
> - **Public** : tout le monde peut rejoindre
> - **Privé** : visible mais sur invitation
> - **Secret** : invisible, uniquement sur invitation"

---

### Étape 6.2 - Invitation par lien (PC)

**Pierre dit :**
> "Je vais générer un lien d'invitation pour Djibril."

**Actions Pierre :**
1. Dans le groupe, cliquer sur "Générer un lien d'invitation"
2. Copier le lien
3. L'envoyer à Djibril (ou le dicter)

---

### Étape 6.3 - Djibril rejoint via le lien (Téléphone)

**Djibril dit :**
> "Je clique sur le lien pour rejoindre le groupe."

**Actions Djibril :**
1. Ouvrir le lien d'invitation
2. Confirmer pour rejoindre
3. Montrer qu'il est maintenant membre

---

### Étape 6.4 - Notification de nouveau membre (PC)

**Pierre dit :**
> "Je reçois une notification que Djibril a rejoint mon groupe."

**Actions Pierre :**
1. Montrer la notification GROUP_JOIN
2. Voir les membres du groupe (Pierre = OWNER, Djibril = MEMBER)

---

### Étape 6.5 - Post dans le groupe (PC)

**Actions Pierre :**
1. Créer un post dans le groupe : "Bienvenue dans le groupe Tech !"
2. Publier

**Djibril :**
1. Rafraîchir et voir le post
2. Liker le post

---

### Étape 6.6 - Création d'un Événement (PC)

**Pierre dit :**
> "Je vais créer un événement dans le groupe."

**Actions Pierre :**
1. Cliquer sur "Créer un événement"
2. Remplir :
   - Titre : "Meetup Tech"
   - Date : (une date future)
   - Lieu : "Paris"
   - Description : "Rencontre entre passionnés"
3. Créer

**Pierre explique :**
> "Tous les membres du groupe reçoivent une notification pour l'événement."

---

### Étape 6.7 - RSVP de Djibril (Téléphone)

**Djibril dit :**
> "Je reçois la notification et je vais confirmer ma participation."

**Actions Djibril :**
1. Voir la notification EVENT_CREATED
2. Aller sur l'événement
3. Cliquer sur "Participer" (GOING)

**Pierre :**
1. Montrer la notification EVENT_RSVP
2. Montrer le compteur de participants

---

## PARTIE 7 : Messagerie

### Étape 7.1 - Démarrer une conversation (PC)

**Pierre dit :**
> "Je vais envoyer un message privé à Djibril."

**Actions Pierre :**
1. Aller sur le profil de Djibril
2. Cliquer sur "Envoyer un message"
3. Écrire : "Salut Djibril ! Content de te voir sur TSN"
4. Envoyer

---

### Étape 7.2 - Djibril répond (Téléphone)

**Djibril dit :**
> "Je reçois le message et je réponds."

**Actions Djibril :**
1. Voir la notification de nouveau message
2. Ouvrir la conversation
3. Répondre : "Salut Pierre ! Super appli 👍"

---

### Étape 7.3 - Conversation en temps réel (PC)

**Pierre dit :**
> "Le message arrive instantanément grâce au SSE."

**Actions Pierre :**
1. Montrer le message qui apparaît sans rafraîchir
2. Continuer la conversation brièvement

---

## PARTIE 8 : Confidentialité et Blocage

### Étape 8.1 - Paramètres de confidentialité (PC)

**Pierre dit :**
> "Je vais vous montrer les options de confidentialité."

**Actions Pierre :**
1. Aller dans les paramètres de confidentialité
2. Montrer les options :
   - Visibilité du profil (Public/Abonnés/Privé)
   - Accepter les messages (Oui/Non)
3. Changer la visibilité en "Abonnés seulement"

**Pierre explique :**
> "Si je mets mon profil en privé, seuls mes abonnés peuvent voir mes posts."

---

### Étape 8.2 - Démonstration du Mute (PC)

**Pierre dit :**
> "On peut aussi masquer un utilisateur sans le bloquer."

**Actions Pierre :**
1. Montrer l'option "Masquer" sur un utilisateur test
2. Expliquer la différence :

> "**Masquer** : je ne vois plus ses posts et notifications, mais il peut toujours m'envoyer des messages.
> **Bloquer** : tout est coupé, messages inclus, et c'est bidirectionnel."

---

### Étape 8.3 - Démonstration du Blocage (PC)

**Actions Pierre :**
1. Bloquer un utilisateur test (pas Djibril !)
2. Montrer que ses posts disparaissent du feed
3. Montrer qu'on ne peut plus lui envoyer de message
4. Débloquer l'utilisateur

---

## PARTIE 9 : Post avec Visibilité Restreinte

### Étape 9.1 - Post visible uniquement par les amis (PC)

**Pierre dit :**
> "Je vais créer un post visible uniquement par mes amis - les follows mutuels."

**Actions Pierre :**
1. Créer un post : "Ce post est réservé à mes amis !"
2. Choisir visibilité : **FRIENDS**
3. Publier

---

### Étape 9.2 - Djibril voit le post (Téléphone)

**Djibril dit :**
> "Comme je suis en follow mutuel avec Pierre, je peux voir ce post."

**Actions Djibril :**
1. Rafraîchir le feed
2. Montrer que le post apparaît

**Pierre explique :**
> "Un utilisateur qui me suit mais que je ne suis pas ne verrait pas ce post."

---

## PARTIE 10 : Récapitulatif Technique

**Pierre conclut :**

> "Pour résumer les points techniques clés de notre projet :

### Architecture
- Backend **Node.js + Express**
- Base de données **MySQL** avec requêtes préparées
- Frontend **EJS** avec templates responsives

### Algorithmes
- **Feed intelligent** : scoring multi-critères (relation, intérêts, fraîcheur, engagement, groupe)
- **Recommandations FOAF** : découverte via le graphe social avec similarité Jaccard

### Temps Réel
- **Server-Sent Events** pour les notifications instantanées

### Sécurité
- Authentification **JWT** avec cookies HttpOnly
- Hashage **bcrypt** (12 rounds)
- Vérification email obligatoire
- Validation et sanitisation des entrées

### Fonctionnalités Sociales
- Système de follow asymétrique
- Groupes avec rôles (Owner/Admin/Member)
- Messagerie privée
- Système de blocage/masquage complet

Merci pour votre attention !"

---

## Checklist Récapitulative

| # | Fonctionnalité | Pierre (PC) | Djibril (Tel) |
|---|----------------|-------------|---------------|
| 1 | Inscription | ✅ | (déjà fait) |
| 2 | Vérification email | ✅ | (déjà fait) |
| 3 | Édition profil + avatar | ✅ | (déjà fait) |
| 4 | Sélection intérêts | ✅ | (déjà fait) |
| 5 | Créer un post avec image | ✅ | |
| 6 | Liker un post | | ✅ |
| 7 | Commenter un post | ✅ | ✅ |
| 8 | Notification temps réel | ✅ | |
| 9 | Voir recommandations AVANT follow | ✅ | |
| 10 | Follow Djibril | ✅ | |
| 11 | Follow en retour (mutuel) | | ✅ |
| 12 | Voir recommandations APRÈS follow (FOAF) | ✅ | |
| 13 | Liste d'amis (mutuels) | ✅ | |
| 14 | Mode debug feed | ✅ | |
| 15 | Créer un groupe | ✅ | |
| 16 | Lien d'invitation | ✅ | |
| 17 | Rejoindre groupe via lien | | ✅ |
| 18 | Post dans groupe | ✅ | |
| 19 | Créer événement | ✅ | |
| 20 | RSVP événement | | ✅ |
| 21 | Envoyer message | ✅ | |
| 22 | Répondre message | | ✅ |
| 23 | Paramètres confidentialité | ✅ | |
| 24 | Mute/Block démo | ✅ | |
| 25 | Post visibilité FRIENDS | ✅ | ✅ (voit) |

---

## Timing Estimé

| Partie | Durée |
|--------|-------|
| 1. Inscription/Auth Pierre | 3 min |
| 2. Profil + Intérêts | 2 min |
| 3. Posts/Interactions | 3 min |
| 4. Follow + Recommandations FOAF | 4 min |
| 5. Feed Debug | 2 min |
| 6. Groupes + Événements | 4 min |
| 7. Messagerie | 2 min |
| 8. Confidentialité | 2 min |
| 9. Post restreint | 1 min |
| 10. Récap technique | 2 min |
| **TOTAL** | **~25 min** |

---

*Bonne présentation !*
