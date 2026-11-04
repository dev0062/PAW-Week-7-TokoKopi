/**
 * ============================================================================
 * FILE: models/menuModel.js
 * ============================================================================
 * Referensi PRD:
 * - Problem Statement & Goal 1: Menyediakan informasi ketersediaan stok menu
 *   secara langsung dan akurat untuk mencegah pelanggan batal memesan di jam ramai.
 * - US-01-2: Menampilkan daftar menu yang stoknya > 0 secara akurat.
 * - US-01-3: Mendeteksi menu yang stoknya 0 (Habis) dan memberikan 3 rekomendasi
 *   menu paling laku yang stoknya masih tersedia.
 * - US-02-1 & F-04: Rekap otomatis peringkat menu paling laku berdasarkan porsi terjual.
 * - US-02-2 & F-04: Pemantauan sisa stok/bahan baku secara langsung (real-time).
 * - US-02-3 & F-05: Peringatan otomatis "Stok Menipis" jika sisa stok <= 5 porsi.
 * - US-02-4: Melacak riwayat menu yang paling sering dicari di Chatbot saat habis.
 * - US-03-1 & F-02: Mengubah status menu menjadi "Habis" dalam satu klik oleh staf.
 * - US-03-2 & F-02: Input kuota porsi stok awal oleh staf & pengurangan otomatis.
 * ============================================================================
 */

const appConfig = require('../config/appConfig');

const KATEGORI_MENU = [
  'Hidangan Utama',
  'Kopi & Espresso',
  'Minuman Segar',
  'Kudapan & Pendamping'
];

