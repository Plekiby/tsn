import mysql from "mysql2/promise";

const configDB = {
  host: "mysql-cltsn.alwaysdata.net",
  port: 3306,
  user: "cltsn",
  password: "Dev$1234",
  database: "cltsn_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(configDB);

export const db = pool;

//////////
// Obtient une connexion du pool MySQL
// Utile pour les transactions ou opérations longues
// Retourne: Promise<Connection>
//////////
export async function obtenirConnexion() {
  return await pool.getConnection();
}

//////////
// Exécute une requête SQL simple
// Retourne un tableau de lignes (résultats)
// Retourne: Promise<Array>
//////////
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

//////////
// Exécute une requête SQL et retourne la première ligne
// Utile pour les requêtes SELECT id WHERE... LIMIT 1
// Retourne: Promise<Object|null>
//////////
export async function queryOne(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}






