/**
 * ============================================================================
 * FILE: models/orderModel.js
 * ============================================================================
 * Referensi PRD:
 * - US-01-4 & F-01: Menyimpan pesanan mandiri pelanggan dari meja/Chatbot,
 *   memberikan nomor antrean pesanan, dan meneruskannya ke layar dapur.
 * - US-01-5 & F-05: Menyediakan pembaruan status pesanan ("Sedang Diproses" /
 *   "Siap Diantar") secara real-time ke jendela Chatbot pelanggan.
 * - US-03-3 & F-03: Menampilkan daftar pesanan pelanggan otomatis di layar dapur
 *   lengkap dengan detail menu, jumlah porsi, dan nomor meja.
 * - US-03-4 & F-03: Mengurutkan daftar pesanan masuk berdasarkan waktu pemesanan
 *   paling awal di posisi paling atas (First-In, First-Out / FIFO).
 * - US-03-5 & F-03: Memindahkan pesanan ke riwayat selesai saat staf menekan
 *   tombol "Pesanan Selesai" dan mengirim pesan pemberitahuan ke HP pelanggan.
 * - Mitigasi Risiko 3: Konfirmasi nomor meja oleh staf pada pesanan masuk.
 * ============================================================================
 */

const menuModel = require('./menuModel');

let urutanAntreanCounter = 104;

// Data awal antrean dapur agar staf & pemilik langsung dapat menguji alur US-03-3, US-03-4, US-03-5
const daftarPesanan = [
  {
    id: 1,
    nomorAntrean: 'ANT-101',
    nomorMeja: '02',
    namaPelanggan: 'Pelanggan Meja 02',
    sumberPesan: 'Chatbot Meja',
    items: [
      {
        menuId: 1,
        kode: 'MN-01',
        nama: 'Nasi Goreng Sei Sapi Asap',
        harga: 38000,
        qty: 2,
        subtotal: 76000
      },
      {
        menuId: 5,
        kode: 'MN-05',
        nama: 'Es Kopi Susu Aren Signature',
        harga: 24000,
        qty: 2,
        subtotal: 48000
      }
    ],
    catatan: 'Satu porsi nasi goreng tidak pedas.',
    totalPorsi: 4,
    totalHarga: 124000,
    status: 'Siap Diantar',
    terkonfirmasiMeja: true,
    waktuPesan: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    waktuUpdate: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    notifikasiTerbaru: 'Pesanan ANT-101 (Meja 02) sudah selesai dimasak dan siap diantar ke meja Anda.'
  },
  {
    id: 2,
    nomorAntrean: 'ANT-102',
    nomorMeja: '07',
    namaPelanggan: 'Evan Vijaya Putra',
    sumberPesan: 'Chatbot Meja',
    items: [
      {
        menuId: 2,
        kode: 'MN-02',
        nama: 'Mie Ayam Truffle Jamur',
        harga: 34000,
        qty: 1,
        subtotal: 34000
      },
      {
        menuId: 6,
        kode: 'MN-06',
        nama: 'Ice Caramel Sea Salt Latte',
        harga: 28000,
        qty: 1,
        subtotal: 28000
      }
    ],
    catatan: 'Kuah dipisah, es sedikit.',
    totalPorsi: 2,
    totalHarga: 62000,
    status: 'Sedang Diproses',
    terkonfirmasiMeja: true,
    waktuPesan: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    waktuUpdate: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    notifikasiTerbaru: 'Pesanan ANT-102 (Meja 07) sedang dimasak oleh staf dapur kami.'
  },
  {
    id: 3,
    nomorAntrean: 'ANT-103',
    nomorMeja: '11',
    namaPelanggan: 'Pelanggan Meja 11',
    sumberPesan: 'Chatbot Meja',
    items: [
      {
        menuId: 4,
        kode: 'MN-04',
        nama: 'Rice Bowl Chicken Katsu Curry',
        harga: 33000,
        qty: 2,
        subtotal: 66000
      },
      {
        menuId: 9,
        kode: 'MN-09',
        nama: 'Lychee Yakult Sparkler',
        harga: 25000,
        qty: 2,
        subtotal: 50000
      },
      {
        menuId: 10,
        kode: 'MN-10',
        nama: 'Crispy Truffle Parmesan Fries',
        harga: 26000,
        qty: 1,
        subtotal: 26000
      }
    ],
    catatan: 'Saus kari tuang langsung.',
    totalPorsi: 5,
    totalHarga: 142000,
    status: 'Menunggu Konfirmasi',
    terkonfirmasiMeja: false,
    waktuPesan: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    waktuUpdate: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    notifikasiTerbaru: 'Pesanan ANT-103 diterima di layar dapur untuk Meja 11 dan menunggu giliran masak.'
  }
];

/**
 * US-01-4 & Mitigasi Risiko 2 & 3:
 * Membuat pesanan baru dari meja pelanggan, memvalidasi nomor meja,
 * mengurangi stok menu secara otomatis, dan meneruskan ke layar antrean dapur.
 * @param {Object} payload
 * @returns {{sukses: boolean, pesanan?: Object, pesanError?: string, rekomendasiPengganti?: Array<Object>}}
 */
