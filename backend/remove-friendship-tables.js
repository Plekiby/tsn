import mysql from "mysql2/promise";
import readline from "readline";

const dbConfig = {
  host: "mysql-cltsn.alwaysdata.net",
  port: 3306,
  user: "cltsn",
  password: "Dev$1234",
  database: "cltsn_db"
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function removeFriendshipTables() {
  console.log("\n⚠️  ATTENTION: Suppression des tables FriendRequest et Friendship");
  console.log("=====================================\n");
  console.log("Cette opération va:");
  console.log("  ✓ Supprimer toutes les demandes d'ami (FriendRequest)");
  console.log("  ✓ Supprimer toutes les amitiés confirmées (Friendship)");
  console.log("  ✓ Supprimer les notifications liées (FRIEND_REQUEST, FRIEND_ACCEPTED)");
  console.log("\n⚠️  Cette opération est IRRÉVERSIBLE!\n");

  const answer = await question("Tapez 'OUI' pour confirmer la suppression: ");

  if (answer.toUpperCase() !== "OUI") {
    console.log("\n❌ Opération annulée.");
    rl.close();
    return;
  }

  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log("\n🔄 Connexion à la base de données...");

    // Compter les données avant suppression
    const [friendRequests] = await connection.query("SELECT COUNT(*) as count FROM FriendRequest");
    const [friendships] = await connection.query("SELECT COUNT(*) as count FROM Friendship");
    const [notifications] = await connection.query(
      "SELECT COUNT(*) as count FROM Notification WHERE type IN ('FRIEND_REQUEST', 'FRIEND_ACCEPTED')"
    );

    console.log(`\n📊 Données à supprimer:`);
    console.log(`   - FriendRequest: ${friendRequests[0].count} entrées`);
    console.log(`   - Friendship: ${friendships[0].count} entrées`);
    console.log(`   - Notifications: ${notifications[0].count} entrées`);

    console.log("\n🗑️  Suppression en cours...");

    // Supprimer les notifications
    await connection.query("DELETE FROM Notification WHERE type IN ('FRIEND_REQUEST', 'FRIEND_ACCEPTED')");
    console.log("   ✓ Notifications supprimées");

    // Supprimer les tables
    await connection.query("DROP TABLE IF EXISTS FriendRequest");
    console.log("   ✓ Table FriendRequest supprimée");

    await connection.query("DROP TABLE IF EXISTS Friendship");
    console.log("   ✓ Table Friendship supprimée");

    console.log("\n✅ Migration terminée avec succès!");
    console.log("\n📝 Le système utilise maintenant uniquement la table Follow.");
    console.log("   Les 'mutuals' sont détectés automatiquement quand deux");
    console.log("   utilisateurs se suivent mutuellement.");

  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
  } finally {
    await connection.end();
    rl.close();
  }
}

removeFriendshipTables();
