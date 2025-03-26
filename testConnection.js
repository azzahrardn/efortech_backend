const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: { rejectUnauthorized: false },
    });

    console.log("✅ Koneksi berhasil!");
    await connection.end();
  } catch (error) {
    console.error("❌ Gagal konek:", error);
  }
}

testConnection();
