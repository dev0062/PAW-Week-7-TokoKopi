/**
 * ============================================================================
 * FILE: services/gemini.service.js
 * ============================================================================
 * FUNGSI:
 * Mengelola seluruh komunikasi dengan Google Gemini API, menyiapkan Context
 * berdasarkan data relevan dari database (Sequelize PostgreSQL), menerapkan
 * System Instruction & Guardrail, serta mengembalikan respons terstruktur.
 *
 * REFERENSI MODUL PRAKTIKUM:
 * - Bagian 1 (Integrasi Google Gemini):
 *   Backend bertanggung jawab menerima pertanyaan pengguna, menyiapkan context,
 *   mengirim permintaan ke Gemini, dan mengembalikan respons.
 * - Bagian 2 (Implementasi Context-Based AI Response):
 *   Mengambil data dari database (`menuModel.findAllFromDb()` & `orderModel`)
 *   sebagai sumber kebenaran (single source of truth) agar AI tidak mengarang.
 * - Bagian 3 (Prompt Engineering dan AI Guardrail):
 *   Menangani pertanyaan di luar konteks, menolak secara sopan, dan menangani
 *   kegagalan API / error dari layanan Gemini dengan graceful fallback.
 * - Bagian 6 (Struktur Project):
 *   Memisahkan logika komunikasi Gemini ke dalam `services/gemini.service.js`.
 * ============================================================================
 */

const { geminiConfig, getGeminiClient } = require('../config/gemini');
const menuModel = require('../models/menuModel');
const orderModel = require('../models/orderModel');
const { formatRupiah } = require('../utils/formatter');

// Daftar tombol Quick Reply standar untuk memudahkan interaksi pelanggan di meja
const QUICK_REPLIES_STANDAR = [
  { label: 'Menu Tersedia', pesan: 'Menu Tersedia' },
  { label: 'Rekomendasi Terlaris', pesan: 'Rekomendasi menu paling laku' },
  { label: 'Cek Ayam Bakar Madu', pesan: 'Apakah Ayam Bakar Madu masih ada?' },
  { label: 'Status Pesanan Saya', pesan: 'Cek status pesanan meja saya' }
];

/**
 * Menyusun teks Context dari data database real-time (daftar menu, stok, harga,
 * dan pesanan aktif meja) untuk dikirimkan bersama prompt ke Google Gemini.
 *
 * @param {Array<Object>} semuaMenu - Data seluruh menu dari database
 * @param {string} nomorMeja - Nomor meja pelanggan
 * @returns {{contextMenuText: string, infoPesananText: string}}
 */
function buildDatabaseContext(semuaMenu, nomorMeja) {
  const contextMenuText = semuaMenu
    .map((m) => {
      const statusStok = m.stok > 0 ? `TERSEDIA (${m.stok} porsi)` : 'HABIS (0 porsi)';
      return `- [ID: ${m.id}] ${m.nama} | Kategori: ${m.kategori} | Harga: ${formatRupiah(m.harga)} | Status Stok: ${statusStok} | Terjual Hari Ini: ${m.terjualHariIni} porsi | Deskripsi: ${m.deskripsi}`;
    })
    .join('\n');

  const pesananMejaList = orderModel.getPesananByMeja(nomorMeja);
  let infoPesananText = 'Belum ada pesanan aktif untuk meja ini.';
  if (pesananMejaList.length > 0) {
    infoPesananText = pesananMejaList
      .map(
        (p) =>
          `Nomor Antrean: ${p.nomorAntrean} | Status Dapur: ${p.status} | Total: ${formatRupiah(p.totalHarga)} | Rincian: ${p.items.map((i) => `${i.qty}x ${i.nama}`).join(', ')}`
      )
      .join(' ; ');
  }

  return { contextMenuText, infoPesananText };
}

/**
 * Helper pencocokan menu berdasarkan preferensi rasa/kategori ketika AI memilih kartu menu.
 */
