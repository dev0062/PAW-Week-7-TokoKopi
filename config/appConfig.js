/**
 * ============================================================================
 * FILE: config/appConfig.js
 * ============================================================================
 * Referensi PRD:
 * - Header PRD:
 *   Nama Produk : Devtech
 *   Versi       : v1.0 / 15 Oktober 2026
 *   Penulis     : Dev Alldino Zain (20240140260)
 * - US-02-3 & F-05:
 *   Batas aman stok minimum (lowStockThreshold) diatur sebanyak 5 porsi.
 *   Jika sisa stok <= 5 porsi, sistem menampilkan peringatan "Stok Menipis".
 * - Bagian 8 (Dependensi & Constraint):
 *   Konfigurasi port server, parameter meja dine-in (Non-Goal 1: hanya makan
 *   di tempat / tidak melayani delivery online), serta konfigurasi layanan
 *   AI Agent (siap dihubungkan ke endpoint LLM eksternal melalui env variable).
 * ============================================================================
 */

const appConfig = {
  // Identitas Produk sesuai Header PRD
  appName: process.env.APP_NAME || 'Toko Kopi Simpanan',
  brandSubtitle: process.env.BRAND_SUBTITLE || 'Ngopi',
  version: 'v1.0',
  releaseDate: '15 Oktober 2026',
  authorName: 'Dev Alldino Zain',
  authorNim: '20240140260',

  // Konfigurasi Server
  port: Number(process.env.PORT) || 3000,

  // Konfigurasi Operasional Kedai & Meja (US-01-1 & Mitigasi Risiko 3: Validasi Nomor Meja)
  jumlahMeja: Number(process.env.JUMLAH_MEJA) || 20,
  mejaDefault: '04',
  jamOperasional: process.env.JAM_OPERASIONAL || '09.00 – 22.00 WIB',

  // US-02-3 & F-05: Batas aman stok minimum diatur sebanyak 5 porsi
  batasStokMenipis: Number(process.env.LOW_STOCK_THRESHOLD) || 5,

  // Target Metrik Keberhasilan (PRD Bagian 3: Success Metrics M-01 s/d M-04)
  metricsTarget: {
    batasBatalPesanPersen: 5, // M-01: < 5% per hari
    targetWaktuRekapDetik: 5, // M-02: < 5 detik
    targetWaktuPesanMenit: 3, // M-03: < 3 menit
    targetResponChatDetik: 2  // M-04: < 2 detik
  },

  // Konfigurasi AI Agent (PRD Bagian 8 - Dependensi 2: API Chatbot di Backend)
  // Saat AI_PROVIDER_URL & AI_API_KEY diisi pada environment produksi,
  // utils/aiAgent.js dapat meneruskan konteks stok langsung ke penyedia LLM.
  aiConfig: {
    assistantName: 'Asisten Meja Devtech',
    providerUrl: process.env.AI_PROVIDER_URL || '',
    apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
    modelName: process.env.AI_MODEL_NAME || 'gemini-1.5-flash',
    timeoutMs: 1800 // Menjaga target M-04 (< 2 detik)
  }
};

module.exports = appConfig;
