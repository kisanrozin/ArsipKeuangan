<?php
/* ═══════════════════════════════════════════════════════════════
   API LOGIN — Autentikasi admin ke database MySQL (phpMyAdmin)
   --------------------------------------------------------------
   Endpoint: POST /api/login.php
   Body JSON: { "username": "...", "password": "..." }

   Pengamanan yang diterapkan:
   • prepared statement (anti SQL injection);
   • password bcrypt (password_hash/password_verify) + migrasi
     otomatis dari password teks biasa saat login pertama;
   • pembatasan percobaan login (rate limit) per alamat IP;
   • CORS hanya untuk origin yang diizinkan;
   • pesan error tidak membocorkan detail database;
   • respons tidak di-cache browser/proxy.

   Konfigurasi lewat environment (disarankan) atau nilai default
   XAMPP di bawah:
     DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_TABLE
     APP_ORIGIN = http://localhost:3000
   ═══════════════════════════════════════════════════════════════ */

header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Referrer-Policy: no-referrer");

/* ── CORS: hanya origin yang diizinkan ─────────────────────────
   Isi APP_ORIGIN dengan origin frontend, pisahkan koma bila lebih
   dari satu, contoh:
     APP_ORIGIN="http://localhost:3000,https://arsip.contoh.go.id"
   Bila APP_ORIGIN belum diatur, hanya localhost:3000 yang diizinkan
   agar pengembangan lokal tetap berjalan. */
$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
$asalDiizinkan = array_values(array_filter(array_map(
    "trim",
    explode(",", (string) getenv("APP_ORIGIN"))
)));
if (!count($asalDiizinkan)) {
    $asalDiizinkan = ["http://localhost:3000", "http://127.0.0.1:3000"];
}

