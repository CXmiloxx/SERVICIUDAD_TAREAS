import { config } from "dotenv";

config();

// config.js
export const PORT = process.env.PORT || 3011;
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || 3306;
export const DB_USER = process.env.DB_USER || "michel";
export const DB_PASSWORD = process.env.DB_PASSWORD || "1399";
export const DATABASE = process.env.DATABASE || "demo";

// conectar local y produccion

export const API_SERVER =
  process.env.API_SERVER || "https://server.finova.com.co";

export const NOTIFICATION_API =
  process.env.NOTIFICATION_API || "https://notificar.finova.com.co";

export const ADMIN_API =
  process.env.ADMIN_API || "https://panel.finova.com.cox";


  export const SERVIDOR = process.env.SERVIDOR || "SIN.ENV";