/**
 * ============================================================================
 * FILE: models/userModel.js
 * ============================================================================
 * Referensi PRD:
 * - Bagian 4 (Target User / Persona):
 *   1. Dev Yuftiana Ayyun (Pemilik) -> Mengakses Dashboard Laporan (/pemilik)
 *      & memantau operasional stok/penjualan harian (US-02-1 s/d US-02-5).
 *   2. Nazhat Hafidz Al Jauzi (Staf Dapur) -> Mengakses Layar Antrean Dapur
 *      & Kelola Stok (/staf) (US-03-1 s/d US-03-5).
 *   3. Evan Vijaya Putra (Pelanggan) -> Mengakses halaman pemesanan mandiri
 *      meja (/?meja=XX) secara langsung via QR Code (US-01-1 < 3 detik)
 *      dengan identifikasi Nama Pemesan & Nomor Meja.
 * ============================================================================
 */

const daftarAkunInternal = [
  {
    id: 1,
    username: 'pemilik',
    password: 'password123',
    namaLengkap: 'Dev Yuftiana Ayyun',
    jabatan: 'Pemilik Kedai (Owner)',
    role: 'pemilik',
    halamanUtama: '/pemilik'
  },
  {
    id: 2,
    username: 'staf',
    password: 'password123',
    namaLengkap: 'Nazhat Hafidz Al Jauzi',
    jabatan: 'Staf Dapur & Layanan',
    role: 'staf',
    halamanUtama: '/staf'
  }
];

/**
 * Memverifikasi kredensial login untuk Pemilik dan Staf Dapur.
 * @param {string} username
 * @param {string} password
 * @returns {Object|null}
 */
function autentikasiInternal(username, password) {
  if (!username || !password) return null;
  const uBersih = String(username).trim().toLowerCase();
  const pBersih = String(password).trim();

  const akun = daftarAkunInternal.find(
    (item) => item.username.toLowerCase() === uBersih && item.password === pBersih
  );

  if (!akun) return null;

  // Kembalikan data profil tanpa menyertakan password
  return {
    id: akun.id,
    username: akun.username,
    namaLengkap: akun.namaLengkap,
    jabatan: akun.jabatan,
    role: akun.role,
    halamanUtama: akun.halamanUtama
  };
}

/**
 * Mencari akun internal berdasarkan username.
 * @param {string} username
 * @returns {Object|null}
 */
function getUserByUsername(username) {
  if (!username) return null;
  const akun = daftarAkunInternal.find(
    (item) => item.username.toLowerCase() === String(username).trim().toLowerCase()
  );
  if (!akun) return null;
  return {
    id: akun.id,
    username: akun.username,
    namaLengkap: akun.namaLengkap,
    jabatan: akun.jabatan,
    role: akun.role,
    halamanUtama: akun.halamanUtama
  };
}

module.exports = {
  autentikasiInternal,
  getUserByUsername
};