if ($origin !== "") {
    if (!in_array($origin, $asalDiizinkan, true)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Origin tidak diizinkan mengakses API login."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    header("Access-Control-Allow-Origin: " . $origin);
    header("Vary: Origin");
} else {
    /* Permintaan tanpa Origin (mis. curl/server) — tidak diberi CORS. */
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST, OPTIONS");
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method tidak diizinkan"], JSON_UNESCAPED_UNICODE);
    exit();
}

/* ── Batas percobaan login per IP (8 percobaan / 5 menit) ────── */
function ipPemohon() {
    return $_SERVER["REMOTE_ADDR"] ?? "tidak-diketahui";
}

function berkasBatas($ip) {
    return sys_get_temp_dir() . DIRECTORY_SEPARATOR . "pu_login_" . hash("sha256", $ip) . ".json";
}

function bacaBatas($ip) {
    $jendela = 300;   // detik
    $maks = 8;        // percobaan gagal
    $sekarang = time();
    $data = ["mulai" => $sekarang, "jumlah" => 0];

    $berkas = berkasBatas($ip);
    if (is_file($berkas)) {
        $isi = json_decode((string) @file_get_contents($berkas), true);
        if (is_array($isi) && isset($isi["mulai"], $isi["jumlah"])) {
            $data = $isi;
        }
    }

    if (($sekarang - (int) $data["mulai"]) > $jendela) {
        $data = ["mulai" => $sekarang, "jumlah" => 0];
    }

    return [
        "boleh" => ((int) $data["jumlah"] < $maks),
        "sisa" => max(0, $maks - (int) $data["jumlah"]),
        "jendela" => $jendela,
        "berkas" => $berkas,
        "data" => $data,
    ];
}

function catatGagalLogin($batas) {
    $data = $batas["data"];
    $data["jumlah"] = (int) $data["jumlah"] + 1;
    @file_put_contents($batas["berkas"], json_encode($data), LOCK_EX);
}

function hapusBatasLogin($ip) {
    @unlink(berkasBatas($ip));
}

$batas = bacaBatas(ipPemohon());
if (!$batas["boleh"]) {
    header("Retry-After: " . $batas["jendela"]);
    http_response_code(429);
    echo json_encode([
        "success" => false,
        "message" => "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/* ── Baca & validasi input ───────────────────────────────────── */
$input = json_decode((string) file_get_contents("php://input"), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Format permintaan tidak valid."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$username = trim((string) ($input["username"] ?? ""));
$password = (string) ($input["password"] ?? "");

if ($username === "" || $password === "") {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username dan kata sandi wajib diisi"], JSON_UNESCAPED_UNICODE);
    exit();
}

/* Batasi panjang input agar tidak membebani server. */
if (strlen($username) > 50 || strlen($password) > 200) {
    catatGagalLogin($batas);
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Username atau kata sandi salah"
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/* ── Konfigurasi database ────────────────────────────────────── */
$host   = getenv("DB_HOST") ?: "localhost";
$dbUser = getenv("DB_USER") ?: "root";
$dbPass = getenv("DB_PASS") !== false ? getenv("DB_PASS") : "";
$dbName = getenv("DB_NAME") ?: "arsipkeuangan";
$table  = getenv("DB_TABLE") ?: "users";

/* Nama tabel diambil dari environment, jadi wajib divalidasi sebelum
   dimasukkan ke query (prepared statement tidak bisa mengikat nama tabel). */
if (!preg_match('/^[A-Za-z0-9_]+$/', $table)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Konfigurasi tabel database tidak valid."], JSON_UNESCAPED_UNICODE);
    exit();
}

mysqli_report(MYSQLI_REPORT_OFF);
$conn = new mysqli($host, $dbUser, $dbPass, $dbName);

if ($conn->connect_error) {
    error_log("Login DB connection error: " . $conn->connect_error);
    http_response_code(503);
    echo json_encode([
        "success" => false,
        "message" => "Server login tidak dapat terhubung ke database."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

$conn->set_charset("utf8mb4");

/* Ambil data user berdasarkan username (prepared statement). */
$stmt = $conn->prepare(
    "SELECT id, username, password, role FROM `$table` WHERE username = ? LIMIT 1"
);
if (!$stmt) {
    error_log("Login prepare error: " . $conn->error);
    $conn->close();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server login sedang bermasalah."], JSON_UNESCAPED_UNICODE);
    exit();
}

$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$loginBerhasil = false;
$userData = null;

if ($result && $result->num_rows === 1) {
    $userData = $result->fetch_assoc();
    $storedPassword = (string) ($userData["password"] ?? "");

    /* 1. Hash bcrypt → password_verify.
       2. Teks biasa (database lama) → bandingkan konstan-waktu,
          lalu langsung migrasikan ke hash bcrypt. */
    $isHash = (bool) preg_match('/^\$2[aby]\$/', $storedPassword);
    $passwordCocok = $isHash
        ? password_verify($password, $storedPassword)
        : hash_equals($storedPassword, $password);

    if ($passwordCocok) {
        $role = strtolower((string) ($userData["role"] ?? "admin"));
        if ($role !== "admin") {
            /* Akun non-admin tidak boleh masuk ke mode admin. */
            catatGagalLogin($batas);
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Akun ini tidak memiliki akses admin."
            ], JSON_UNESCAPED_UNICODE);
            $stmt->close();
            $conn->close();
            exit();
        }

        $loginBerhasil = true;

        /* Migrasi password teks biasa → bcrypt (tanpa mengubah
           perilaku login pengguna). */
        if (!$isHash) {
            $hashBaru = password_hash($password, PASSWORD_DEFAULT);
            if ($hashBaru) {
                $upd = $conn->prepare("UPDATE `$table` SET password = ? WHERE id = ?");
                if ($upd) {
                    $idUser = (int) $userData["id"];
                    $upd->bind_param("si", $hashBaru, $idUser);
                    $upd->execute();
                    $upd->close();
                }
            }
        }
    }
}

$stmt->close();
$conn->close();

if ($loginBerhasil && $userData) {
    /* Jangan kirimkan password/hash ke frontend. */
    unset($userData["password"]);
    hapusBatasLogin(ipPemohon());

    echo json_encode([
        "success" => true,
        "message" => "Login berhasil",
        "user"    => $userData
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

catatGagalLogin($batas);
http_response_code(401);
echo json_encode([
    "success" => false,
    "message" => "Username atau kata sandi salah"
], JSON_UNESCAPED_UNICODE);
