/**
 * ============================================================================
 * FILE: controllers/chat.controller.js
 * ============================================================================
 * FUNGSI:
 * Controller khusus untuk menangani HTTP request pada endpoint AI Assistant
 * (`POST /api/chat`), memanggil `services/gemini.service.js`, dan mengembalikan
 * response JSON sesuai standar modul praktikum sekaligus mendukung UI frontend.
 *
 * REFERENSI MODUL PRAKTIKUM:
 * - Bagian 4 (Implementasi Backend API untuk AI Assistant):
 *   Endpoint: POST /api/chat
 *   Contoh Request Body:
 *   {
 *     "message": "Informasi apa saja yang tersedia?"
 *   }
 *   Contoh Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "reply": "Berikut informasi yang tersedia..."
 *     }
 *   }
 * - Bagian 6 (Struktur dan Pengelolaan Project):
 *   Memisahkan logika request/response chat ke dalam `controllers/chat.controller.js`.
 * ============================================================================
 */

const appConfig = require('../config/appConfig');
const geminiService = require('../services/gemini.service');

/**
 * Handler utama untuk POST /api/chat.
 * Menerima pertanyaan dari req.validatedChat (yang sudah divalidasi oleh
 * middleware `validateChatInput.js`), memproses context di `gemini.service.js`,
 * dan mengirimkan respons JSON ke frontend maupun Postman/Thunder Client.
 */
async function handleChatRequest(req, res, next) {
  try {
    // Ambil data yang telah divalidasi oleh middleware validateChatInput
    const validated = req.validatedChat || {};
    const message =
      validated.message ||
      req.body?.message ||
      req.body?.pesan ||
      '';
    const nomorMeja =
      validated.nomorMeja ||
      req.body?.nomorMeja ||
      appConfig.mejaDefault;
    const nomorAntreanAktif =
      validated.nomorAntreanAktif ||
      req.body?.nomorAntreanAktif ||
      '';

    // Panggil service Gemini yang telah terhubung ke context database PostgreSQL
    const result = await geminiService.generateChatResponse({
      message,
      nomorMeja,
      nomorAntreanAktif
    });

    // Kembalikan response JSON yang memenuhi format Modul Praktikum (`success` & `data.reply`)
    // sekaligus menyediakan field kartu menu interaktif (`balasan`, `rekomendasiMenu`, dll) untuk Frontend
    return res.status(200).json({
      success: true,
      sukses: true,
      data: {
        reply: result.reply,
        inContext: result.inContext,
        intent: result.intent,
        rekomendasiMenu: result.rekomendasiMenu || [],
        waktuProsesMs: result.waktuProsesMs
      },
      // Field kompatibilitas komponen Chatbot Pelanggan (vcard menu & quick replies)
      intent: result.intent,
      balasan: result.balasan,
      subTeks: result.subTeks,
      rekomendasiMenu: result.rekomendasiMenu || [],
      quickReplies: result.quickReplies || [],
      waktuProsesMs: result.waktuProsesMs
    });
  } catch (error) {
    console.error('[Chat Controller] Gagal memproses permintaan chat:', error.message);
    return res.status(500).json({
      success: false,
      sukses: false,
      message: 'Maaf, layanan AI Assistant sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
      pesanError: 'Maaf, layanan AI Assistant sedang mengalami gangguan. Silakan coba beberapa saat lagi.'
    });
  }
}

module.exports = {
  handleChatRequest
};
