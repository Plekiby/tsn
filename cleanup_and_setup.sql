-- ==============================================
-- NETTOYAGE COMPLET ET PRÉPARATION SOUTENANCE
-- ==============================================
-- Exécuter ce script dans phpMyAdmin
-- ==============================================

-- Désactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer toutes les données des tables
DELETE FROM `EventAttendee`;
DELETE FROM `Event`;
DELETE FROM `GroupInviteLink`;
DELETE FROM `GroupInvite`;
DELETE FROM `GroupMember`;
DELETE FROM `Group`;
DELETE FROM `Message`;
DELETE FROM `ConversationMember`;
DELETE FROM `Conversation`;
DELETE FROM `Notification`;
DELETE FROM `Like`;
DELETE FROM `Comment`;
DELETE FROM `Post`;
DELETE FROM `Follow`;
DELETE FROM `FriendRequest`;
DELETE FROM `Friendship`;
DELETE FROM `UserInterest`;
DELETE FROM `UserPrivacy`;
DELETE FROM `UserBlock`;
DELETE FROM `UserMute`;
DELETE FROM `User`;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================
-- CRÉATION DES UTILISATEURS POUR LA SOUTENANCE
-- ==============================================
-- Mot de passe pour tous : test
-- Hash bcrypt récupéré d'un compte existant qui fonctionnait

-- Djibril (compte principal avec réseau social existant)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(1, 'djibril@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Djibril', NOW() - INTERVAL 7 DAY, NULL, 'Passionné de tech et de gaming', 'Paris', 1);

-- Alice (amie de Djibril - intérêts : Technologie, Musique, Voyage)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(2, 'alice@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Alice', NOW() - INTERVAL 10 DAY, NULL, 'Développeuse web et mélomane', 'Lyon', 1);

-- Bob (ami de Djibril - intérêts : Sport, Gaming, Cinéma)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(3, 'bob@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Bob', NOW() - INTERVAL 10 DAY, NULL, 'Gamer et sportif', 'Marseille', 1);

-- Clara (amie de Djibril - intérêts : Technologie, Cuisine, Lecture)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(4, 'clara@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Clara', NOW() - INTERVAL 10 DAY, NULL, 'Tech enthusiast et bookworm', 'Bordeaux', 1);

