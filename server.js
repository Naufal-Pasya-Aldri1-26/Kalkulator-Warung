
const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "172TY*S%0erk",
    database: "warungdb",
    waitForConnections: true,
    connectionLimit: 10
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function validProduct(body) {
    const { nama_barang, harga_beli, harga_jual, stok } = body;

    return (
        typeof nama_barang === "string" &&
        nama_barang.trim().length > 0 &&
        nama_barang.trim().length <= 100 &&
        harga_beli !== "" && harga_beli !== null &&
        harga_jual !== "" && harga_jual !== null &&
        stok !== "" && stok !== null &&
        Number.isFinite(Number(harga_beli)) &&
        Number.isFinite(Number(harga_jual)) &&
        Number(harga_beli) >= 0 &&
        Number(harga_jual) >= 0 &&
        Number.isInteger(Number(stok)) &&
        Number(stok) >= 0
    );
}

app.get("/barang", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM barang ORDER BY id_barang DESC"
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal mengambil data barang." });
    }
});

app.post("/barang", async (req, res) => {
    if (!validProduct(req.body)) {
        return res.status(400).json({ error: "Periksa nama, harga, dan stok." });
    }

    try {
        const { nama_barang, harga_beli, harga_jual, stok } = req.body;
        const [result] = await db.execute(
            `INSERT INTO barang
             (nama_barang, harga_beli, harga_jual, stok)
             VALUES (?, ?, ?, ?)`,
            [nama_barang.trim(), Number(harga_beli),
             Number(harga_jual), Number(stok)]
        );

        res.status(201).json({
            message: "Barang berhasil ditambahkan.",
            id_barang: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal menambahkan barang." });
    }
});

app.put("/barang/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0 || !validProduct(req.body)) {
        return res.status(400).json({ error: "ID atau data barang tidak valid." });
    }

    try {
        const { nama_barang, harga_beli, harga_jual, stok } = req.body;
        const [result] = await db.execute(
            `UPDATE barang
             SET nama_barang = ?, harga_beli = ?, harga_jual = ?, stok = ?
             WHERE id_barang = ?`,
            [nama_barang.trim(), Number(harga_beli),
             Number(harga_jual), Number(stok), id]
        );

        if (result.affectedRows === 0) {
            const [rows] = await db.execute(
                "SELECT id_barang FROM barang WHERE id_barang = ?", [id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: "Barang tidak ditemukan." });
            }
        }

        res.json({ message: "Barang berhasil diperbarui." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal memperbarui barang." });
    }
});

app.delete("/barang/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID barang tidak valid." });
    }

    try {
        const [result] = await db.execute(
            "DELETE FROM barang WHERE id_barang = ?", [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Barang tidak ditemukan." });
        }

        res.json({ message: "Barang berhasil dihapus." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Gagal menghapus barang." });
    }
});

async function startServer() {
    try {
        await db.query("SELECT 1");
        app.listen(PORT, () => {
            console.log(`WarungDB berjalan di http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Gagal terhubung ke MySQL:", error.message);
        process.exit(1);
    }
}

startServer();
