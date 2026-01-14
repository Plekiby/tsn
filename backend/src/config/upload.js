import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier d'upload
const uploadDir = path.join(__dirname, '../../public/uploads');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurer le stockage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique : timestamp + random + extension
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    // Sanitiser le nom : supprimer les caractères spéciaux
    const sanitizedName = name
      .replace(/[àâä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-zA-Z0-9_-]/g, ''); // Supprimer tout sauf alphanumériques, underscore, tiret
    
    const filename = `${timestamp}-${random}-${sanitizedName}${ext}`;
    cb(null, filename);
  }
});

// Filtrer les fichiers : accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const typesAutorisees = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (typesAutorisees.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images (JPEG, PNG, GIF, WebP) sont autorisées'), false);
  }
};

// Créer l'instance Multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

export default upload;
