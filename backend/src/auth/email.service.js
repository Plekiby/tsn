import nodemailer from "nodemailer";

/**
 * Service d'email utilisant le serveur SMTP AlwaysData
 * Configurat avec les paramètres du compte cltsn
 */

const configSMTP = {
  host: process.env.SMTP_HOST || "smtp-cltsn.alwaysdata.net",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
};

const transporteur = nodemailer.createTransport(configSMTP);

/**
 * Teste la connexion SMTP
 */
export async function testerConnectionSMTP() {
  try {
    await transporteur.verify();
    return true;
  } catch (erreur) {
    console.error("Erreur de connexion SMTP:", erreur.message);
    return false;
  }
}

/**
 * Envoie un email de confirmation d'inscription
 * @param {string} email - Email du nouvel utilisateur
 * @param {string} jeton - Token de vérification unique
 * @param {string} nomUtilisateur - Nom d'affichage
 */
export async function envoyerEmailVerification(email, jeton, nomUtilisateur) {
  const urlVerification = `${process.env.BASE_URL || "http://localhost:3000"}/auth/verifier-email/${jeton}`;

  const contenuHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0061a1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .button { display: inline-block; background-color: #0061a1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur TSN! 🎉</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${nomUtilisateur}</strong>,</p>
            
            <p>Merci de ton inscription sur <strong>TSN - Réseau Social Intelligent</strong>!</p>
            
            <p>Pour finaliser ton compte et commencer à explorer le réseau, clique sur le bouton ci-dessous pour vérifier ton adresse email:</p>
            
            <div style="text-align: center;">
              <a href="${urlVerification}" class="button">Vérifier mon email</a>
            </div>
            
            <p>Ou copie-colle ce lien dans ton navigateur:</p>
            <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 3px;">
              ${urlVerification}
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Ce lien expire dans 24 heures.
            </p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            
            <p>Si tu n'as pas créé de compte, ignore cet email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 TSN - Réseau Social Intelligent</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporteur.sendMail({
      from: process.env.SMTP_USER || "noreply@tsn.local",
      to: email,
      subject: "Confirme ton adresse email - TSN",
      html: contenuHtml,
      text: `Bienvenue ${nomUtilisateur}!\n\nClique ici pour vérifier ton email:\n${urlVerification}\n\nCe lien expire dans 24 heures.`
    });
    return true;
  } catch (erreur) {
    console.error(`Erreur SMTP pour ${email}:`, {
      message: erreur.message,
      code: erreur.code,
      command: erreur.command,
      response: erreur.response
    });
    return false;
  }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 * @param {string} email - Email de l'utilisateur
 * @param {string} jeton - Token de réinitialisation
 */
export async function envoyerEmailReinitialisationMotDePasse(email, jeton) {
  const urlReinitialisation = `${process.env.BASE_URL || "http://localhost:3000"}/auth/reinitialiser-mot-de-passe/${jeton}`;

  const contenuHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4a100; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .button { display: inline-block; background-color: #f4a100; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            
            <p>Tu as demandé une réinitialisation de mot de passe pour ton compte TSN.</p>
            
            <p>Clique sur le bouton ci-dessous pour créer un nouveau mot de passe:</p>
            
            <div style="text-align: center;">
              <a href="${urlReinitialisation}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p>Ou copie-colle ce lien:</p>
            <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 3px;">
              ${urlReinitialisation}
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Ce lien expire dans 1 heure.
            </p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            
            <p>Si tu n'as pas demandé cette réinitialisation, ignore cet email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 TSN</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporteur.sendMail({
      from: process.env.SMTP_USER || "noreply@tsn.local",
      to: email,
      subject: "Réinitialise ton mot de passe - TSN",
      html: contenuHtml,
      text: `Clique ici pour réinitialiser ton mot de passe:\n${urlReinitialisation}\n\nCe lien expire dans 1 heure.`
    });
    return true;
  } catch (erreur) {
    console.error(`Erreur lors de l'envoi de l'email: ${erreur.message}`);
    return false;
  }
}
