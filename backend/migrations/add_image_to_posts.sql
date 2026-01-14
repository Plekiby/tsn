-- Migration: Ajouter la colonne imageUrl à la table Post
-- Date: 2026-01-14
-- Description: Permet de stocker les URLs des images dans les posts

ALTER TABLE Post ADD COLUMN imageUrl VARCHAR(255) NULL DEFAULT NULL AFTER content;

-- Créer un index sur imageUrl pour les requêtes de filtrage éventuelles
CREATE INDEX idx_post_imageUrl ON Post(imageUrl);