// Data operasional menu restoran/kafe Devtech dengan Foto Kuliner Berkualitas Tinggi (Unsplash Curated)
const dataMenu = [
  {
    id: 1,
    kode: 'MN-01',
    nama: 'Nasi Goreng Sei Sapi Asap',
    kategori: 'Hidangan Utama',
    harga: 38000,
    deskripsi: 'Nasi goreng rempah dengan irisan daging sei sapi asap, sambal luat, dan telur mata sapi.',
    gambar: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    stokAwal: 45,
    stok: 18,
    terjualHariIni: 27,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['nasi goreng', 'sei sapi', 'nasgor', 'sapi asap', 'nasi']
  },
  {
    id: 2,
    kode: 'MN-02',
    nama: 'Mie Ayam Truffle Jamur',
    kategori: 'Hidangan Utama',
    harga: 34000,
    deskripsi: 'Mie keriting kenyal buatan sendiri dengan topping ayam cincang jamur shiitake dan minyak truffle.',
    gambar: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    stokAwal: 35,
    stok: 4, // US-02-3: <= 5 porsi -> otomatis memicu label "Stok Menipis"
    terjualHariIni: 31,
    dicariSaatHabis: 1,
    terakhirDicariHabis: '2026-10-15T12:40:00.000Z',
    kataKunci: ['mie ayam', 'truffle', 'mie jamur', 'mie', 'bakmi']
  },
  {
    id: 3,
    kode: 'MN-03',
    nama: 'Ayam Bakar Madu Rempah',
    kategori: 'Hidangan Utama',
    harga: 36000,
    deskripsi: 'Paha ayam panggang bumbu madu karamel disajikan bersama nasi hangat, lalapan, dan sambal korek.',
    gambar: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
    stokAwal: 30,
    stok: 0, // US-01-3 & US-03-1: Stok 0 (Habis) untuk rekomendasi pengganti
    terjualHariIni: 30,
    dicariSaatHabis: 9,
    terakhirDicariHabis: '2026-10-15T13:15:00.000Z',
    kataKunci: ['ayam bakar', 'ayam madu', 'ayam', 'bakar madu']
  },
  {
    id: 4,
    kode: 'MN-04',
    nama: 'Rice Bowl Chicken Katsu Curry',
    kategori: 'Hidangan Utama',
    harga: 33000,
    deskripsi: 'Nasi Jepang hangat dengan fillet ayam katsu renyah dan siraman saus kari kental gurih.',
    gambar: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    stokAwal: 40,
    stok: 16,
    terjualHariIni: 24,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['rice bowl', 'chicken katsu', 'katsu', 'curry', 'kari']
  },
  {
    id: 5,
    kode: 'MN-05',
    nama: 'Es Kopi Susu Aren Signature',
    kategori: 'Kopi & Espresso',
    harga: 24000,
    deskripsi: 'Double ristretto Arabika Gayo berpadu dengan susu segar dingin dan gula aren organik.',
    gambar: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    stokAwal: 60,
    stok: 22,
    terjualHariIni: 38,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['kopi susu', 'gula aren', 'kopi aren', 'es kopi', 'signature']
  },
  {
    id: 6,
    kode: 'MN-06',
    nama: 'Ice Caramel Sea Salt Latte',
    kategori: 'Kopi & Espresso',
    harga: 28000,
    deskripsi: 'Espresso house blend dengan susu creamy, saus karamel panggang, dan sentuhan sea salt foam.',
    gambar: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80',
    stokAwal: 35,
    stok: 3, // US-02-3: <= 5 porsi -> memicu peringatan "Stok Menipis"
    terjualHariIni: 32,
    dicariSaatHabis: 2,
    terakhirDicariHabis: '2026-10-15T13:05:00.000Z',
    kataKunci: ['caramel latte', 'sea salt', 'latte', 'karamel']
  },
  {
    id: 7,
    kode: 'MN-07',
    nama: 'Manual Brew V60 Kamojang',
    kategori: 'Kopi & Espresso',
    harga: 29000,
    deskripsi: 'Seduhan kopi filter manual single origin Garut Kamojang dengan profil citrus dan teh hitam.',
    gambar: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    stokAwal: 20,
    stok: 9,
    terjualHariIni: 11,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['v60', 'manual brew', 'kamojang', 'kopi hitam', 'filter']
  },
  {
    id: 8,
    kode: 'MN-08',
    nama: 'Uji Matcha Cream Cold Foam',
    kategori: 'Minuman Segar',
    harga: 27000,
    deskripsi: 'Matcha Jepang murni yang dikocok dingin dengan susu segar dan lapisan krim lembut di atasnya.',
    gambar: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    stokAwal: 30,
    stok: 0, // US-01-3 & US-02-4: Stok 0 (Habis)
    terjualHariIni: 30,
    dicariSaatHabis: 6,
    terakhirDicariHabis: '2026-10-15T13:22:00.000Z',
    kataKunci: ['matcha', 'uji matcha', 'green tea', 'teh hijau']
  },
  {
    id: 9,
    kode: 'MN-09',
    nama: 'Lychee Yakult Sparkler',
    kategori: 'Minuman Segar',
    harga: 25000,
    deskripsi: 'Minuman segar berkarbonasi ringan dengan buah leci utuh, probiotik yakult, dan daun mint.',
    gambar: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    stokAwal: 35,
    stok: 14,
    terjualHariIni: 21,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['lychee', 'leci', 'yakult', 'sparkler', 'segar']
  },
  {
    id: 10,
    kode: 'MN-10',
    nama: 'Crispy Truffle Parmesan Fries',
    kategori: 'Kudapan & Pendamping',
    harga: 26000,
    deskripsi: 'Kentang goreng potongan tebal dengan taburan keju parmesan parut, peterseli, dan saus bawang putih.',
    gambar: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    stokAwal: 40,
    stok: 15,
    terjualHariIni: 25,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['kentang', 'fries', 'truffle fries', 'kentang goreng', 'parmesan']
  },
  {
    id: 11,
    kode: 'MN-11',
    nama: 'Tahu Walik Sambal Petis',
    kategori: 'Kudapan & Pendamping',
    harga: 22000,
    deskripsi: 'Tahu goreng balik renyah isi adonan ayam udang gurih disajikan dengan cocolan sambal kecap petis.',
    gambar: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    stokAwal: 30,
    stok: 5, // US-02-3: Tepat di batas <= 5 porsi -> memicu label "Stok Menipis"
    terjualHariIni: 25,
    dicariSaatHabis: 3,
    terakhirDicariHabis: '2026-10-15T11:50:00.000Z',
    kataKunci: ['tahu', 'tahu walik', 'camilan', 'gorengan', 'petis']
  },
  {
    id: 12,
    kode: 'MN-12',
    nama: 'Croissant Butter Almond Panggang',
    kategori: 'Kudapan & Pendamping',
    harga: 25000,
    deskripsi: 'Pastry berlapis mentega dengan isian krim kacang almond manis dan taburan irisan almond panggang.',
    gambar: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    stokAwal: 25,
    stok: 11,
    terjualHariIni: 14,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: ['croissant', 'almond', 'pastry', 'roti']
  }
];

