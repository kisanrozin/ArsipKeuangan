-- ═══════════════════════════════════════════════════════════════
-- Setup database & tabel login admin (phpMyAdmin / XAMPP MySQL)
-- Jalankan skrip ini di phpMyAdmin → tab SQL
-- Tidak perlu membuat database secara manual — skrip otomatis
-- membuat database, tabel, dan user default.
-- ═══════════════════════════════════════════════════════════════

-- 1. Buat database (jika belum ada)
CREATE DATABASE IF NOT EXISTS arsipkeuangan
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE arsipkeuangan;

-- 2. Buat tabel users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','tamu') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. (Opsional) Kosongkan tabel jika ingin reset semua user
--    Hilangkan tanda koma di baris berikut untuk aktifkan:
-- TRUNCATE TABLE users;

-- 4. Masukkan / perbarui user admin default
--    username: admin  |  kata sandi: admin123
--    ⚠️ SEGERA ganti kata sandi default setelah instalasi.
--    Password contoh di bawah masih teks biasa agar database lama
--    tetap bisa dipakai. login.php OTOMATIS mengubahnya menjadi hash
--    bcrypt pada login pertama yang berhasil.
--    ON DUPLICATE KEY UPDATE agar password selalu terbaru
--    meskipun skrip dijalankan berkali-kali.
INSERT INTO users (username, password, role) VALUES
    ('admin', 'admin123', 'admin')
ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    role = VALUES(role);

-- 5. (Opsional) Contoh user tambahan dengan role tamu
-- INSERT INTO users (username, password, role) VALUES
--     ('tamu', 'tamu123', 'tamu');

-- 6. Verifikasi isi tabel (hapus koma untuk coba)
-- SELECT id, username, role, created_at FROM users;

-- ═══════════════════════════════════════════════════════════════
-- CATATAN: Mengubah password menjadi hash bcrypt (lebih aman)
-- Jalankan file ini di PHP (contoh: generate_hash.php):
--   <?php echo password_hash('admin123', PASSWORD_DEFAULT); ?>
-- Salin hasil hash-nya, lalu jalankan di phpMyAdmin:
--   UPDATE users SET password = 'HASH_YANG_DIDAPAT' WHERE username = 'admin';
-- login.php sudah mendukung verifikasi hash bcrypt secara otomatis.
--
-- PENTING: ganti kata sandi default 'admin123' sebelum dipakai.
-- Contoh mengubah ke hash bcrypt (jalankan di PHP):
--   <?php echo password_hash('KATA_SANDI_BARU_ANDA', PASSWORD_DEFAULT); ?>
-- Lalu:
--   UPDATE users SET password = 'HASH_BARU' WHERE username = 'admin';
--
-- Saat deploy, set environment APP_ORIGIN di server PHP ke origin
-- frontend (mis. https://arsip.contoh.go.id) agar hanya frontend itu
-- yang boleh memanggil API login.
-- ═══════════════════════════════════════════════════════════════
