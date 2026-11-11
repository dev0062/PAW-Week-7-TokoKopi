/**
 * ============================================================================
 * FILE: models/menuModel.js
 * ============================================================================
 * Model Sequelize untuk Tabel `menus` di PostgreSQL (pgAdmin).
 * Sesuai Ketentuan Praktikum:
 * - Seluruh operasi CRUD (GET, POST, PUT, DELETE) melewati Model Sequelize
 *   dan tersimpan di database PostgreSQL.
 * - Controller tidak menulis query database secara langsung.
 * ============================================================================
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const appConfig = require('../config/appConfig');

const KATEGORI_MENU = [
  'Hidangan Utama',
  'Kopi & Espresso',
  'Minuman Segar',
  'Kudapan & Pendamping'
];

// ============================================================================
// 1. DEFINISI MODEL SEQUELIZE (`menus` table di PostgreSQL)
// ============================================================================
const Menu = sequelize.define(
  'Menu',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    nama: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    kategori: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'Hidangan Utama'
    },
    harga: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20000
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gambar: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    stokAwal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20
    },
    stok: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20
    },
    terjualHariIni: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    dicariSaatHabis: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    terakhirDicariHabis: {
      type: DataTypes.STRING(60),
      allowNull: true
    },
    kataKunci: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    }
  },
  {
    tableName: 'menus',
    timestamps: true
  }
);

// ============================================================================
// 2. DATA SEED AWAL (12 Menu Kurasi Beserta Foto HD Unsplash)
// ============================================================================
const initialMenus = [
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
    stok: 4,
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
    stok: 0,
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
    stok: 3,
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
    stok: 0,
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
    stok: 5,
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

let dataMenu = initialMenus.map((m) => ({ ...m }));
let isDbConnected = false;

function perkayaStatusStok(item) {
  const plain = item && typeof item.toJSON === 'function' ? item.toJSON() : { ...item };
  const batas = appConfig.batasStokMenipis;
  const tersedia = plain.stok > 0;
  const stokMenipis = plain.stok > 0 && plain.stok <= batas;

  let labelStok = 'Tersedia';
  if (plain.stok === 0) {
    labelStok = 'Habis';
  } else if (stokMenipis) {
    labelStok = 'Stok Menipis';
  }

  return {
    ...plain,
    tersedia,
    stokMenipis,
    labelStok,
    omzetHariIni: (plain.terjualHariIni || 0) * (plain.harga || 0)
  };
}

/**
 * Inisialisasi & Sinkronisasi Tabel `menus` di PostgreSQL.
 * Jika tabel masih kosong, otomatis di-seed dengan 12 data menu awal.
 */
async function initMenuTable() {
  try {
    await Menu.sync({ alter: true });
    const count = await Menu.count();
    if (count === 0) {
      for (const item of initialMenus) {
        await Menu.create(item);
      }
      // Reset PostgreSQL sequence id agar autoIncrement tidak bentrok dengan ID seed (1..12)
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('menus', 'id'), COALESCE((SELECT MAX(id) FROM menus), 1), true);`);
      console.log('[Sequelize] 12 data awal Menu berhasil di-seed ke tabel PostgreSQL "menus".');
    } else {
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('menus', 'id'), COALESCE((SELECT MAX(id) FROM menus), 1), true);`);
    }
    const rows = await Menu.findAll({ order: [['id', 'ASC']] });
    dataMenu = rows.map((r) => r.toJSON());
    isDbConnected = true;
    console.log(`[Sequelize] Tabel "menus" tersinkronisasi (${dataMenu.length} baris di PostgreSQL).`);
  } catch (err) {
    isDbConnected = false;
    console.warn('[Sequelize] Gagal sinkronisasi tabel "menus":', err.message);
  }
}

async function refreshCacheFromDb() {
  if (!isDbConnected) return;
  try {
    const rows = await Menu.findAll({ order: [['id', 'ASC']] });
    dataMenu = rows.map((r) => r.toJSON());
  } catch (err) {
    console.warn('[Sequelize] Gagal memuat ulang cache menu:', err.message);
  }
}

// ============================================================================
// 3. OPERASI CRUD SEQUELIZE (Dipanggil oleh Controller)
// ============================================================================

/**
 * READ ALL (GET /api/produk atau /api/menu)
 * Mengambil seluruh data menu langsung dari database PostgreSQL via Sequelize.
 */
