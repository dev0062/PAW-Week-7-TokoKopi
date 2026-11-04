/**
 * ============================================================================
 * FILE: utils/aiAgent.js
 * ============================================================================
 * Referensi PRD:
 * - M-04 (Success Metrics): Kecepatan balasan Chatbot saat pelanggan tanya
 *   ketersediaan stok menu < 2 detik.
 * - US-01-2: Menjawab pertanyaan ketersediaan menu dengan menampilkan daftar
 *   menu yang stoknya > 0 secara akurat.
 * - US-01-3: Mendeteksi jika pelanggan menanyakan menu yang stoknya sedang 0
 *   (Habis), memberi tahu bahwa menu tersebut habis, dan otomatis memberikan
 *   3 rekomendasi menu paling laku yang stoknya masih tersedia.
 * - US-02-4: Mencatat setiap kali menu yang sedang habis ditanyakan di Chatbot
 *   agar pemilik tahu bahan baku apa yang perlu ditambah besok.
 * - US-01-5: Menjawab pertanyaan status pesanan pelanggan berdasarkan nomor
 *   antrean atau nomor meja.
 * - Mitigasi Risiko 1: Menyertakan tombol pilihan cepat (Quick Reply) pada
 *   setiap balasan agar pelanggan dapat berinteraksi tanpa mengetik panjang.
 * - AI Powered & Menu Cards: Memanfaatkan Gemini AI untuk memahami selera
 *   pelanggan (rasa manis, creamy, pedas, segar, kopi nendang, camilan, dll)
 *   dan secara cerdas memilih kartu menu (vcard) yang paling tepat untuk langsung dipesan!
 * ============================================================================
 */

const { GoogleGenAI } = require('@google/genai');
const menuModel = require('../models/menuModel');
const orderModel = require('../models/orderModel');
const appConfig = require('../config/appConfig');
const { formatRupiah } = require('./formatter');

const QUICK_REPLIES_STANDAR = [
  { label: 'Menu Tersedia', pesan: 'Menu Tersedia' },
  { label: 'Rekomendasi Terlaris', pesan: 'Rekomendasi menu paling laku' },
  { label: 'Cek Ayam Bakar Madu', pesan: 'Apakah Ayam Bakar Madu masih ada?' },
  { label: 'Status Pesanan Saya', pesan: 'Cek status pesanan meja saya' }
];

let aiClient = null;
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || appConfig.aiConfig.apiKey;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
    } catch (err) {
      console.warn('[AI Agent] Inisialisasi client Gemini gagal:', err.message);
      return null;
    }
  }
  return aiClient;
}

/**
 * Memanggil Gemini AI dengan konteks menu dan stok real-time,
 * serta meminta rekomendasi ID menu yang tepat agar muncul kartu menu (vcard) interaktif.
 */
async function callGeminiChat({ pesan, nomorMeja, contextStokList, pesananMejaAktif }) {
  const client = getAIClient();
  if (!client) return null;

  try {
    const contextStokTeks = contextStokList.map(m => {
      return `[ID: ${m.id}] ${m.nama} | Kategori: ${m.kategori} | Harga: ${formatRupiah(m.harga)} | Stok: ${m.stok} | Deskripsi: ${m.deskripsi} | Kata Kunci: ${Array.isArray(m.kataKunci) ? m.kataKunci.join(', ') : ''}`;
    }).join('\n');

    const prompt = `Anda adalah Barista & Asisten Meja pintar di kafe "Toko Kopi Simpanan" melayani pelanggan di Meja ${nomorMeja}.
Pelanggan bertanya secara bebas lewat chat aplikasi (misal: mencari kopi manis, minuman segar, makanan pedas, menu ramah anak, camilan, dll).

DAFTAR MENU & STOK DAPUR SAAT INI:
${contextStokTeks}

INFORMASI PESANAN AKTIF MEJA ${nomorMeja}:
${pesananMejaAktif || 'Belum ada pesanan aktif'}

TUGAS ANDA:
1. Jawab pertanyaan pelanggan dengan ramah, hangat, dan natural (2-3 kalimat saja).
2. Pilih 1 sampai 3 ID menu dari daftar di atas yang PALING COCOK dengan apa yang ditanyakan pelanggan (hanya pilih menu yang STOK > 0). Jika pelanggan bertanya menu yang stoknya 0, sampaikan bahwa stoknya habis dan pilihkan menu alternatif pengganti yang cocok.
3. Berikan output HANYA berupa JSON valid dengan format:
{
  "jawaban": "Teks ramah untuk pelanggan...",
  "menuIds": [5, 6]
}

Pertanyaan Pelanggan: "${pesan}"`;

    const res = await client.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt
    });

    if (res && res.text) {
      let rawText = res.text.trim();
      // Bersihkan jika ada code block markdown ```json ... ```
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
      }
      try {
        const parsed = JSON.parse(rawText);
        return parsed;
      } catch (parseErr) {
        // Jika model mengembalikan plain text
        return {
          jawaban: rawText,
          menuIds: []
        };
      }
    }
  } catch (error) {
    console.warn('[AI Agent] Gemini call error:', error.message);
  }
  return null;
}

