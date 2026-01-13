-- Script pour supprimer les tables FriendRequest et Friendship
-- ⚠️ ATTENTION : Cette opération est IRRÉVERSIBLE
-- Sauvegardez vos données avant d'exécuter ce script!

-- Étape 1: Supprimer les contraintes et notifications liées
-- Supprimer les notifications de type FRIEND_REQUEST et FRIEND_ACCEPTED
DELETE FROM Notification WHERE type IN ('FRIEND_REQUEST', 'FRIEND_ACCEPTED');

-- Étape 2: Supprimer les tables
DROP TABLE IF EXISTS FriendRequest;
DROP TABLE IF EXISTS Friendship;

-- Vérification
SELECT 'Tables supprimées avec succès!' as status;

-- Note: Le système utilise maintenant uniquement la table Follow
-- Les "mutuals" (connexions mutuelles) sont détectés automatiquement
-- quand deux utilisateurs se suivent mutuellement dans la table Follow.
