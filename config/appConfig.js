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
  jamBuka: process.env.JAM_BUKA || '09:00',
  jamTutup: process.env.JAM_TUTUP || '22:00',
  jamOperasional: process.env.JAM_OPERASIONAL || '09:00 – 22:00 WIB',
  // Mode operasional toko: 'AUTO' (mengikuti jamBuka-jamTutup), 'FORCE_OPEN' (buka manual), 'FORCE_CLOSED' (tutup manual oleh pemilik)
  // Default diatur 'FORCE_OPEN' agar saat demo praktikum kapan saja (termasuk malam) tetap siap diuji, dan otomatis mengikuti jam begitu Pemilik klik 'Set Jam (Auto)' atau 'Tutup Toko'
  modeOperasional: 'FORCE_OPEN',

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
  },

  /**
   * Mengecek apakah toko sedang BUKA atau TUTUP berdasarkan:
   * 1. Setelan manual pemilik (`FORCE_CLOSED` atau `FORCE_OPEN`)
   * 2. Jam operasional otomatis (`jamBuka` s/d `jamTutup` dalam WIB)
   */
  getStatusToko() {
    const now = new Date();
    const jamMenitSekarang = now.toTimeString().slice(0, 5); // Format "HH:MM"

    const parseMenit = (str) => {
      const [h, m] = String(str || '00:00').split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const menitSekarang = now.getHours() * 60 + now.getMinutes();
    const menitBuka = parseMenit(this.jamBuka);
    const menitTutup = parseMenit(this.jamTutup);

    let dalamJamKerja = false;
    // Jika jamBuka == jamTutup (misal 00:00 - 00:00), anggap buka 24 jam
    if (menitBuka === menitTutup) {
      dalamJamKerja = true;
    } else if (menitBuka < menitTutup) {
      dalamJamKerja = menitSekarang >= menitBuka && menitSekarang <= menitTutup;
    } else {
      // Jika melewati tengah malam (misal buka 09:00 pagi s/d tutup 04:00 subuh)
      dalamJamKerja = menitSekarang >= menitBuka || menitSekarang <= menitTutup;
    }

    let sedangBuka = dalamJamKerja;
    let alasan = dalamJamKerja
      ? `Toko sedang buka sesuai jadwal operasional (${this.jamBuka} – ${this.jamTutup} WIB). Jam server saat ini: ${jamMenitSekarang} WIB.`
      : `Mohon maaf, toko sedang tutup karena jam server saat ini (${jamMenitSekarang} WIB) berada di luar jadwal operasional (${this.jamBuka} – ${this.jamTutup} WIB).`;

    if (this.modeOperasional === 'FORCE_CLOSED') {
      sedangBuka = false;
      alasan = `Mohon maaf, saat ini penerimaan pesanan sedang ditutup sementara oleh Manajemen / Pemilik Toko. Jam operasional normal: ${this.jamBuka} – ${this.jamTutup} WIB.`;
    } else if (this.modeOperasional === 'FORCE_OPEN') {
      sedangBuka = true;
      alasan = `Toko sedang dibuka aktif oleh Manajemen (${this.jamBuka} – ${this.jamTutup} WIB). Jam server saat ini: ${jamMenitSekarang} WIB.`;
    }

    return {
      sedangBuka,
      modeOperasional: this.modeOperasional,
      jamBuka: this.jamBuka,
      jamTutup: this.jamTutup,
      jamOperasional: `${this.jamBuka} – ${this.jamTutup} WIB`,
      jamSekarang: jamMenitSekarang,
      alasan
    };
  },

  /**
   * Mengubah pengaturan buka/tutup toko & jam operasional oleh Pemilik.
   */
  updatePengaturanToko({ modeOperasional, jamBuka, jamTutup }) {
    if (['AUTO', 'FORCE_OPEN', 'FORCE_CLOSED'].includes(modeOperasional)) {
      this.modeOperasional = modeOperasional;
    }
    if (jamBuka && /^\d{2}:\d{2}$/.test(jamBuka)) {
      this.jamBuka = jamBuka;
    }
    if (jamTutup && /^\d{2}:\d{2}$/.test(jamTutup)) {
      this.jamTutup = jamTutup;
    }
    this.jamOperasional = `${this.jamBuka} – ${this.jamTutup} WIB`;
    return this.getStatusToko();
  }
};

module.exports = appConfig;