/**
 * Filter menu lokal berdasarkan kata kunci rasa / preferensi jika AI offline
 */
function cariMenuBerdasarkanPreferensi(teks, semuaMenu) {
  const t = teks.toLowerCase();
  const hasil = [];

  for (const m of semuaMenu) {
    if (m.stok <= 0) continue;
    const desc = (m.deskripsi || '').toLowerCase();
    const nama = (m.nama || '').toLowerCase();
    const kat = (m.kategori || '').toLowerCase();

    if (t.includes('manis') && (desc.includes('aren') || desc.includes('karamel') || desc.includes('madu') || desc.includes('manis') || desc.includes('latte'))) {
      hasil.push(m);
    } else if (t.includes('pahit') && (desc.includes('espresso') || desc.includes('black') || desc.includes('v60') || desc.includes('ristretto'))) {
      hasil.push(m);
    } else if (t.includes('segar') && (kat.includes('minuman segar') || desc.includes('jeruk') || desc.includes('berry') || desc.includes('soda') || desc.includes('lemon'))) {
      hasil.push(m);
    } else if (t.includes('pedas') && (desc.includes('sambal') || desc.includes('pedas') || desc.includes('luat') || desc.includes('cabai'))) {
      hasil.push(m);
    } else if ((t.includes('camilan') || t.includes('ngemil') || t.includes('snack')) && kat.includes('kudapan')) {
      hasil.push(m);
    } else if (t.includes('kopi') && kat.includes('kopi')) {
      hasil.push(m);
    }
  }

  return hasil.slice(0, 3);
}

/**
 * Memproses pesan masuk dari pelanggan di meja dan menghasilkan respons terstruktur
 * beserta kartu menu interaktif (vcard) yang dapat langsung dipesan dari dalam Chatbot.
 */