async function findAllFromDb() {
  if (isDbConnected) {
    const rows = await Menu.findAll({ order: [['id', 'ASC']] });
    dataMenu = rows.map((r) => r.toJSON());
  }
  return dataMenu.map(perkayaStatusStok);
}

/**
 * READ BY ID (GET /api/produk/:id atau /api/menu/:id)
 * Mengambil detail satu data menu berdasarkan ID dari database PostgreSQL.
 */
async function findByIdFromDb(id) {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;

  if (isDbConnected) {
    const row = await Menu.findByPk(numId);
    if (!row) return null;
    return perkayaStatusStok(row.toJSON());
  }

  const found = dataMenu.find((m) => m.id === numId);
  return found ? perkayaStatusStok(found) : null;
}

/**
 * CREATE (POST /api/produk atau /api/stok/tambah)
 * Menambahkan data menu/produk baru ke dalam database PostgreSQL via Sequelize.
 */
async function createInDb({ nama, kategori, harga, deskripsi, stokAwal, stok, gambar }) {
  const kuota = Math.max(0, Math.floor(Number(stok !== undefined ? stok : stokAwal) || 20));
  const hargaValid = Math.max(1000, Math.floor(Number(harga) || 20000));
  const kategoriValid = KATEGORI_MENU.includes(kategori) ? kategori : KATEGORI_MENU[0];
  const namaBersih = String(nama || 'Menu Baru').trim();
  const deskripsiBersih = String(deskripsi || 'Disajikan hangat langsung dari dapur.').trim();
  const gambarValid =
    gambar && String(gambar).trim().length > 5
      ? String(gambar).trim()
      : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
  const kataKunci = namaBersih
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (isDbConnected) {
    const maxIdRow = await Menu.max('id');
    const nextNum = (Number(maxIdRow) || 0) + 1;
    const kode = `MN-${String(nextNum).padStart(2, '0')}`;

    const created = await Menu.create({
      kode,
      nama: namaBersih,
      kategori: kategoriValid,
      harga: hargaValid,
      deskripsi: deskripsiBersih,
      gambar: gambarValid,
      stokAwal: kuota,
      stok: kuota,
      terjualHariIni: 0,
      dicariSaatHabis: 0,
      terakhirDicariHabis: null,
      kataKunci
    });

    await refreshCacheFromDb();
    return perkayaStatusStok(created.toJSON());
  }

  // Fallback jika DB belum nyala
  const idBaru = dataMenu.length > 0 ? Math.max(...dataMenu.map((m) => m.id)) + 1 : 1;
  const itemBaru = {
    id: idBaru,
    kode: `MN-${String(idBaru).padStart(2, '0')}`,
    nama: namaBersih,
    kategori: kategoriValid,
    harga: hargaValid,
    deskripsi: deskripsiBersih,
    gambar: gambarValid,
    stokAwal: kuota,
    stok: kuota,
    terjualHariIni: 0,
    dicariSaatHabis: 0,
    terakhirDicariHabis: null,
    kataKunci
  };
  dataMenu.push(itemBaru);
  return perkayaStatusStok(itemBaru);
}

/**
 * UPDATE (PUT /api/produk/:id)
 * Memperbarui data menu berdasarkan ID di database PostgreSQL via Sequelize.
 */