function perkayaStatusStok(item) {
  const batas = appConfig.batasStokMenipis;
  const tersedia = item.stok > 0;
  const stokMenipis = item.stok > 0 && item.stok <= batas;

  let labelStok = 'Tersedia';
  if (item.stok === 0) {
    labelStok = 'Habis';
  } else if (stokMenipis) {
    labelStok = 'Stok Menipis';
  }

  return {
    ...item,
    tersedia,
    stokMenipis,
    labelStok,
    omzetHariIni: item.terjualHariIni * item.harga
  };
}

function getAllMenu() {
  return dataMenu.map(perkayaStatusStok);
}

function getKategoriList() {
  return [...KATEGORI_MENU];
}

function getMenuTersedia() {
  return dataMenu.filter((m) => m.stok > 0).map(perkayaStatusStok);
}

function getMenuById(id) {
  const found = dataMenu.find((m) => m.id === Number(id));
  return found ? perkayaStatusStok(found) : null;
}

function getRekomendasiTerlarisTersedia(limit = 3, kategoriPreferensi = null) {
  const tersedia = dataMenu.filter((m) => m.stok > 0);

  const terurut = [...tersedia].sort((a, b) => {
    if (kategoriPreferensi) {
      const aSama = a.kategori === kategoriPreferensi ? 1 : 0;
      const bSama = b.kategori === kategoriPreferensi ? 1 : 0;
      if (aSama !== bSama) return bSama - aSama;
    }
    return b.terjualHariIni - a.terjualHariIni;
  });

  return terurut.slice(0, limit).map(perkayaStatusStok);
}

function getPeringkatMenuTerlaris() {
  return [...dataMenu]
    .sort((a, b) => b.terjualHariIni - a.terjualHariIni || a.id - b.id)
    .map((item, idx) => ({
      ...perkayaStatusStok(item),
      peringkat: idx + 1
    }));
}

function getMenuPerluPerhatianStok() {
  const batas = appConfig.batasStokMenipis;
  return dataMenu
    .filter((m) => m.stok <= batas)
    .sort((a, b) => a.stok - b.stok)
    .map(perkayaStatusStok);
}

function getRiwayatMenuDicariSaatHabis() {
  return dataMenu
    .filter((m) => m.dicariSaatHabis > 0 || m.stok === 0)
    .sort((a, b) => b.dicariSaatHabis - a.dicariSaatHabis)
    .map(perkayaStatusStok);
}

function catatPencarianMenuHabis(menuId) {
  const target = dataMenu.find((m) => m.id === Number(menuId));
  if (target) {
    target.dicariSaatHabis += 1;
    target.terakhirDicariHabis = new Date().toISOString();
  }
}

function cariMenuDariTeks(kalimat) {
  if (!kalimat) return [];
  const teks = kalimat.toLowerCase();

  return dataMenu
    .filter((item) => {
      const namaCocok = teks.includes(item.nama.toLowerCase());
      const kataKunciCocok = item.kataKunci.some((kw) => teks.includes(kw));
      return namaCocok || kataKunciCocok;
    })
    .map(perkayaStatusStok);
}