async function prosesPesanPelanggan({ pesan, nomorMeja = '04', nomorAntreanAktif = '' }) {
  const waktuMulai = Date.now();
  const teksAsli = String(pesan || '').trim();
  const teks = teksAsli.toLowerCase();

  const semuaMenu = menuModel.getAllMenu();

  // Cek pesanan aktif meja
  const pesananMejaList = orderModel.getPesananByMeja(nomorMeja);
  let infoPesananAktif = '';
  if (pesananMejaList.length > 0) {
    const p = pesananMejaList[0];
    infoPesananAktif = `Antrean: ${p.nomorAntrean}, Status: ${p.status}, Item: ${p.items.map(i => `${i.qty}x ${i.nama}`).join(', ')}`;
  }

  // 1. Cek secara deterministik jika ada nomor antrean spesifik (ANT-XX)
  const regexAntrean = /\b(ant-\d+)\b/i;
  const matchAntrean = teksAsli.match(regexAntrean);

  if (matchAntrean) {
    const kodeDicari = matchAntrean[1].toUpperCase();
    const pesananTarget = orderModel.getPesananByNomorAntrean(kodeDicari);
    if (pesananTarget) {
      const rincianItem = pesananTarget.items.map((i) => `${i.qty}x ${i.nama}`).join(', ');
      return {
        intent: 'CEK_STATUS_PESANAN',
        balasan: `Status pesanan **${pesananTarget.nomorAntrean}** untuk **Meja ${pesananTarget.nomorMeja}** saat ini: **${pesananTarget.status}**.`,
        subTeks: `${pesananTarget.notifikasiTerbaru} Rincian: ${rincianItem} (Total ${formatRupiah(pesananTarget.totalHarga)}).`,
        pesananTerkait: pesananTarget,
        rekomendasiMenu: [],
        quickReplies: QUICK_REPLIES_STANDAR,
        waktuProsesMs: Date.now() - waktuMulai
      };
    }
  }

  // 2. Deteksi apakah ada menu spesifik yang disebut dalam pertanyaan
  const menuCocok = menuModel.cariMenuDariTeks(teks);
  let menuHabisDitanyakan = null;

  if (menuCocok.length > 0) {
    const menuHabis = menuCocok.filter((m) => m.stok === 0);
    if (menuHabis.length > 0 && menuCocok.filter(m => m.stok > 0).length === 0) {
      menuHabisDitanyakan = menuHabis[0];
      menuModel.catatPencarianMenuHabis(menuHabisDitanyakan.id);
    }
  }

  // 3. Panggil Gemini AI untuk memahami selera pelanggan dan memilih kartu menu (vcard) yang cocok
  const geminiResult = await callGeminiChat({
    pesan: teksAsli,
    nomorMeja,
    contextStokList: semuaMenu,
    pesananMejaAktif: infoPesananAktif
  });

  if (geminiResult && geminiResult.jawaban) {
    let kartuRekomendasi = [];

    // Jika Gemini memberikan daftar ID menu yang cocok
    if (Array.isArray(geminiResult.menuIds) && geminiResult.menuIds.length > 0) {
      kartuRekomendasi = semuaMenu.filter(m => geminiResult.menuIds.includes(m.id) && m.stok > 0);
    }

    // Jika Gemini tidak menyertakan ID atau array kosong, cari via preferensi kata kunci atau menu terlaris
    if (kartuRekomendasi.length === 0) {
      if (menuHabisDitanyakan) {
        kartuRekomendasi = menuModel.getRekomendasiTerlarisTersedia(3, menuHabisDitanyakan.kategori);
      } else if (menuCocok.length > 0) {
        kartuRekomendasi = menuCocok.filter(m => m.stok > 0).slice(0, 3);
      } else {
        const cariPref = cariMenuBerdasarkanPreferensi(teks, semuaMenu);
        kartuRekomendasi = cariPref.length > 0 ? cariPref : menuModel.getRekomendasiTerlarisTersedia(3);
      }
    }

    return {
      intent: 'AI_NATURAL_RESPONSE',
      balasan: geminiResult.jawaban,
      subTeks: kartuRekomendasi.length > 0 ? 'Kartu menu rekomendasi yang bisa langsung dipesan:' : '',
      menuHabisDitanyakan,
      rekomendasiMenu: kartuRekomendasi,
      quickReplies: QUICK_REPLIES_STANDAR,
      waktuProsesMs: Date.now() - waktuMulai
    };
  }

  // 4. Fallback jika Gemini API tidak aktif / limit
  let kartuFallback = [];
  if (menuHabisDitanyakan) {
    kartuFallback = menuModel.getRekomendasiTerlarisTersedia(3, menuHabisDitanyakan.kategori);
    return {
      intent: 'MENU_HABIS_REKOMENDASI',
      balasan: `Mohon maaf, **${menuHabisDitanyakan.nama}** saat ini sedang **Habis** (stok 0 porsi). Agar Anda tidak perlu menunggu lama, berikut **3 rekomendasi menu paling laku** kami yang siap dimasak sekarang:`,
      subTeks: 'Klik tombol "+ Pesan" pada menu di bawah untuk langsung memesan dari meja Anda.',
      menuHabisDitanyakan,
      rekomendasiMenu: kartuFallback,
      quickReplies: QUICK_REPLIES_STANDAR,
      waktuProsesMs: Date.now() - waktuMulai
    };
  }

  const cariPref = cariMenuBerdasarkanPreferensi(teks, semuaMenu);
  kartuFallback = cariPref.length > 0 ? cariPref : menuModel.getRekomendasiTerlarisTersedia(3);

  return {
    intent: 'PANDUAN_ASISTEN',
    balasan: `Halo **Meja ${nomorMeja}**, berikut rekomendasi menu pilihan kami yang cocok dan siap disajikan untuk Anda:`,
    subTeks: 'Klik "+ Pesan" untuk langsung menambahkan ke keranjang meja Anda:',
    rekomendasiMenu: kartuFallback,
    quickReplies: QUICK_REPLIES_STANDAR,
    waktuProsesMs: Date.now() - waktuMulai
  };
}

module.exports = {
  prosesPesanPelanggan,
  QUICK_REPLIES_STANDAR
};
