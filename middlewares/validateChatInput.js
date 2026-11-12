/**
 * ============================================================================
 * FILE: middlewares/validateChatInput.js
 * ============================================================================
 * FUNGSI:
 * Middleware khusus untuk memvalidasi dan mengamankan input pesan pengguna
 * sebelum diteruskan ke Controller dan Layanan Google Gemini AI.
 *
 * REFERENSI MODUL PRAKTIKUM:
 * - Bagian 3 (Prompt Engineering dan AI Guardrail):
 *   1. Menerapkan validasi input pengguna (pesan kosong & batas panjang pesan).
 *   2. Mendeteksi dan memblokir potensi "Prompt Injection" (input yang mencoba
 *      mengubah peran AI, mengabaikan instruksi sistem, atau membocorkan prompt).
 *   3. Menangani pertanyaan yang jelas di luar konteks melalui validasi backend
 *      (tidak hanya mengandalkan System Prompt semata).
 * - Bagian 4 & 6 (Struktur dan Pengelolaan Project):
 *   Memisahkan validasi input ke dalam `middlewares/validateChatInput.js`.
 * ============================================================================
 */

const { geminiConfig } = require('../config/gemini');
const menuModel = require('../models/menuModel');

// Daftar pola (Regex) indikasi serangan Prompt Injection / Jailbreak
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /abaikan\s+(semua\s+)?(instruksi|aturan|perintah)\s+(sebelumnya|di\s+atas)/i,
  /lupakan\s+(semua\s+)?(instruksi|aturan|peran)\s*(sebelumnya)?/i,
  /forget\s+(all\s+)?(previous|your)\s+(instructions|rules|role)/i,
  /you\s+are\s+now\s+(a|an|dan|developer\s+mode)/i,
  /sekarang\s+kamu\s+adalah\s+(seorang\s+)?(programmer|hacker|asisten\s+umum|gpt)/i,
  /system\s*prompt/i,
  /reveal\s+(your\s+)?(system|secret|api\s*key)/i,
  /bocorkan\s+(system\s*prompt|api\s*key|rahasia)/i,
  /act\s+as\s+(if\s+you\s+are|a)/i,
  /jailbreak/i,
  /bypass\s+(guardrail|filter|aturan|restriction)/i
];

// Daftar pola pertanyaan yang jelas di luar konteks aplikasi restoran/kafe (Backend Guardrail)
const OUT_OF_CONTEXT_PATTERNS = [
  /\b(buatkan|bikin|tulis|tuliskan)\s+(saya\s+|aku\s+)?(kode|program|script|coding|kodingan|game|aplikasi|website|html|python|javascript|java|c\+\+|php)\b/i,
  /\b(rumus|hitung|integral|aljabar|matematika|fisika|kimia|biologi)\b/i,
  /\b(presiden|politik|pemilu|partai|ibu\s+kota\s+negara|sejarah\s+dunia)\b/i,
  /\b(kerjakan|jawab)\s+(tugas|pr|ujian|soal|skripsi|makalah)\b/i
];

/**
 * Middleware validasi request body pada POST /api/chat.
 * Mendukung properti `message` (sesuai contoh modul praktikum) maupun `pesan` (bahasa Indonesia).
 */
