/**
 * ============================================================================
 * FILE: middlewares/requestLogger.js
 * ============================================================================
 * Referensi PRD:
 * - Bagian 3 (Success Metrics M-02 & M-04):
 *   Memantau durasi eksekusi setiap HTTP request (dalam milidetik) untuk
 *   memastikan kecepatan balasan Chatbot (< 2 detik / 2000 ms) dan pemuatan
 *   rekap laporan pemilik (< 5 detik / 5000 ms) selalu terpenuhi.
 * ============================================================================
 */

const { formatWaktuLog } = require('../utils/formatter');

function requestLogger(req, res, next) {
  const waktuMulai = Date.now();
  const timestamp = formatWaktuLog(new Date());

  res.on('finish', () => {
    const durasiMs = Date.now() - waktuMulai;
    const metode = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;

    console.log(`[${timestamp}] ${metode} ${url} ${status} - ${durasiMs} ms`);
  });

  next();
}

module.exports = requestLogger;
