// db.js
import { createPool } from "mysql2/promise";
import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DATABASE } from "./config";

const pool = createPool({
  host: DB_HOST,
  database: DATABASE,
  user: DB_USER,
  port: 3306,
  password: DB_PASSWORD,
});

pool
  .getConnection()
  .then((connection) => {
    console.log("Conectado al servidor");
    connection.release();
  })
  .catch((error) => {
    console.error("Error al conectar:", error);
  });

export { pool };