async function updateInDb(id, payload = {}) {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;

  if (isDbConnected) {
    const row = await Menu.findByPk(numId);
    if (!row) return null;

    if (payload.nama !== undefined && String(payload.nama).trim() !== '') {
      row.nama = String(payload.nama).trim();
      row.kataKunci = row.nama
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
    }
    if (payload.kategori !== undefined && KATEGORI_MENU.includes(payload.kategori)) {
      row.kategori = payload.kategori;
    }
    if (payload.harga !== undefined && !Number.isNaN(Number(payload.harga))) {
      row.harga = Math.max(1000, Math.floor(Number(payload.harga)));
    }
    if (payload.deskripsi !== undefined) {
      row.deskripsi = String(payload.deskripsi).trim();
    }
    if (payload.gambar !== undefined && String(payload.gambar).trim() !== '') {
      row.gambar = String(payload.gambar).trim();
    }
    if (payload.stok !== undefined && !Number.isNaN(Number(payload.stok))) {
      const angkaStok = Math.max(0, Math.floor(Number(payload.stok)));
      row.stok = angkaStok;
      if (angkaStok > row.stokAwal) {
        row.stokAwal = angkaStok;
      }
    }
    if (payload.stokAwal !== undefined && !Number.isNaN(Number(payload.stokAwal))) {
      row.stokAwal = Math.max(0, Math.floor(Number(payload.stokAwal)));
    }

    await row.save();
    await refreshCacheFromDb();
    return perkayaStatusStok(row.toJSON());
  }

  const target = dataMenu.find((m) => m.id === numId);
  if (!target) return null;

  if (payload.nama !== undefined && String(payload.nama).trim() !== '') {
    target.nama = String(payload.nama).trim();
  }
  if (payload.kategori !== undefined && KATEGORI_MENU.includes(payload.kategori)) {
    target.kategori = payload.kategori;
  }
  if (payload.harga !== undefined && !Number.isNaN(Number(payload.harga))) {
    target.harga = Math.max(1000, Math.floor(Number(payload.harga)));
  }
  if (payload.deskripsi !== undefined) {
    target.deskripsi = String(payload.deskripsi).trim();
  }
  if (payload.gambar !== undefined && String(payload.gambar).trim() !== '') {
    target.gambar = String(payload.gambar).trim();
  }
  if (payload.stok !== undefined && !Number.isNaN(Number(payload.stok))) {
    const angkaStok = Math.max(0, Math.floor(Number(payload.stok)));
    target.stok = angkaStok;
    if (angkaStok > target.stokAwal) target.stokAwal = angkaStok;
  }
  return perkayaStatusStok(target);
}

/**
 * DELETE (DELETE /api/produk/:id)
 * Menghapus data menu berdasarkan ID dari database PostgreSQL via Sequelize.
 */
async function deleteFromDb(id) {
  const numId = Number(id);
  if (Number.isNaN(numId)) return null;

  if (isDbConnected) {
    const row = await Menu.findByPk(numId);
    if (!row) return null;
    const deletedData = perkayaStatusStok(row.toJSON());
    await row.destroy();
    await refreshCacheFromDb();
    return deletedData;
  }

  const idx = dataMenu.findIndex((m) => m.id === numId);
  if (idx === -1) return null;
  const [removed] = dataMenu.splice(idx, 1);
  return perkayaStatusStok(removed);
}

// ============================================================================
// 4. HELPER SINKRON & OPERASIONAL (Kompatibel dengan seluruh fitur PRD)
// ============================================================================

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
    if (isDbConnected) {
      Menu.update(
        {
          dicariSaatHabis: target.dicariSaatHabis,
          terakhirDicariHabis: target.terakhirDicariHabis
        },
        { where: { id: target.id } }
      ).catch(() => {});
    }
  }
}

function cariMenuDariTeks(kalimat) {
  if (!kalimat) return [];
  const teks = kalimat.toLowerCase();

  return dataMenu
    .filter((item) => {
      const namaCocok = teks.includes(item.nama.toLowerCase());
      const kwList = Array.isArray(item.kataKunci) ? item.kataKunci : [];
      const kataKunciCocok = kwList.some((kw) => teks.includes(kw));
      return namaCocok || kataKunciCocok;
    })
    .map(perkayaStatusStok);
}

async function toggleStatusHabis(menuId, paksaHabis = null) {
  const target = dataMenu.find((m) => m.id === Number(menuId));
  if (!target) return null;

  const jadikanHabis = paksaHabis !== null ? Boolean(paksaHabis) : target.stok > 0;
  const stokBaru = jadikanHabis ? 0 : target.stokAwal > 0 ? Math.min(15, target.stokAwal) : 15;

  return updateInDb(menuId, { stok: stokBaru });
}

async function updateKuotaStok(menuId, jumlahStokBaru) {
  const angka = Math.max(0, Math.floor(Number(jumlahStokBaru) || 0));
  return updateInDb(menuId, { stok: angka });
}

async function tambahMenuBaru(payload) {
  return createInDb(payload);
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
      catatPencarianMenuHabis(target.id);
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

    if (isDbConnected) {
      Menu.update(
        { stok: target.stok, terjualHariIni: target.terjualHariIni },
        { where: { id: target.id } }
      ).catch(() => {});
    }

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
  Menu,
  initMenuTable,
  isDatabaseConnected: () => isDbConnected,
  // CRUD Sequelize Functions
  findAllFromDb,
  findByIdFromDb,
  createInDb,
  updateInDb,
  deleteFromDb,
  // Helper & Operational Functions
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
