import type { TemplateItem } from '../types/flowchart';

export const FLOWCHART_TEMPLATES: TemplateItem[] = [
  {
    id: 'luas-persegi-panjang',
    title: '1. Hitung Luas Persegi Panjang (Sekuensial)',
    description: 'Diagram alur sekuensial sederhana: Input -> Proses Rumus -> Output',
    code: `MULAI
MASUKKAN panjang, lebar
luas = panjang * lebar
keliling = 2 * (panjang + lebar)
TAMPILKAN "Luas Persegi Panjang: ", luas
TAMPILKAN "Keliling Persegi Panjang: ", keliling
SELESAI`,
  },
  {
    id: 'ganjil-genap',
    title: '2. Cek Bilangan Ganjil / Genap (Percabangan If-Else)',
    description: 'Diagram alur keputusan dengan dua alur logika Ya dan Tidak',
    code: `MULAI
MASUKKAN bilangan
sisa = bilangan % 2
JIKA sisa == 0 MAKA
    TAMPILKAN bilangan, " adalah bilangan GENAP"
LAINNYA
    TAMPILKAN bilangan, " adalah bilangan GANJIL"
AKHIR-JIKA
SELESAI`,
  },
  {
    id: 'perulangan-while',
    title: '3. Cetak Angka 1 sampai N (Perulangan While)',
    description: 'Diagram alur dengan siklus loop berulang hingga kondisi false',
    code: `MULAI
MASUKKAN batas_n
counter = 1
SELAMA counter <= batas_n LAKUKAN
    TAMPILKAN "Angka ke-", counter
    counter = counter + 1
AKHIR-SELAMA
TAMPILKAN "Perulangan Selesai!"
SELESAI`,
  },
  {
    id: 'auto-adjust-text',
    title: '4. Demo Auto-Adjust Ukuran Teks Panjang',
    description: 'Bentuk shape otomatis membesar sesuai panjang dan wrapping teks',
    code: `MULAI
MASUKKAN nama_lengkap_mahasiswa_dan_nomor_induk_kependudukan
status_kelulusan = hitung_rata_rata_nilai_ujian_nasional_dan_proyek_akhir()
JIKA nilai_rata_rata >= 80.5 DAN status_kehadiran_kuliah >= 75 MAKA
    TAMPILKAN "Selamat! Anda dinyatakan LULUS dengan predikat PUJIAN TINGGI (Cumlaude)"
LAINNYA
    TAMPILKAN "Mohon maaf, Anda wajib mengikuti ujian perbaikan semester depan"
AKHIR-JIKA
SELESAI DENGAN SUKSES`,
  },
];