function validateChatInput(req, res, next) {
  try {
    const body = req.body || {};

    // Ambil teks dari `message` (standar modul) atau `pesan` (kompatibilitas UI pelanggan)
    const rawMessage = body.message !== undefined ? body.message : body.pesan;

    // 1. Validasi: Pesan tidak boleh kosong atau bukan string
    if (rawMessage === undefined || rawMessage === null || String(rawMessage).trim() === '') {
      return res.status(400).json({
        success: false,
        sukses: false,
        message: 'Pesan pertanyaan tidak boleh kosong.',
        pesanError: 'Pesan pertanyaan tidak boleh kosong.'
      });
    }

    const cleanMessage = String(rawMessage).trim();
    const maxLen = geminiConfig.maxMessageLength || 500;

    // 2. Validasi: Batas panjang maksimal karakter pesan (Mencegah spam/token abuse)
    if (cleanMessage.length > maxLen) {
      return res.status(400).json({
        success: false,
        sukses: false,
        message: `Pesan terlalu panjang (maksimal ${maxLen} karakter). Saat ini ${cleanMessage.length} karakter.`,
        pesanError: `Pesan terlalu panjang (maksimal ${maxLen} karakter). Silakan persingkat pertanyaan Anda.`
      });
    }

    // 3. Validasi Backend terhadap serangan Prompt Injection (Bagian 3 & 7 Modul)
    const isPromptInjection = PROMPT_INJECTION_PATTERNS.some((pattern) =>
      pattern.test(cleanMessage)
    );

    if (isPromptInjection) {
      const refusalReply =
        'Mohon maaf, instruksi untuk mengubah peran atau mengabaikan aturan sistem tidak dapat diproses. Saya tetap bertugas sebagai Asisten Meja Toko Kopi Simpanan untuk membantu informasi menu, stok dapur, dan status pesanan Anda.';
      const rekomendasi = menuModel.getRekomendasiTerlarisTersedia(3);

      return res.status(200).json({
        success: true,
        sukses: true,
        intent: 'GUARDRAIL_PROMPT_INJECTION_BLOCKED',
        guardrailTriggered: true,
        data: {
          reply: refusalReply,
          rekomendasiMenu: rekomendasi
        },
        balasan: refusalReply,
        subTeks: 'Silakan tanyakan seputar menu makanan, minuman, atau status pesanan meja Anda:',
        rekomendasiMenu: rekomendasi,
        quickReplies: [
          { label: 'Menu Tersedia', pesan: 'Menu Tersedia' },
          { label: 'Rekomendasi Terlaris', pesan: 'Rekomendasi menu paling laku' },
          { label: 'Status Pesanan Saya', pesan: 'Cek status pesanan meja saya' }
        ]
      });
    }

    // 4. Validasi Backend terhadap pertanyaan yang jelas di luar konteks aplikasi (Bagian 2 & 3 Modul)
    const isOutOfContext = OUT_OF_CONTEXT_PATTERNS.some((pattern) =>
      pattern.test(cleanMessage)
    );

    if (isOutOfContext) {
      const outOfContextReply =
        'Mohon maaf Kak, saya adalah Asisten Meja Toko Kopi Simpanan dan kemampuan saya terbatas pada informasi menu makanan/minuman, ketersediaan stok dapur, serta layanan pemesanan di kedai kami. Saya tidak dapat menjawab pertanyaan di luar layanan kedai. Apakah ada menu kopi atau hidangan yang ingin Kakak pesan?';
      const rekomendasi = menuModel.getRekomendasiTerlarisTersedia(3);

      return res.status(200).json({
        success: true,
        sukses: true,
        intent: 'OUT_OF_CONTEXT_REFUSAL',
        guardrailTriggered: true,
        data: {
          reply: outOfContextReply,
          rekomendasiMenu: rekomendasi
        },
        balasan: outOfContextReply,
        subTeks: 'Berikut beberapa menu favorit kedai kami yang stoknya siap disajikan:',
        rekomendasiMenu: rekomendasi,
        quickReplies: [
          { label: 'Menu Tersedia', pesan: 'Menu Tersedia' },
          { label: 'Rekomendasi Terlaris', pesan: 'Rekomendasi menu paling laku' },
          { label: 'Status Pesanan Saya', pesan: 'Cek status pesanan meja saya' }
        ]
      });
    }

    // Simpan pesan yang sudah bersih dan tervalidasi ke dalam objek `req.validatedChat`
    req.validatedChat = {
      message: cleanMessage,
      nomorMeja: String(body.nomorMeja || '04').trim(),
      nomorAntreanAktif: String(body.nomorAntreanAktif || '').trim()
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = validateChatInput;
