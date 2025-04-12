const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  //ssl: { rejectUnauthorized: false }, // Uncomment this line if you are using SSL
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Koneksi ke PostgreSQL berhasil!");
    client.release();
  } catch (error) {
    console.error("❌ Gagal konek ke PostgreSQL:", error);
  }
}

testConnection();