function toggleStatusHabis(menuId, paksaHabis = null) {
  const target = dataMenu.find((m) => m.id === Number(menuId));
  if (!target) return null;

  const jadikanHabis = paksaHabis !== null ? Boolean(paksaHabis) : target.stok > 0;

  if (jadikanHabis) {
    target.stok = 0;
  } else {
    target.stok = target.stokAwal > 0 ? Math.min(15, target.stokAwal) : 15;
  }

  return perkayaStatusStok(target);
}

function updateKuotaStok(menuId, jumlahStokBaru) {
  const target = dataMenu.find((m) => m.id === Number(menuId));
  if (!target) return null;

  const angka = Math.max(0, Math.floor(Number(jumlahStokBaru) || 0));
  target.stok = angka;
  if (angka > target.stokAwal) {
    target.stokAwal = angka;
  }

  return perkayaStatusStok(target);
}

function tambahMenuBaru({ nama, kategori, harga, deskripsi, stokAwal, gambar }) {
  const idBaru = dataMenu.length > 0 ? Math.max(...dataMenu.map((m) => m.id)) + 1 : 1;
  const kuota = Math.max(0, Math.floor(Number(stokAwal) || 20));
  const hargaValid = Math.max(1000, Math.floor(Number(harga) || 20000));
  const kategoriValid = KATEGORI_MENU.includes(kategori) ? kategori : KATEGORI_MENU[0];

  const itemBaru = {
    id: idBaru,
    kode: `MN-${String(idBaru).padStart(2, '0')}`,
    nama: String(nama).trim(),
    kategori: kategoriValid,
    harga: hargaValid,
    deskripsi: String(deskripsi || 'Disajikan hangat langsung dari dapur Devtech.').trim(),
    gambar: gambar || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    stokAwal: kuota,
    stok: kuota,
    terjualHariIni: 0,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci: String(nama)
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  };

  dataMenu.push(itemBaru);
  return perkayaStatusStok(itemBaru);
}

function validasiDanKurangiStok(daftarItemPesanan) {
  if (!Array.isArray(daftarItemPesanan) || daftarItemPesanan.length === 0) {
    return { sukses: false, pesanError: 'Daftar pesanan tidak boleh kosong.' };
  }

  for (const reqItem of daftarItemPesanan) {
    const target = dataMenu.find((m) => m.id === Number(reqItem.menuId));
    const qty = Math.floor(Number(reqItem.qty) || 0);

    if (!target || qty <= 0) {
      return { sukses: false, pesanError: 'Terdapat pilihan menu atau jumlah porsi yang tidak valid.' };
    }

    if (target.stok === 0) {
      target.dicariSaatHabis += 1;
      target.terakhirDicariHabis = new Date().toISOString();
      return {
        sukses: false,
        menuHabisId: target.id,
        pesanError: `Mohon maaf, stok untuk "${target.nama}" baru saja habis.`
      };
    }

    if (target.stok < qty) {
      return {
        sukses: false,
        pesanError: `Sisa stok "${target.nama}" saat ini hanya ${target.stok} porsi (Anda memilih ${qty} porsi).`
      };
    }
  }

  const hasilItem = [];
  for (const reqItem of daftarItemPesanan) {
    const target = dataMenu.find((m) => m.id === Number(reqItem.menuId));
    const qty = Math.floor(Number(reqItem.qty));

    target.stok -= qty;
    target.terjualHariIni += qty;

    hasilItem.push({
      menuId: target.id,
      kode: target.kode,
      nama: target.nama,
      harga: target.harga,
      gambar: target.gambar,
      qty,
      subtotal: target.harga * qty,
      sisaStokSekarang: target.stok
    });
  }

  return { sukses: true, detailItem: hasilItem };
}

module.exports = {
  getAllMenu,
  getKategoriList,
  getMenuTersedia,
  getMenuById,
  getRekomendasiTerlarisTersedia,
  getPeringkatMenuTerlaris,
  getMenuPerluPerhatianStok,
  getRiwayatMenuDicariSaatHabis,
  catatPencarianMenuHabis,
  cariMenuDariTeks,
  toggleStatusHabis,
  updateKuotaStok,
  tambahMenuBaru,
  validasiDanKurangiStok
};