function buatPesananBaru({
  nomorMeja,
  namaPelanggan,
  items,
  catatan = '',
  sumberPesan = 'Chatbot Meja'
}) {
  // Mitigasi Risiko 3: Validasi nomor meja wajib diisi (1 s/d 20)
  const mejaBersih = String(nomorMeja || '').trim().padStart(2, '0');
  const angkaMeja = Number(mejaBersih);
  if (!angkaMeja || angkaMeja < 1 || angkaMeja > 50) {
    return {
      sukses: false,
      pesanError: 'Nomor meja tidak valid. Pastikan Anda memilih nomor meja tempat Anda duduk saat ini.'
    };
  }

  // Mitigasi Risiko 2 & US-03-2: Validasi dan kurangi stok secara otomatis
  const hasilStok = menuModel.validasiDanKurangiStok(items);
  if (!hasilStok.sukses) {
    const rekomendasiPengganti = menuModel.getRekomendasiTerlarisTersedia(3);
    return {
      sukses: false,
      pesanError: hasilStok.pesanError,
      rekomendasiPengganti
    };
  }

  const detailItem = hasilStok.detailItem;
  const totalPorsi = detailItem.reduce((acc, cur) => acc + cur.qty, 0);
  const totalHarga = detailItem.reduce((acc, cur) => acc + cur.subtotal, 0);

  const kodeAntrean = `ANT-${urutanAntreanCounter++}`;
  const sekarangISO = new Date().toISOString();

  const pesananBaru = {
    id: daftarPesanan.length + 1,
    nomorAntrean: kodeAntrean,
    nomorMeja: mejaBersih,
    namaPelanggan: String(namaPelanggan || `Pelanggan Meja ${mejaBersih}`).trim(),
    sumberPesan,
    items: detailItem,
    catatan: String(catatan || '-').trim(),
    totalPorsi,
    totalHarga,
    status: 'Menunggu Konfirmasi',
    terkonfirmasiMeja: false,
    waktuPesan: sekarangISO,
    waktuUpdate: sekarangISO,
    notifikasiTerbaru: `Pesanan ${kodeAntrean} berhasil diteruskan ke dapur untuk Meja ${mejaBersih}.`
  };

  daftarPesanan.push(pesananBaru);
  return { sukses: true, pesanan: pesananBaru };
}

/**
 * US-03-3 & US-03-4:
 * Mengambil daftar antrean pesanan yang belum selesai ("Menunggu Konfirmasi" & "Sedang Diproses"),
 * diurutkan dari waktu masuk paling awal di posisi paling atas (FIFO).
 * @returns {Array<Object>}
 */
function getAntreanAktifFIFO() {
  return daftarPesanan
    .filter((p) => p.status !== 'Siap Diantar')
    .sort((a, b) => new Date(a.waktuPesan).getTime() - new Date(b.waktuPesan).getTime());
}

/**
 * US-03-5:
 * Mengambil daftar pesanan yang telah selesai dimasak ("Siap Diantar"),
 * diurutkan dari yang paling baru selesai.
 * @returns {Array<Object>}
 */
function getRiwayatPesananSelesai() {
  return daftarPesanan
    .filter((p) => p.status === 'Siap Diantar')
    .sort((a, b) => new Date(b.waktuUpdate).getTime() - new Date(a.waktuUpdate).getTime());
}

/**
 * Mengambil seluruh pesanan untuk kalkulasi metrik laporan harian pemilik.
 * @returns {Array<Object>}
 */
function getAllPesanan() {
  return [...daftarPesanan];
}

/**
 * US-01-5:
 * Mencari detail pesanan berdasarkan nomor antrean untuk pembaruan status real-time di Chatbot.
 * @param {string} nomorAntrean
 * @returns {Object|null}
 */
function getPesananByNomorAntrean(nomorAntrean) {
  if (!nomorAntrean) return null;
  const targetKode = String(nomorAntrean).trim().toUpperCase();
  return daftarPesanan.find((p) => p.nomorAntrean.toUpperCase() === targetKode) || null;
}

/**
 * Mengambil daftar pesanan milik nomor meja tertentu (US-01-1 & US-01-5).
 * @param {string} nomorMeja
 * @returns {Array<Object>}
 */
function getPesananByMeja(nomorMeja) {
  const mejaBersih = String(nomorMeja || '').trim().padStart(2, '0');
  return daftarPesanan
    .filter((p) => p.nomorMeja === mejaBersih)
    .sort((a, b) => new Date(b.waktuPesan).getTime() - new Date(a.waktuPesan).getTime());
}

/**
 * US-01-5, US-03-5 & Mitigasi Risiko 3:
 * Staf dapur memperbarui status pesanan ("Sedang Diproses" atau "Siap Diantar")
 * serta memverifikasi nomor meja. Perubahan ini otomatis menghasilkan pesan notifikasi
 * yang dibaca oleh Chatbot pelanggan secara real-time.
 * @param {string} nomorAntrean
 * @param {string} statusBaru
 * @returns {Object|null}
 */
function updateStatusPesanan(nomorAntrean, statusBaru) {
  const pesanan = getPesananByNomorAntrean(nomorAntrean);
  if (!pesanan) return null;

  const statusValid = ['Menunggu Konfirmasi', 'Sedang Diproses', 'Siap Diantar'];
  if (!statusValid.includes(statusBaru)) return null;

  pesanan.status = statusBaru;
  pesanan.terkonfirmasiMeja = true;
  pesanan.waktuUpdate = new Date().toISOString();

  if (statusBaru === 'Sedang Diproses') {
    pesanan.notifikasiTerbaru = `Pembaruan Dapur: Pesanan ${pesanan.nomorAntrean} (Meja ${pesanan.nomorMeja}) telah dikonfirmasi staf dan sedang dimasak.`;
  } else if (statusBaru === 'Siap Diantar') {
    pesanan.notifikasiTerbaru = `Pesanan Siap: Pesanan ${pesanan.nomorAntrean} (Meja ${pesanan.nomorMeja}) sudah selesai dimasak dan sedang diantar ke meja Anda.`;
  }

  return pesanan;
}

module.exports = {
  buatPesananBaru,
  getAntreanAktifFIFO,
  getRiwayatPesananSelesai,
  getAllPesanan,
  getPesananByNomorAntrean,
  getPesananByMeja,
  updateStatusPesanan
};
