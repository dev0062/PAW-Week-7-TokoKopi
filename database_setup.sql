-- ============================================================================
-- SCRIPT DATABASE POSTGRESQL (PGADMIN)
-- NAMA DATABASE : devtech_db
-- ============================================================================

-- 1. BUAT DATABASE (Jalankan query ini di database bawaan 'postgres')
CREATE DATABASE devtech_db;

-- ============================================================================
-- CATATAN:
-- Setelah database 'devtech_db' dibuat, BUKA Query Tool di dalam 'devtech_db'
-- lalu jalankan seluruh script di bawah ini:
-- ============================================================================

-- 2. TABEL MENUS (PRODUK / MENU KEDAI)
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(20) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    kategori VARCHAR(80) NOT NULL DEFAULT 'Hidangan Utama',
    harga INTEGER NOT NULL DEFAULT 20000,
    deskripsi TEXT,
    gambar TEXT,
    "stokAwal" INTEGER NOT NULL DEFAULT 20,
    stok INTEGER NOT NULL DEFAULT 20,
    "terjualHariIni" INTEGER NOT NULL DEFAULT 0,
    "dicariSaatHabis" INTEGER NOT NULL DEFAULT 0,
    "terakhirDicariHabis" VARCHAR(60),
    "kataKunci" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. TABEL ORDERS (PESANAN MEJA & ANTREAN DAPUR FIFO)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    "nomorAntrean" VARCHAR(30) NOT NULL UNIQUE,
    "nomorMeja" VARCHAR(10) NOT NULL,
    "namaPelanggan" VARCHAR(120) NOT NULL,
    "sumberPesan" VARCHAR(60) NOT NULL DEFAULT 'Chatbot Meja',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    catatan TEXT,
    "totalPorsi" INTEGER NOT NULL DEFAULT 1,
    "totalHarga" INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'Menunggu Konfirmasi',
    "terkonfirmasiMeja" BOOLEAN NOT NULL DEFAULT FALSE,
    "waktuPesan" VARCHAR(60) NOT NULL,
    "waktuUpdate" VARCHAR(60) NOT NULL,
    "notifikasiTerbaru" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. INSERT DATA SEED AWAL (12 MENU + FOTO HD UNSPLASH)
