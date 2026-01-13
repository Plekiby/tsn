import mysql from "mysql2/promise";

const dbConfig = {
  host: "mysql-cltsn.alwaysdata.net",
  port: 3306,
  user: "cltsn",
  password: "Dev$1234",
  database: "cltsn_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export const db = pool;

// Helper pour obtenir une connexion
export async function getConnection() {
  return await pool.getConnection();
}

// Helper pour exécuter une requête simple
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Helper pour exécuter une requête et retourner un seul résultat
export async function queryOne(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}
