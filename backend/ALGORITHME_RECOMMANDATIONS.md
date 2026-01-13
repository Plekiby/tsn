# Algorithme de Recommandations FOAF Amélioré

## 📊 Vue d'ensemble

Ce système de recommandation utilise un algorithme **Friend-of-Friend (FOAF)** enrichi qui combine :
- **Analyse du réseau social** (mutuals, amis)
- **Correspondance d'intérêts** (avec 281+ intérêts disponibles)
- **Score de similarité Jaccard** pour une précision maximale

---

## 🎯 Algorithme de Scoring

### Formule de calcul du score

```
Score Total = Mutual Score + Interest Score + Jaccard Bonus

où :
- Mutual Score = (simples follows × 10) + (amis confirmés × 25)
- Interest Score = nombre d'intérêts communs × 3
- Jaccard Bonus = similarité Jaccard × 20
```

### Détails des composants

#### 1. **Mutual Score** (connexions sociales)
- **Connexions simples (×10 pts)** : personnes suivies par vos contacts
- **Amis confirmés (×25 pts)** : personnes qui sont amis avec vos amis (Friendship table)
- **Bonus ami** : Les amis confirmés reçoivent 2.5× plus de points que les simples follows

**Pourquoi ?** Les amis confirmés représentent des connexions plus fortes et fiables.

#### 2. **Interest Score** (passions communes)
- **×3 points par intérêt commun**
- Utilise la grande bibliothèque de 281+ intérêts
- Catégories : Sports, Musique, Tech, Cinéma, Voyage, etc.

**Pourquoi ?** Les intérêts communs sont un excellent indicateur de compatibilité sociale.

#### 3. **Jaccard Similarity Bonus** (compatibilité globale)

```
Jaccard = |Intérêts communs| / |Union des intérêts|
Bonus = Jaccard × 20 points
```

**Exemple :**
- Vous : `[Football, Programmation, Anime]` (3 intérêts)
- Candidat : `[Football, Anime, Musique, Voyage]` (4 intérêts)
- Communs : `[Football, Anime]` = 2
- Union : `[Football, Programmation, Anime, Musique, Voyage]` = 5
- Jaccard = 2/5 = 0.4
- Bonus = 0.4 × 20 = **8 points**

**Pourquoi ?** Le coefficient de Jaccard mesure la similarité relative entre deux ensembles, donnant une vue d'ensemble de la compatibilité.

---

## 🔍 Processus de l'algorithme

### Étape 1 : Collection des données
1. Récupérer tous vos follows (1-hop)
2. Récupérer vos amis confirmés (table Friendship)
3. Récupérer les follows de vos follows (2-hop) = **candidats**

### Étape 2 : Analyse des mutuals
Pour chaque candidat :
- Compter le nombre de connexions en commun
- Distinguer entre simples follows et amis confirmés
- Marquer les amis avec une étoile ⭐

### Étape 3 : Analyse des intérêts
1. Charger vos intérêts depuis la base
2. Pour chaque candidat, charger leurs intérêts
3. Calculer l'intersection (intérêts communs)
4. Calculer le coefficient de Jaccard

### Étape 4 : Calcul du score et tri
1. Appliquer la formule de scoring
2. Trier par score décroissant
3. Limiter à 20 recommandations maximum

---

## 📈 Exemples de Scoring

### Exemple 1 : Score élevé (ami d'ami + intérêts)
```
Candidat : Alice
- 2 amis en commun (×25) = 50 pts
- 1 simple follow en commun (×10) = 10 pts
- 8 intérêts communs (×3) = 24 pts
- Jaccard 0.6 (×20) = 12 pts
Total = 96 points ⭐ Recommandation TOP
```

### Exemple 2 : Score moyen (mutuals uniquement)
```
Candidat : Bob
- 3 simples follows en commun (×10) = 30 pts
- 2 intérêts communs (×3) = 6 pts
- Jaccard 0.2 (×20) = 4 pts
Total = 40 points
```

### Exemple 3 : Score faible (peu de connexions)
```
Candidat : Carol
- 1 simple follow en commun (×10) = 10 pts
- 1 intérêt commun (×3) = 3 pts
- Jaccard 0.05 (×20) = 1 pt
Total = 14 points
```

---

## 🎨 Améliorations de l'interface

### Dashboard statistiques
- **Nombre total de recommandations**
- **Personnes avec intérêts communs**
- **Personnes avec amis en commun**

### Cartes de recommandation
- **Badge de rang** : 🏆 Or, 🥈 Argent, 🥉 Bronze pour le top 3
- **Métriques visuelles** : Score, mutuals, intérêts communs
- **Bio de l'utilisateur** : description personnelle
- **Connexions en commun** : liste avec distinction ami ⭐ vs follow
- **Intérêts communs** : badges colorés (max 8 affichés + compteur)
- **Barre de compatibilité** : progression visuelle (vert > 70%, jaune > 40%, bleu sinon)

### Explications transparentes
- Encart explicatif de l'algorithme
- Formule de calcul détaillée
- Aide contextuelle pour les utilisateurs sans recommandations

---

## 🔧 Optimisations techniques

### Performance
- **Requêtes SQL optimisées** : JOINs et batch queries
- **Limite de 20 résultats** : évite la surcharge
- **Pas de N+1 queries** : toutes les données chargées en batch

### Scalabilité
```javascript
// Batch query pour les intérêts des candidats
const candInterestRows = await query(
  `SELECT ui.userId, ui.interestId, i.name
   FROM UserInterest ui
   JOIN Interest i ON ui.interestId = i.id
   WHERE ui.userId IN (${candidates.map(() => '?').join(',')})`,
  candidates
);
```

### Structure de données efficace
- **Set** pour les lookups O(1)
- **Map** pour les agrégations
- **Array methods** pour le tri final

---

## 🚀 Améliorations futures possibles

### Court terme
1. **Cache** : mettre en cache les recommandations pendant 1h
2. **Pagination** : charger plus de 20 résultats à la demande
3. **Filtres** : filtrer par catégorie d'intérêts

### Moyen terme
1. **Machine Learning** : apprendre des follows effectués
2. **Diversité** : éviter de recommander uniquement des profils similaires
3. **Activité récente** : booster les utilisateurs actifs
4. **Localisation** : favoriser les personnes proches géographiquement

### Long terme
1. **Graph Neural Networks** : pour une analyse plus profonde du réseau
2. **Collaborative filtering** : "les gens comme vous ont aussi suivi..."
3. **Analyse de contenu** : analyser les posts pour affiner les intérêts

---

## 📊 Métriques de qualité

### Indicateurs à surveiller
- **Click-through rate** : % de recommandations suivies
- **Diversité** : variance des scores
- **Couverture** : % d'utilisateurs recevant des recommandations
- **Fraîcheur** : âge moyen des recommandations

### A/B Testing potentiel
- Tester différents poids pour le scoring
- Comparer FOAF vs recommandations aléatoires
- Mesurer l'engagement utilisateur

---

## 💡 Conclusion

Cet algorithme hybride **FOAF + Intérêts + Jaccard** offre :
- ✅ **Pertinence** : recommande des personnes vraiment compatibles
- ✅ **Transparence** : l'utilisateur comprend pourquoi quelqu'un est recommandé
- ✅ **Scalabilité** : optimisé pour de grandes bases d'utilisateurs
- ✅ **Flexibilité** : facile d'ajuster les poids de scoring

L'utilisation de 281+ intérêts permet une granularité fine et des correspondances précises, tandis que la distinction entre amis confirmés et simples follows améliore la qualité des recommandations basées sur le réseau social.