-- David (ami de Djibril - intérêts : Musique, Sport, Voyage)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(5, 'david@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'David', NOW() - INTERVAL 10 DAY, NULL, 'Musicien et voyageur', 'Toulouse', 1);

-- Emma (amie de Djibril - intérêts : Gaming, Cinéma, Technologie)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(6, 'emma@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Emma', NOW() - INTERVAL 10 DAY, NULL, 'Gameuse et cinéphile', 'Nantes', 1);

-- ==============================================
-- UTILISATEURS SUPPLÉMENTAIRES
-- ==============================================
-- Frank (intérêts : Sport, Cuisine, Voyage)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(7, 'frank@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Frank', NOW() - INTERVAL 12 DAY, NULL, 'Chef amateur et globe-trotter', 'Nice', 1);

-- Grace (intérêts : Lecture, Musique, Cinéma)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(8, 'grace@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Grace', NOW() - INTERVAL 12 DAY, NULL, 'Lectrice passionnée et mélomane', 'Lille', 1);

-- Hugo (intérêts : Gaming, Sport, Technologie)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(9, 'hugo@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Hugo', NOW() - INTERVAL 12 DAY, NULL, 'Développeur et esport fan', 'Strasbourg', 1);

-- Iris (intérêts : Voyage, Cuisine, Musique)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(10, 'iris@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Iris', NOW() - INTERVAL 12 DAY, NULL, 'Blogueuse voyage et foodie', 'Montpellier', 1);

-- Jules (intérêts : Technologie, Lecture, Sport)
INSERT INTO `User` (`id`, `email`, `passwordHash`, `displayName`, `createdAt`, `avatar`, `bio`, `location`, `isEmailVerified`) VALUES
(11, 'jules@test.com', '$2b$12$D/O7dgMH/5euazWA4dvOJeVlX3TYvnuzRmA16emPYEV5Bf04vkij2', 'Jules', NOW() - INTERVAL 12 DAY, NULL, 'Ingénieur et runner', 'Rennes', 1);

-- ==============================================
-- CONFIGURATION DES INTÉRÊTS
-- ==============================================
-- Les intérêts existants dans la table Interest :
-- 6 = tech
-- 7 = music
-- 11 = travel
-- 1 = football (Sport)
-- 124 = Jeux vidéo (Gaming)
-- 69 = Films (Cinéma)
-- 170 = Cuisine
-- 196 = Lecture

-- Intérêts de Djibril : Technologie (6), Gaming (124), Sport/Football (1), Cuisine (170)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(1, 6),   -- tech
(1, 124), -- Jeux vidéo
(1, 1),   -- football
(1, 170); -- Cuisine

-- Intérêts d'Alice : Technologie (6), Musique (7), Voyage (11)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(2, 6),   -- tech
(2, 7),   -- music
(2, 11);  -- travel

-- Intérêts de Bob : Sport (1), Gaming (124), Cinéma (69)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(3, 1),   -- football
(3, 124), -- Jeux vidéo
(3, 69);  -- Films

-- Intérêts de Clara : Technologie (6), Cuisine (170), Lecture (196)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(4, 6),   -- tech
(4, 170), -- Cuisine
(4, 196); -- Lecture

-- Intérêts de David : Musique (7), Sport (1), Voyage (11)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(5, 7),   -- music
(5, 1),   -- football
(5, 11);  -- travel

-- Intérêts d'Emma : Gaming (124), Cinéma (69), Technologie (6)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(6, 124), -- Jeux vidéo
(6, 69),  -- Films
(6, 6);   -- tech

-- Intérêts de Frank : Sport (1), Cuisine (170), Voyage (11)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(7, 1),   -- football
(7, 170), -- Cuisine
(7, 11);  -- travel

-- Intérêts de Grace : Lecture (196), Musique (7), Cinéma (69)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(8, 196), -- Lecture
(8, 7),   -- music
(8, 69);  -- Films

-- Intérêts de Hugo : Gaming (124), Sport (1), Technologie (6)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(9, 124), -- Jeux vidéo
(9, 1),   -- football
(9, 6);   -- tech

-- Intérêts d'Iris : Voyage (11), Cuisine (170), Musique (7)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(10, 11),  -- travel
(10, 170), -- Cuisine
(10, 7);   -- music

-- Intérêts de Jules : Technologie (6), Lecture (196), Sport (1)
INSERT INTO `UserInterest` (`userId`, `interestId`) VALUES
(11, 6),   -- tech
(11, 196), -- Lecture
(11, 1);   -- football

-- ==============================================
-- DJIBRIL SUIT LES 5 UTILISATEURS
-- ==============================================
INSERT INTO `Follow` (`followerId`, `followedId`, `createdAt`) VALUES
(1, 2, NOW() - INTERVAL 5 DAY),  -- Djibril suit Alice
(1, 3, NOW() - INTERVAL 5 DAY),  -- Djibril suit Bob
(1, 4, NOW() - INTERVAL 5 DAY),  -- Djibril suit Clara
(1, 5, NOW() - INTERVAL 5 DAY),  -- Djibril suit David
(1, 6, NOW() - INTERVAL 5 DAY);  -- Djibril suit Emma

-- Les 5 suivent Djibril en retour (follow mutuel)
INSERT INTO `Follow` (`followerId`, `followedId`, `createdAt`) VALUES
(2, 1, NOW() - INTERVAL 4 DAY),  -- Alice suit Djibril
(3, 1, NOW() - INTERVAL 4 DAY),  -- Bob suit Djibril
(4, 1, NOW() - INTERVAL 4 DAY),  -- Clara suit Djibril
(5, 1, NOW() - INTERVAL 4 DAY),  -- David suit Djibril
(6, 1, NOW() - INTERVAL 4 DAY);  -- Emma suit Djibril

-- ==============================================
-- QUELQUES FOLLOWS ENTRE LES AMIS (réseau réaliste)
-- ==============================================
INSERT INTO `Follow` (`followerId`, `followedId`, `createdAt`) VALUES
(2, 4, NOW() - INTERVAL 6 DAY),  -- Alice suit Clara (tech en commun)
(4, 2, NOW() - INTERVAL 6 DAY),  -- Clara suit Alice
(3, 6, NOW() - INTERVAL 6 DAY),  -- Bob suit Emma (gaming en commun)
(6, 3, NOW() - INTERVAL 6 DAY),  -- Emma suit Bob
(5, 2, NOW() - INTERVAL 6 DAY),  -- David suit Alice (voyage en commun)
(2, 5, NOW() - INTERVAL 6 DAY),  -- Alice suit David
-- Follows des nouveaux utilisateurs
(7, 5, NOW() - INTERVAL 8 DAY),  -- Frank suit David (voyage)
(5, 7, NOW() - INTERVAL 8 DAY),  -- David suit Frank
(7, 10, NOW() - INTERVAL 8 DAY), -- Frank suit Iris (cuisine+voyage)
(10, 7, NOW() - INTERVAL 8 DAY), -- Iris suit Frank
(8, 4, NOW() - INTERVAL 8 DAY),  -- Grace suit Clara (lecture)
(4, 8, NOW() - INTERVAL 8 DAY),  -- Clara suit Grace
(9, 3, NOW() - INTERVAL 8 DAY),  -- Hugo suit Bob (gaming)
(3, 9, NOW() - INTERVAL 8 DAY),  -- Bob suit Hugo
(9, 6, NOW() - INTERVAL 8 DAY),  -- Hugo suit Emma (gaming)
(6, 9, NOW() - INTERVAL 8 DAY),  -- Emma suit Hugo
(10, 5, NOW() - INTERVAL 8 DAY), -- Iris suit David (voyage)
(11, 2, NOW() - INTERVAL 8 DAY), -- Jules suit Alice (tech)
(2, 11, NOW() - INTERVAL 8 DAY), -- Alice suit Jules
(11, 9, NOW() - INTERVAL 8 DAY), -- Jules suit Hugo (tech)
(9, 11, NOW() - INTERVAL 8 DAY); -- Hugo suit Jules

-- ==============================================
-- POSTS DES UTILISATEURS (pour remplir le feed)
-- ==============================================
INSERT INTO `Post` (`id`, `content`, `createdAt`, `authorId`, `visibility`) VALUES
(1, 'Hello tout le monde ! Ravi de rejoindre TSN 🎉', NOW() - INTERVAL 3 DAY, 1, 'PUBLIC'),
(2, 'Nouveau projet tech en cours... stay tuned !', NOW() - INTERVAL 2 DAY, 2, 'PUBLIC'),
(3, 'Match de foot ce weekend, qui est chaud ? ⚽', NOW() - INTERVAL 2 DAY, 3, 'PUBLIC'),
(4, 'Je viens de finir un super livre sur le clean code 📚', NOW() - INTERVAL 2 DAY, 4, 'PUBLIC'),
(5, 'Road trip prévu pour cet été ! Des recommandations ? 🚗', NOW() - INTERVAL 1 DAY, 5, 'PUBLIC'),
(6, 'Qui a testé le nouveau jeu qui vient de sortir ? 🎮', NOW() - INTERVAL 1 DAY, 6, 'PUBLIC'),
(7, 'Session gaming ce soir, venez !', NOW() - INTERVAL 12 HOUR, 1, 'PUBLIC'),
(8, 'La tech évolue tellement vite, c''est passionnant !', NOW() - INTERVAL 6 HOUR, 4, 'PUBLIC'),
-- Posts des nouveaux utilisateurs
(9, 'Recette du jour : risotto aux champignons 🍄', NOW() - INTERVAL 2 DAY, 7, 'PUBLIC'),
(10, 'Je viens de terminer "Atomic Habits", je recommande !', NOW() - INTERVAL 2 DAY, 8, 'PUBLIC'),
(11, 'GG à tous pour le tournoi esport hier soir 🏆', NOW() - INTERVAL 1 DAY, 9, 'PUBLIC'),
(12, 'Photos de mon voyage au Japon à venir... 🇯🇵', NOW() - INTERVAL 1 DAY, 10, 'PUBLIC'),
(13, 'Nouveau framework JS à tester, qui me suit ?', NOW() - INTERVAL 10 HOUR, 11, 'PUBLIC'),
(14, 'Petit run matinal de 10km ✅', NOW() - INTERVAL 8 HOUR, 7, 'PUBLIC'),
(15, 'Live Twitch ce soir à 21h !', NOW() - INTERVAL 4 HOUR, 9, 'PUBLIC');

-- ==============================================
-- GROUPES
-- ==============================================
-- Groupe Tech (public) créé par Alice
INSERT INTO `Group` (`id`, `name`, `description`, `createdAt`, `ownerId`, `privacy`) VALUES
(1, 'Tech Enthusiasts', 'Groupe pour les passionnés de technologie et de développement', NOW() - INTERVAL 8 DAY, 2, 'PUBLIC');

-- Groupe Gaming (public) créé par Bob
INSERT INTO `Group` (`id`, `name`, `description`, `createdAt`, `ownerId`, `privacy`) VALUES
(2, 'Gamers United', 'Pour les gamers de tous horizons !', NOW() - INTERVAL 7 DAY, 3, 'PUBLIC');

-- Groupe Voyages (privé) créé par David
INSERT INTO `Group` (`id`, `name`, `description`, `createdAt`, `ownerId`, `privacy`) VALUES
(3, 'Globe Trotters', 'Partagez vos aventures et découvertes', NOW() - INTERVAL 6 DAY, 5, 'PRIVATE');

-- Groupe Cuisine (public) créé par Clara
INSERT INTO `Group` (`id`, `name`, `description`, `createdAt`, `ownerId`, `privacy`) VALUES
(4, 'Foodies Club', 'Recettes, restaurants et bons plans food', NOW() - INTERVAL 5 DAY, 4, 'PUBLIC');

-- ==============================================
-- MEMBRES DES GROUPES
-- ==============================================
-- Tech Enthusiasts (Alice owner + Djibril, Clara, Emma, Hugo, Jules)
INSERT INTO `GroupMember` (`groupId`, `userId`, `role`, `joinedAt`) VALUES
(1, 2, 'OWNER', NOW() - INTERVAL 8 DAY),
(1, 1, 'MEMBER', NOW() - INTERVAL 7 DAY),
(1, 4, 'MEMBER', NOW() - INTERVAL 7 DAY),
(1, 6, 'MEMBER', NOW() - INTERVAL 6 DAY),
(1, 9, 'MEMBER', NOW() - INTERVAL 5 DAY),
(1, 11, 'MEMBER', NOW() - INTERVAL 4 DAY);

-- Gamers United (Bob owner + Djibril, Emma, Hugo)
INSERT INTO `GroupMember` (`groupId`, `userId`, `role`, `joinedAt`) VALUES
(2, 3, 'OWNER', NOW() - INTERVAL 7 DAY),
(2, 1, 'MEMBER', NOW() - INTERVAL 6 DAY),
(2, 6, 'MEMBER', NOW() - INTERVAL 6 DAY),
(2, 9, 'MEMBER', NOW() - INTERVAL 5 DAY);

-- Globe Trotters (David owner + Alice, Frank, Iris)
INSERT INTO `GroupMember` (`groupId`, `userId`, `role`, `joinedAt`) VALUES
(3, 5, 'OWNER', NOW() - INTERVAL 6 DAY),
(3, 2, 'MEMBER', NOW() - INTERVAL 5 DAY),
(3, 7, 'MEMBER', NOW() - INTERVAL 4 DAY),
(3, 10, 'MEMBER', NOW() - INTERVAL 3 DAY);

-- Foodies Club (Clara owner + Djibril, Frank, Iris)
INSERT INTO `GroupMember` (`groupId`, `userId`, `role`, `joinedAt`) VALUES
(4, 4, 'OWNER', NOW() - INTERVAL 5 DAY),
(4, 1, 'MEMBER', NOW() - INTERVAL 4 DAY),
(4, 7, 'MEMBER', NOW() - INTERVAL 3 DAY),
(4, 10, 'MEMBER', NOW() - INTERVAL 2 DAY);

-- ==============================================
-- POSTS DANS LES GROUPES
-- ==============================================
INSERT INTO `Post` (`id`, `content`, `createdAt`, `authorId`, `visibility`, `groupId`) VALUES
(16, 'Bienvenue dans le groupe Tech ! Présentez-vous 👋', NOW() - INTERVAL 7 DAY, 2, 'PUBLIC', 1),
(17, 'Quelqu''un a essayé les nouveaux modèles d''IA ?', NOW() - INTERVAL 3 DAY, 4, 'PUBLIC', 1),
(18, 'Tournoi FIFA ce samedi, inscrivez-vous !', NOW() - INTERVAL 5 DAY, 3, 'PUBLIC', 2),
(19, 'Meilleur jeu de 2025 selon vous ?', NOW() - INTERVAL 2 DAY, 6, 'PUBLIC', 2),
(20, 'Mes meilleures adresses à Lisbonne 🇵🇹', NOW() - INTERVAL 4 DAY, 5, 'PUBLIC', 3),
(21, 'Recette de ma grand-mère : tarte tatin 🍎', NOW() - INTERVAL 3 DAY, 4, 'PUBLIC', 4);

-- ==============================================
-- QUELQUES LIKES ET COMMENTAIRES
-- ==============================================
INSERT INTO `Like` (`userId`, `postId`, `createdAt`) VALUES
(1, 2, NOW() - INTERVAL 2 DAY),  -- Djibril like le post d'Alice
(1, 3, NOW() - INTERVAL 2 DAY),  -- Djibril like le post de Bob
(2, 1, NOW() - INTERVAL 3 DAY),  -- Alice like le post de Djibril
(3, 1, NOW() - INTERVAL 3 DAY),  -- Bob like le post de Djibril
(4, 1, NOW() - INTERVAL 3 DAY),  -- Clara like le post de Djibril
(6, 7, NOW() - INTERVAL 12 HOUR), -- Emma like le post gaming de Djibril
(3, 6, NOW() - INTERVAL 1 DAY),   -- Bob like le post gaming d'Emma
-- Likes supplémentaires
(9, 11, NOW() - INTERVAL 1 DAY),  -- Hugo like son propre post tournoi (wait, c'est lui)
(1, 11, NOW() - INTERVAL 1 DAY),  -- Djibril like le post d'Hugo
(6, 11, NOW() - INTERVAL 1 DAY),  -- Emma like le post d'Hugo
(3, 11, NOW() - INTERVAL 1 DAY),  -- Bob like le post d'Hugo
(7, 9, NOW() - INTERVAL 2 DAY),   -- Frank like le post de recette de lui-même ? non c'est son post
(4, 9, NOW() - INTERVAL 2 DAY),   -- Clara like la recette de Frank
(10, 9, NOW() - INTERVAL 2 DAY),  -- Iris like la recette de Frank
(1, 9, NOW() - INTERVAL 2 DAY),   -- Djibril like la recette de Frank
(5, 12, NOW() - INTERVAL 1 DAY),  -- David like le post Japon d'Iris
(2, 12, NOW() - INTERVAL 1 DAY),  -- Alice like le post Japon d'Iris
(11, 13, NOW() - INTERVAL 10 HOUR), -- Jules like son propre post? non
(2, 13, NOW() - INTERVAL 10 HOUR),  -- Alice like le post JS de Jules
(9, 13, NOW() - INTERVAL 10 HOUR),  -- Hugo like le post JS de Jules
(4, 17, NOW() - INTERVAL 3 DAY),    -- Clara like le post IA (groupe Tech)
(1, 17, NOW() - INTERVAL 3 DAY),    -- Djibril like le post IA
(6, 18, NOW() - INTERVAL 5 DAY),    -- Emma like le tournoi FIFA
(9, 18, NOW() - INTERVAL 5 DAY),    -- Hugo like le tournoi FIFA
(1, 18, NOW() - INTERVAL 5 DAY);    -- Djibril like le tournoi FIFA

INSERT INTO `Comment` (`id`, `content`, `postId`, `userId`, `createdAt`, `updatedAt`) VALUES
(1, 'Bienvenue parmi nous !', 1, 2, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
(2, 'Je suis dispo samedi !', 3, 1, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(3, 'Trop hâte de voir ça !', 2, 4, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(4, 'Je recommande la Bretagne !', 5, 2, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(5, 'Count me in ! 🎮', 7, 6, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 12 HOUR),
-- Commentaires supplémentaires
(6, 'Ça a l''air délicieux !', 9, 4, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(7, 'Tu peux partager la recette complète ?', 9, 10, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
(8, 'GG les gars !', 11, 3, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(9, 'C''était intense !', 11, 6, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(10, 'Trop hâte de voir les photos !', 12, 5, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(11, 'Le Japon c''est sur ma bucket list', 12, 7, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY),
(12, 'Lequel ? React ? Vue ?', 13, 2, NOW() - INTERVAL 10 HOUR, NOW() - INTERVAL 10 HOUR),
(13, 'Je suis partant !', 18, 9, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(14, 'Moi aussi !', 18, 6, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY),
(15, 'Je teste Claude, c''est incroyable', 17, 11, NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY);

-- ==============================================
-- RÉINITIALISER LES AUTO_INCREMENT
-- ==============================================
ALTER TABLE `User` AUTO_INCREMENT = 12;
ALTER TABLE `Post` AUTO_INCREMENT = 22;
ALTER TABLE `Comment` AUTO_INCREMENT = 16;
ALTER TABLE `Group` AUTO_INCREMENT = 5;

-- ==============================================
-- FIN DU SCRIPT
-- ==============================================
--
-- Résumé des comptes créés :
--
-- | ID | Nom     | Email             | Mot de passe | Intérêts                    |
-- |----|---------|-------------------|--------------|------------------------------|
-- | 1  | Djibril | djibril@test.com  | (voir hash)  | Tech, Gaming, Sport, Cuisine |
-- | 2  | Alice   | alice@test.com    | (voir hash)  | Tech, Musique, Voyage        |
-- | 3  | Bob     | bob@test.com      | (voir hash)  | Sport, Gaming, Cinéma        |
-- | 4  | Clara   | clara@test.com    | (voir hash)  | Tech, Cuisine, Lecture       |
-- | 5  | David   | david@test.com    | (voir hash)  | Musique, Sport, Voyage       |
-- | 6  | Emma    | emma@test.com     | (voir hash)  | Gaming, Cinéma, Tech         |
-- | 7  | Frank   | frank@test.com    | (voir hash)  | Sport, Cuisine, Voyage       |
-- | 8  | Grace   | grace@test.com    | (voir hash)  | Lecture, Musique, Cinéma     |
-- | 9  | Hugo    | hugo@test.com     | (voir hash)  | Gaming, Sport, Tech          |
-- | 10 | Iris    | iris@test.com     | (voir hash)  | Voyage, Cuisine, Musique     |
-- | 11 | Jules   | jules@test.com    | (voir hash)  | Tech, Lecture, Sport         |
--
-- Groupes créés :
-- | ID | Nom              | Type    | Owner  | Membres                              |
-- |----|------------------|---------|--------|--------------------------------------|
-- | 1  | Tech Enthusiasts | PUBLIC  | Alice  | Djibril, Clara, Emma, Hugo, Jules    |
-- | 2  | Gamers United    | PUBLIC  | Bob    | Djibril, Emma, Hugo                  |
-- | 3  | Globe Trotters   | PRIVATE | David  | Alice, Frank, Iris                   |
-- | 4  | Foodies Club     | PUBLIC  | Clara  | Djibril, Frank, Iris                 |
--
-- Djibril suit : Alice, Bob, Clara, David, Emma (et ils le suivent tous)
-- Feed rempli avec 21 posts et nombreuses interactions
--
-- Pierre sera créé pendant la démo avec le formulaire d'inscription
-- ==============================================