function cariMenuBerdasarkanPreferensi(teks, semuaMenu) {
  const t = teks.toLowerCase();
  const hasil = [];

  for (const m of semuaMenu) {
    if (m.stok <= 0) continue;
    const desc = (m.deskripsi || '').toLowerCase();
    const kat = (m.kategori || '').toLowerCase();

    if (t.includes('manis') && (desc.includes('aren') || desc.includes('karamel') || desc.includes('madu') || desc.includes('manis') || desc.includes('latte'))) {
      hasil.push(m);
    } else if ((t.includes('pahit') || t.includes('nendang') || t.includes('ngantuk')) && (desc.includes('espresso') || desc.includes('v60') || desc.includes('ristretto'))) {
      hasil.push(m);
    } else if (t.includes('segar') && (kat.includes('minuman segar') || desc.includes('leci') || desc.includes('yakult') || desc.includes('mint'))) {
      hasil.push(m);
    } else if (t.includes('pedas') && (desc.includes('sambal') || desc.includes('luat') || desc.includes('korek') || desc.includes('petis'))) {
      hasil.push(m);
    } else if ((t.includes('camilan') || t.includes('cemilan') || t.includes('ngemil') || t.includes('gurih')) && kat.includes('kudapan')) {
      hasil.push(m);
    } else if (t.includes('kopi') && kat.includes('kopi')) {
      hasil.push(m);
    }
  }

  return hasil.slice(0, 3);
}

/**
 * Memanggil model Google Gemini dengan menyertakan System Instruction dan Context Database.
 * Meminta output JSON terstruktur agar kita tahu:
 * 1. Teks jawaban natural untuk pengguna (`reply`)
 * 2. Apakah pertanyaan berada di dalam konteks aplikasi (`inContext`)
 * 3. ID menu yang direkomendasikan (`menuIds`) untuk ditampilkan sebagai Menu Card (vcard)
 */
async function requestGeminiCompletion({ message, nomorMeja, semuaMenu }) {
  const client = getGeminiClient();
  if (!client) {
    return null;
  }

  const { contextMenuText, infoPesananText } = buildDatabaseContext(semuaMenu, nomorMeja);
  const systemInstruction = geminiConfig.getSystemInstruction(nomorMeja);

  const userPromptWithContext = `
=== DATA DATABASE REAL-TIME TOKO KOPI SIMPANAN ===
DAFTAR MENU & STOK SAAT INI:
${contextMenuText}

STATUS PESANAN AKTIF MEJA ${nomorMeja}:
${infoPesananText}
==================================================

PERTANYAAN PENGGUNA DARI MEJA ${nomorMeja}:
"${message}"

INSTRUKSI FORMAT OUTPUT:
Jawablah hanya dalam format JSON valid berikut (tanpa markdown blok kode jika memungkinkan):
{
  "inContext": true,
  "reply": "Teks jawaban ramah dan informatif untuk pelanggan (maksimal 2-3 kalimat). Jika pertanyaan di luar konteks kafe/menu/pesanan, set inContext ke false dan tulis penolakan sopan di sini.",
  "menuIds": [5, 6]
}
Catatan untuk "menuIds":
- Isi dengan array angka ID menu (maksimal 3 ID) yang relevan dengan jawaban Anda DAN memiliki stok > 0.
- Jika pertanyaan di luar konteks aplikasi (inContext = false), wajib isi "menuIds": [].
`.trim();

  const modelsToTry = geminiConfig.fallbackModels || [geminiConfig.modelName];

  for (const modelName of modelsToTry) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: userPromptWithContext,
        config: {
          systemInstruction,
          temperature: geminiConfig.temperature
        }
      });

      if (!response || !response.text) {
        continue;
      }

      let rawText = response.text.trim();
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
      }

      try {
        const parsed = JSON.parse(rawText);
        return {
          inContext: parsed.inContext !== false,
          reply: String(parsed.reply || parsed.jawaban || rawText).trim(),
          menuIds: Array.isArray(parsed.menuIds) ? parsed.menuIds.map(Number) : []
        };
      } catch (jsonErr) {
        // Jika Gemini membalas teks langsung tanpa pembungkus JSON
        return {
          inContext: true,
          reply: rawText,
          menuIds: []
        };
      }
    } catch (apiError) {
      console.warn(`[Gemini Service] Model ${modelName} sibuk/error, mencoba fallback berikutnya...`);
    }
  }
  return null;
}

