/**
 * ============================================================================
 * FILE: utils/formatter.js
 * ============================================================================
 * Referensi PRD:
 * - US-02-1 & US-02-5: Pemformatan angka Rupiah, persentase, dan tanggal
 *   untuk laporan penjualan harian pemilik (Dev Yuftiana Ayyun).
 * - US-03-4: Perhitungan selisih waktu tunggu (elapsed time) untuk mengurutkan
 *   dan memantau antrean pesanan masuk di layar dapur (Nazhat Hafidz Al Jauzi).
 * ============================================================================
 */

/**
 * Memformat angka nominal menjadi format mata uang Rupiah standar Indonesia.
 * Contoh: 28000 -> "Rp 28.000"
 * @param {number} nominal
 * @returns {string}
 */
function formatRupiah(nominal) {
  const nilai = Number(nominal) || 0;
  return 'Rp ' + nilai.toLocaleString('id-ID');
}

/**
 * Memformat objek Date menjadi jam:menit:detik (HH:MM:SS) untuk log server.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function formatWaktuLog(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Memformat waktu jam dan menit singkat (HH.MM WIB) untuk kartu pesanan dapur & chat.
 * @param {string|Date} inputDate
 * @returns {string}
 */
function formatJamMenit(inputDate) {
  const d = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}.${pad(d.getMinutes())} WIB`;
}

/**
 * Memformat tanggal lengkap bahasa Indonesia untuk header laporan harian pemilik (US-02-1, US-02-5).
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function formatTanggalLaporan(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Menghitung durasi waktu tunggu sejak pesanan dibuat hingga saat ini (US-03-4).
 * Membantu staf dapur memprioritaskan pesanan yang masuk lebih awal.
 * @param {string|Date} createdAt
 * @returns {string}
 */
function hitungWaktuTunggu(createdAt) {
  const dibuat = new Date(createdAt).getTime();
  const sekarang = Date.now();
  const selisihDetik = Math.max(0, Math.floor((sekarang - dibuat) / 1000));

  if (selisihDetik < 60) {
    return 'Baru masuk';
  }
  const menit = Math.floor(selisihDetik / 60);
  if (menit < 60) {
    return `${menit} menit lalu`;
  }
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return `${jam}j ${sisaMenit}m lalu`;
}

module.exports = {
  formatRupiah,
  formatWaktuLog,
  formatJamMenit,
  formatTanggalLaporan,
  hitungWaktuTunggu
};