-- ============================================================================
INSERT INTO menus (id, kode, nama, kategori, harga, deskripsi, gambar, "stokAwal", stok, "terjualHariIni", "dicariSaatHabis", "terakhirDicariHabis", "kataKunci", "createdAt", "updatedAt")
VALUES
(1, 'MN-01', 'Nasi Goreng Sei Sapi Asap', 'Hidangan Utama', 38000, 'Nasi goreng rempah dengan irisan daging sei sapi asap, sambal luat, dan telur mata sapi.', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80', 45, 18, 27, 0, NULL, '["nasi goreng", "sei sapi", "nasgor", "sapi asap", "nasi"]'::jsonb, NOW(), NOW()),
(2, 'MN-02', 'Mie Ayam Truffle Jamur', 'Hidangan Utama', 34000, 'Mie keriting kenyal buatan sendiri dengan topping ayam cincang jamur shiitake dan minyak truffle.', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80', 35, 4, 31, 1, '2026-10-15T12:40:00.000Z', '["mie ayam", "truffle", "mie jamur", "mie", "bakmi"]'::jsonb, NOW(), NOW()),
(3, 'MN-03', 'Ayam Bakar Madu Rempah', 'Hidangan Utama', 36000, 'Paha ayam panggang bumbu madu karamel disajikan bersama nasi hangat, lalapan, dan sambal korek.', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80', 30, 0, 30, 9, '2026-10-15T13:15:00.000Z', '["ayam bakar", "ayam madu", "ayam", "bakar madu"]'::jsonb, NOW(), NOW()),
(4, 'MN-04', 'Rice Bowl Chicken Katsu Curry', 'Hidangan Utama', 33000, 'Nasi Jepang hangat dengan fillet ayam katsu renyah dan siraman saus kari kental gurih.', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80', 40, 16, 24, 0, NULL, '["rice bowl", "chicken katsu", "katsu", "curry", "kari"]'::jsonb, NOW(), NOW()),
(5, 'MN-05', 'Es Kopi Susu Aren Signature', 'Kopi & Espresso', 24000, 'Double ristretto Arabika Gayo berpadu dengan susu segar dingin dan gula aren organik.', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80', 60, 22, 38, 0, NULL, '["kopi susu", "gula aren", "kopi aren", "es kopi", "signature"]'::jsonb, NOW(), NOW()),
(6, 'MN-06', 'Ice Caramel Sea Salt Latte', 'Kopi & Espresso', 28000, 'Espresso house blend dengan susu creamy, saus karamel panggang, dan sentuhan sea salt foam.', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80', 35, 3, 32, 2, '2026-10-15T13:05:00.000Z', '["caramel latte", "sea salt", "latte", "karamel"]'::jsonb, NOW(), NOW()),
(7, 'MN-07', 'Manual Brew V60 Kamojang', 'Kopi & Espresso', 29000, 'Seduhan kopi filter manual single origin Garut Kamojang dengan profil citrus dan teh hitam.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 20, 9, 11, 0, NULL, '["v60", "manual brew", "kamojang", "kopi hitam", "filter"]'::jsonb, NOW(), NOW()),
(8, 'MN-08', 'Uji Matcha Cream Cold Foam', 'Minuman Segar', 27000, 'Matcha Jepang murni yang dikocok dingin dengan susu segar dan lapisan krim lembut di atasnya.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', 30, 0, 30, 6, '2026-10-15T13:22:00.000Z', '["matcha", "uji matcha", "green tea", "teh hijau"]'::jsonb, NOW(), NOW()),
(9, 'MN-09', 'Lychee Yakult Sparkler', 'Minuman Segar', 25000, 'Minuman segar berkarbonasi ringan dengan buah leci utuh, probiotik yakult, dan daun mint.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80', 35, 14, 21, 0, NULL, '["lychee", "leci", "yakult", "sparkler", "segar"]'::jsonb, NOW(), NOW()),
(10, 'MN-10', 'Crispy Truffle Parmesan Fries', 'Kudapan & Pendamping', 26000, 'Kentang goreng potongan tebal dengan taburan keju parmesan parut, peterseli, dan saus bawang putih.', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80', 40, 15, 25, 0, NULL, '["kentang", "fries", "truffle fries", "kentang goreng", "parmesan"]'::jsonb, NOW(), NOW()),
(11, 'MN-11', 'Tahu Walik Sambal Petis', 'Kudapan & Pendamping', 22000, 'Tahu goreng balik renyah isi adonan ayam udang gurih disajikan dengan cocolan sambal kecap petis.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', 30, 5, 25, 3, '2026-10-15T11:50:00.000Z', '["tahu", "tahu walik", "camilan", "gorengan", "petis"]'::jsonb, NOW(), NOW()),
(12, 'MN-12', 'Croissant Butter Almond Panggang', 'Kudapan & Pendamping', 25000, 'Pastry berlapis mentega dengan isian krim kacang almond manis dan taburan irisan almond panggang.', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', 25, 11, 14, 0, NULL, '["croissant", "almond", "pastry", "roti"]'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sinkronisasi urutan ID auto increment tabel menus agar tidak bentrok
SELECT setval(pg_get_serial_sequence('menus', 'id'), COALESCE((SELECT MAX(id) FROM menus), 1), true);

-- ============================================================================
-- 5. INSERT DATA SEED AWAL (3 ANTREAN DAPUR)
-- ============================================================================
INSERT INTO orders (id, "nomorAntrean", "nomorMeja", "namaPelanggan", "sumberPesan", items, catatan, "totalPorsi", "totalHarga", status, "terkonfirmasiMeja", "waktuPesan", "waktuUpdate", "notifikasiTerbaru", "createdAt", "updatedAt")
VALUES
(1, 'ANT-101', '02', 'Pelanggan Meja 02', 'Chatbot Meja', 
 '[{"qty": 2, "kode": "MN-01", "nama": "Nasi Goreng Sei Sapi Asap", "harga": 38000, "menuId": 1, "subtotal": 76000}, {"qty": 2, "kode": "MN-05", "nama": "Es Kopi Susu Aren Signature", "harga": 24000, "menuId": 5, "subtotal": 48000}]'::jsonb, 
 'Satu porsi nasi goreng tidak pedas.', 4, 124000, 'Siap Diantar', TRUE, NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '10 minutes', 'Pesanan ANT-101 (Meja 02) sudah selesai dimasak dan siap diantar ke meja Anda.', NOW(), NOW()),

(2, 'ANT-102', '07', 'Evan Vijaya Putra', 'Chatbot Meja', 
 '[{"qty": 1, "kode": "MN-02", "nama": "Mie Ayam Truffle Jamur", "harga": 34000, "menuId": 2, "subtotal": 34000}, {"qty": 1, "kode": "MN-06", "nama": "Ice Caramel Sea Salt Latte", "harga": 28000, "menuId": 6, "subtotal": 28000}]'::jsonb, 
 'Kuah dipisah, es sedikit.', 2, 62000, 'Sedang Diproses', TRUE, NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '8 minutes', 'Pesanan ANT-102 (Meja 07) sedang dimasak oleh staf dapur kami.', NOW(), NOW()),

(3, 'ANT-103', '11', 'Pelanggan Meja 11', 'Chatbot Meja', 
 '[{"qty": 2, "kode": "MN-04", "nama": "Rice Bowl Chicken Katsu Curry", "harga": 33000, "menuId": 4, "subtotal": 66000}, {"qty": 2, "kode": "MN-09", "nama": "Lychee Yakult Sparkler", "harga": 25000, "menuId": 9, "subtotal": 50000}, {"qty": 1, "kode": "MN-10", "nama": "Crispy Truffle Parmesan Fries", "harga": 26000, "menuId": 10, "subtotal": 26000}]'::jsonb, 
 'Saus kari tuang langsung.', 5, 142000, 'Menunggu Konfirmasi', FALSE, NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '4 minutes', 'Pesanan ANT-103 diterima di layar dapur untuk Meja 11 dan menunggu giliran masak.', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Sinkronisasi urutan ID auto increment tabel orders
SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1), true);