/**
 * Fungsi utama layanan AI Assistant yang dipanggil oleh `chat.controller.js`.
 * Menggabungkan pemeriksaan database real-time, pemanggilan Google Gemini API,
 * pencatatan menu habis yang dicari (US-02-4), serta pelampiran kartu menu (vcard).
 *
 * @param {Object} params
 * @param {string} params.message - Pertanyaan pelanggan yang telah divalidasi
 * @param {string} [params.nomorMeja='04'] - Nomor meja pelanggan
 * @param {string} [params.nomorAntreanAktif=''] - Nomor antrean pesanan aktif
 * @returns {Promise<Object>}
 */
async function generateChatResponse({ message, nomorMeja = '04', nomorAntreanAktif = '' }) {
  const waktuMulai = Date.now();
  const teksAsli = String(message || '').trim();
  const teks = teksAsli.toLowerCase();

  // Ambil data terbaru dari database PostgreSQL via Sequelize Model
  const semuaMenu = await menuModel.findAllFromDb();

  // 1. Cek jika pelanggan mengetik kode nomor antrean spesifik (misal: ANT-102)
  const regexAntrean = /\b(ant-\d+)\b/i;
  const matchAntrean = teksAsli.match(regexAntrean);

  if (matchAntrean) {
    const kodeDicari = matchAntrean[1].toUpperCase();
    const pesananTarget = orderModel.getPesananByNomorAntrean(kodeDicari);
    if (pesananTarget) {
      const rincianItem = pesananTarget.items.map((i) => `${i.qty}x ${i.nama}`).join(', ');
      const replyText = `Status pesanan **${pesananTarget.nomorAntrean}** untuk **Meja ${pesananTarget.nomorMeja}** saat ini adalah **${pesananTarget.status}**. ${pesananTarget.notifikasiTerbaru} (Rincian: ${rincianItem}).`;
      return {
        intent: 'CEK_STATUS_PESANAN',
        inContext: true,
        reply: replyText,
        balasan: replyText,
        subTeks: `Total Pembayaran: ${formatRupiah(pesananTarget.totalHarga)}`,
        pesananTerkait: pesananTarget,
        rekomendasiMenu: [],
        quickReplies: QUICK_REPLIES_STANDAR,
        waktuProsesMs: Date.now() - waktuMulai
      };
    }
  }

  // 2. Deteksi apakah pelanggan menanyakan nama menu spesifik (untuk melacak pencarian menu habis US-02-4)
  const menuCocok = menuModel.cariMenuDariTeks(teks);
  let menuHabisDitanyakan = null;

  if (menuCocok.length > 0) {
    const menuHabis = menuCocok.filter((m) => m.stok === 0);
    if (menuHabis.length > 0 && menuCocok.filter((m) => m.stok > 0).length === 0) {
      menuHabisDitanyakan = menuHabis[0];
      // Catat ke database bahwa menu yang sedang habis ini dicari pelanggan di Chatbot
      menuModel.catatPencarianMenuHabis(menuHabisDitanyakan.id);
    }
  }

  // 3. Panggil Google Gemini API dengan Context Database & System Instruction
  const geminiResult = await requestGeminiCompletion({
    message: teksAsli,
    nomorMeja,
    semuaMenu
  });

  if (geminiResult && geminiResult.reply) {
    // Jika Gemini mendeteksi pertanyaan berada di luar konteks aplikasi
    if (!geminiResult.inContext) {
      return {
        intent: 'OUT_OF_CONTEXT_REFUSAL',
        inContext: false,
        reply: geminiResult.reply,
        balasan: geminiResult.reply,
        subTeks: 'Silakan tanyakan seputar menu makanan, kopi, stok porsi, atau pesanan meja Anda.',
        rekomendasiMenu: [],
        quickReplies: QUICK_REPLIES_STANDAR,
        waktuProsesMs: Date.now() - waktuMulai
      };
    }

    // Jika pertanyaan berada di dalam konteks aplikasi, siapkan kartu menu (vcard) yang relevan
    let kartuRekomendasi = [];
    if (Array.isArray(geminiResult.menuIds) && geminiResult.menuIds.length > 0) {
      kartuRekomendasi = semuaMenu.filter(
        (m) => geminiResult.menuIds.includes(m.id) && m.stok > 0
      );
    }

    if (kartuRekomendasi.length === 0) {
      if (menuHabisDitanyakan) {
        kartuRekomendasi = menuModel.getRekomendasiTerlarisTersedia(3, menuHabisDitanyakan.kategori);
      } else if (menuCocok.length > 0) {
        kartuRekomendasi = menuCocok.filter((m) => m.stok > 0).slice(0, 3);
      } else {
        const pref = cariMenuBerdasarkanPreferensi(teks, semuaMenu);
        kartuRekomendasi = pref.length > 0 ? pref : menuModel.getRekomendasiTerlarisTersedia(3);
      }
    }

    return {
      intent: 'GEMINI_CONTEXT_RESPONSE',
      inContext: true,
      reply: geminiResult.reply,
      balasan: geminiResult.reply,
      subTeks:
        kartuRekomendasi.length > 0
          ? 'Kartu menu rekomendasi yang dapat langsung Anda pesan:'
          : '',
      menuHabisDitanyakan,
      rekomendasiMenu: kartuRekomendasi,
      quickReplies: QUICK_REPLIES_STANDAR,
      waktuProsesMs: Date.now() - waktuMulai
    };
  }

  // 4. Penanganan Error / Fallback Terstruktur jika Layanan Gemini sedang gangguan atau kuota habis
  if (menuHabisDitanyakan) {
    const tigaRekomendasi = menuModel.getRekomendasiTerlarisTersedia(3, menuHabisDitanyakan.kategori);
    const fallbackHabis = `Mohon maaf Kak, **${menuHabisDitanyakan.nama}** saat ini sedang **Habis** (stok 0 porsi). Sebagai gantinya, berikut **3 rekomendasi menu paling laku** kami yang stoknya masih tersedia:`;
    return {
      intent: 'MENU_HABIS_REKOMENDASI',
      inContext: true,
      reply: fallbackHabis,
      balasan: fallbackHabis,
      subTeks: 'Klik tombol "+ Pesan" untuk menambahkan langsung ke pesanan meja Anda:',
      menuHabisDitanyakan,
      rekomendasiMenu: tigaRekomendasi,
      quickReplies: QUICK_REPLIES_STANDAR,
      waktuProsesMs: Date.now() - waktuMulai
    };
  }

  const pref = cariMenuBerdasarkanPreferensi(teks, semuaMenu);
  const kartuFallback = pref.length > 0 ? pref : menuModel.getRekomendasiTerlarisTersedia(3);
  const fallbackReply = `Halo **Meja ${nomorMeja}**, berikut daftar menu pilihan di Toko Kopi Simpanan yang stoknya tersedia dan siap disajikan dari dapur kami:`;

  return {
    intent: 'FALLBACK_CONTEXT_RESPONSE',
    inContext: true,
    reply: fallbackReply,
    balasan: fallbackReply,
    subTeks: 'Pilih menu di bawah untuk langsung memesan dari meja Anda:',
    rekomendasiMenu: kartuFallback,
    quickReplies: QUICK_REPLIES_STANDAR,
    waktuProsesMs: Date.now() - waktuMulai
  };
}

module.exports = {
  generateChatResponse,
  QUICK_REPLIES_STANDAR
};
