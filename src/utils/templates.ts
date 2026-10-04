import type { TemplateItem } from '../types/flowchart';

export const FLOWCHART_TEMPLATES: TemplateItem[] = [
  {
    id: 'auth-verification',
    title: '1. Autentikasi Pengguna & OTP (User Security)',
    description: 'Diagram alur keamanan: verifikasi email & password, pembuatan kode OTP, dan validasi 2FA',
    code: `MULAI
MASUKKAN email, password
is_valid = verifikasi_kredensial(email, password)
JIKA is_valid == true MAKA
    otp_code = kirim_kode_otp(email)
    MASUKKAN input_otp
    JIKA input_otp == otp_code MAKA
        TAMPILKAN "Login Berhasil! Selamat Datang"
    LAINNYA
        TAMPILKAN "Kode OTP Salah atau Kedaluwarsa"
    AKHIR-JIKA
LAINNYA
    TAMPILKAN "Email atau Password Salah!"
AKHIR-JIKA
SELESAI`,
  },
  {
    id: 'payment-checkout',
    title: '2. Proses Checkout & Payment Gateway (E-Commerce)',
    description: 'Diagram alur transaksi belanja: pengecekan saldo dompet digital dan status pembayaran',
    code: `MULAI
MASUKKAN total_belanja, saldo_dompet
JIKA saldo_dompet >= total_belanja MAKA
    saldo_akhir = saldo_dompet - total_belanja
    status_bayar = "LUNAS"
    TAMPILKAN "Pembayaran Sukses! Sisa Saldo: ", saldo_akhir
LAINNYA
    status_bayar = "GAGAL"
    TAMPILKAN "Saldo Tidak Mencukupi, Silakan Top Up"
AKHIR-JIKA
SELESAI`,
  },
  {
    id: 'smart-iot-thermostat',
    title: '3. Kontrol Suhu Otomatis IoT (Perulangan Sensor)',
    description: 'Diagram monitoring siklus suhu ruangan dengan saklar dan aktuator AC otomatis',
    code: `MULAI
target_suhu = 22
MASUKKAN sensor_aktif
SELAMA sensor_aktif == true LAKUKAN
    suhu_sekarang = baca_sensor_suhu()
    JIKA suhu_sekarang > target_suhu MAKA
        nyalakan_pendingin_ac()
    LAINNYA
        matikan_pendingin_ac()
    AKHIR-JIKA
    sensor_aktif = cek_status_saklar()
AKHIR-SELAMA
TAMPILKAN "Sistem Termostat Non-Aktif"
SELESAI`,
  },
  {
    id: 'credit-risk-scoring',
    title: '4. Evaluasi Risiko Kredit (Multi-Kondisi)',
    description: 'Analisis skor kelayakan pinjaman finansial berdasarkan pendapatan dan riwayat kredit',
    code: `MULAI
MASUKKAN pendapatan_bulanan, skor_kredit, tanggungan
rasio_finansial = pendapatan_bulanan / (tanggungan + 1)
JIKA skor_kredit >= 750 DAN rasio_finansial >= 5000000 MAKA
    TAMPILKAN "Status: Pengajuan Pinjaman DISETUJUI (Bunga Rendah)"
LAINNYA
    TAMPILKAN "Status: Pengajuan Pinjaman DITOLAK atau Perlu Review Manual"
AKHIR-JIKA
SELESAI`,
  },
];
