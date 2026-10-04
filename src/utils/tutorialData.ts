export interface TutorialStep {
  id: string;
  title: string;
  task: string;
  description: string;
  tip?: string;
  actionHint?: string;
}

export interface BlockMeaning {
  shapeName: string;
  syntax: string;
  description: string;
  colorBg?: string;
  colorBorder?: string;
}

export interface MenuTutorialConfig {
  mode: 'flowchart' | 'structure' | 'ipo';
  title: string;
  badgeColor: string;
  accentColor: string;
  steps: TutorialStep[];
  pseudocodeSummary: {
    title: string;
    description: string;
    rules: string[];
    exampleCode: string;
  };
  blockMeanings: BlockMeaning[];
}

export const TUTORIAL_CONFIGS: Record<'flowchart' | 'structure' | 'ipo', MenuTutorialConfig> = {
  flowchart: {
    mode: 'flowchart',
    title: 'Flowchart Logic Studio',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accentColor: 'indigo',
    steps: [
      {
        id: 'fc_step_1',
        title: 'Langkah 1: Editor Pseudocode & Preview Diagram',
        task: 'Pahami Alur Generator Real-Time',
        description:
          'Ketik atau ubah teks pseudocode di panel kiri. Setiap baris kode akan otomatis diterjemahkan menjadi diagram alur visual di panel kanan secara instan tanpa perlu reload.',
        actionHint: 'Perhatikan kata kunci wajib seperti MULAI di baris awal dan SELESAI di baris akhir.',
        tip: 'Editor dilengkapi nomor baris, auto-indentasi, dan validasi sintaks otomatis.',
      },
      {
        id: 'fc_step_2',
        title: 'Langkah 2: Gunakan Preset Elemen Cepat',
        task: 'Sisipkan Bentuk Shape Tanpa Mengetik Manual',
        description:
          'Di bagian atas editor, klik tombol preset seperti [Mulai], [Input Data], [Proses / Rumus], [Percabangan (If)], atau [Perulangan (While)] untuk memasukkan template sintaks secara instan.',
        actionHint: 'Coba klik salah satu tombol preset di toolbar atas editor untuk melihat potongan kode disisipkan.',
        tip: 'Format sintaks preset sudah disesuaikan dengan standar akademik algoritma.',
      },
      {
        id: 'fc_step_3',
        title: 'Langkah 3: Atur Layout & Gaya Garis Alur',
        task: 'Eksplorasi Kanvas dan Pengaturan Visual',
        description:
          'Di atas kanvas diagram, Anda dapat mengubah gaya garis alur (Tegas 90°, Lurus, Lengkung), kerapatan antar-blok (Rapat, Sedang, Renggang), arah alur (Atas → Bawah atau Kiri → Kanan), serta tombol Pusatkan Kanvas.',
        actionHint: 'Coba klik tombol "Lurus" atau "Lengkung" untuk melihat perubahan koneksi garis.',
        tip: 'Gunakan scroll mouse untuk zoom, dan drag pada area kosong untuk menggeser kanvas.',
      },
      {
        id: 'fc_step_4',
        title: 'Langkah 4: Simpan, Bagikan & Ekspor Retina',
        task: 'Unduh Hasil Desain Resolusi Tinggi 3x',
        description:
          'Gunakan tombol [Ekspor PNG] di navbar untuk mengunduh gambar diagram beresolusi tajam 3x Retina tanpa terpotong, atau tombol [Bagikan] untuk menghasilkan link cloud unik publik.',
        actionHint: 'Semua perubahan otomatis tersimpan di browser Anda.',
        tip: 'Tautan unik publik dapat dibuka oleh siapa saja tanpa perlu login.',
      },
    ],
    pseudocodeSummary: {
      title: 'Ringkasan Sintaks Pseudocode Flowchart',
      description: 'Aturan penulisan pseudocode bahasa Indonesia baku:',
      rules: [
        'Setiap diagram WAJIB diawali dengan kata kunci MULAI dan diakhiri dengan SELESAI.',
        'Operasi Input menggunakan MASUKKAN atau BACA diikuti daftar variabel (misal: MASUKKAN panjang, lebar).',
        'Operasi Output menggunakan TAMPILKAN atau CETAK (misal: TAMPILKAN "Luas: ", luas).',
        'Operasi Proses / Rumus menggunakan tanda sama dengan (misal: luas = panjang * lebar).',
        'Percabangan ditulis: JIKA <kondisi> MAKA ... LAINNYA ... AKHIR-JIKA.',
        'Perulangan ditulis: SELAMA <kondisi> LAKUKAN ... AKHIR-SELAMA.',
      ],
      exampleCode: `MULAI
MASUKKAN email, password
is_valid = verifikasi_kredensial(email, password)
JIKA is_valid == true MAKA
    TAMPILKAN "Login Sukses"
LAINNYA
    TAMPILKAN "Login Gagal"
AKHIR-JIKA
SELESAI`,
    },
    blockMeanings: [
      {
        shapeName: 'Terminal (Oval / Kapsul)',
        syntax: 'MULAI / SELESAI',
        description: 'Menandai titik awal (Start) atau titik akhir (Stop/End) dari seluruh alur program.',
        colorBg: 'bg-emerald-50',
        colorBorder: 'border-emerald-300',
      },
      {
        shapeName: 'Input / Output (Jajar Genjang)',
        syntax: 'MASUKKAN x / TAMPILKAN y',
        description: 'Menerima data masukan dari pengguna atau menampilkan hasil/informasi ke layar pengguna.',
        colorBg: 'bg-cyan-50',
        colorBorder: 'border-cyan-300',
      },
      {
        shapeName: 'Proses / Rumus (Persegi Panjang)',
        syntax: 'variabel = ekspresi',
        description: 'Melakukan pemrosesan aritmatika, kalkulasi rumus, manipulasi string, atau inisialisasi variabel.',
        colorBg: 'bg-indigo-50',
        colorBorder: 'border-indigo-300',
      },
      {
        shapeName: 'Percabangan / Decision (Belah Ketupat)',
        syntax: 'JIKA ... MAKA ... AKHIR-JIKA',
        description: 'Mengevaluasi kondisi logika bernilai Benar/Salah (Ya/Tidak) dengan dua cabang jalur keluar terpisah.',
        colorBg: 'bg-amber-50',
        colorBorder: 'border-amber-300',
      },
      {
        shapeName: 'Perulangan / Loop (Belah Ketupat Loop)',
        syntax: 'SELAMA ... LAKUKAN ... AKHIR-SELAMA',
        description: 'Mengeksekusi blok kode berulang kali selama kondisi bernilai benar dengan panah pengulang ke atas.',
        colorBg: 'bg-purple-50',
        colorBorder: 'border-purple-300',
      },
    ],
  },

  structure: {
    mode: 'structure',
    title: 'Structure Chart Studio',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    accentColor: 'blue',
    steps: [
      {
        id: 'st_step_1',
        title: 'Langkah 1: Dekomposisi Modul Berbasis Indentasi',
        task: 'Pahami Hierarki Pohon Modul',
        description:
          'Structure Chart membagi sistem menjadi modul-modul terstruktur. Modul induk berada di baris tanpa indentasi, sedangkan modul bawahan/anak diidentasikan menggunakan 2 spasi di bawah modul induknya.',
        actionHint: 'Modul teratas adalah Root/Control Module yang memimpin koordinasi modul di bawahnya.',
        tip: 'Struktur bertingkat dapat dibuat hingga kedalaman tak terbatas sesuai kompleksitas sistem.',
      },
      {
        id: 'st_step_2',
        title: 'Langkah 2: Tambahkan Aliran Data Couple & Control Flag',
        task: 'Dokumentasikan Parameter Antar-Modul',
        description:
          'Gunakan notasi tanda kurung di bawah nama modul: (DATA IN: ...) atau (DATA OUT: ...) untuk data couple murni, dan (FLAG IN: ...) atau (FLAG OUT: ...) untuk sinyal kendali/status.',
        actionHint: 'Data Couple ditandai panah berekor lingkaran putih; Control Flag berekor lingkaran hitam.',
        tip: 'Bisa memasukkan beberapa parameter sekaligus dipisahkan tanda koma, misal: (DATA OUT: id, nama).',
      },
      {
        id: 'st_step_3',
        title: 'Langkah 3: Notasi Percabangan [COND] & Loop [LOOP]',
        task: 'Gunakan Diamond Keputusan & Busur Perulangan',
        description:
          'Tambahkan tag [COND] di samping nama modul untuk menandai bahwa modul tersebut dipanggil secara kondisional, atau [LOOP] untuk memunculkan busur melengkung pemanggilan berulang.',
        actionHint: 'Dukungan [COND START] dan [COND END] memungkinkan 1 diamond bersama melintasi modul bertetangga.',
        tip: 'Gunakan simbol || Nama Modul || untuk menandai modul pustaka/library bawaan.',
      },
      {
        id: 'st_step_4',
        title: 'Langkah 4: Template Modular & Ekspor Dokumen',
        task: 'Gunakan Template Nyata & Ekspor Gambar',
        description:
          'Pilih template arsitektur modular dari menu Proyek & JSON untuk mempelajari contoh sistem nyata seperti Manajemen Logistik, Sistem Kasir Restoran, atau Transaksi ATM.',
        actionHint: 'Bagan ini siap diekspor menjadi gambar laporan PNG resolusi tinggi Retina 3x.',
        tip: 'Gunakan tombol Pusatkan Kanvas untuk mengatur zoom otomatis.',
      },
    ],
    pseudocodeSummary: {
      title: 'Ringkasan Sintaks Pseudocode Structure Chart',
      description: 'Aturan notasi dekomposisi hierarki modul program:',
      rules: [
        'Nama Modul: Tulis nama modul pada baris tersendiri. Gunakan 2 spasi indentasi untuk menyatakan modul anak.',
        'Data Couple: (DATA IN: parameter) atau (DATA OUT: parameter) - membawa data murni.',
        'Control Flag: (FLAG IN: status) atau (FLAG OUT: status) - membawa kondisi Boolean / flag.',
        'Percabangan Bersyarat: Tambahkan [COND] pada modul yang dieksekusi berdasarkan keputusan.',
        'Grouped Condition: Gunakan [COND START] pada modul pertama dan [COND END] pada modul terakhir.',
        'Perulangan Modul: Tambahkan [LOOP] untuk menandai pemanggilan berulang.',
        'Modul Library / Predefined: Apit nama modul dengan garis ganda || Nama Modul ||.',
      ],
      exampleCode: `Manage Package Shipment [LOOP]
  Accept Shipment Order
    (DATA OUT: order_details)
    (FLAG OUT: more_orders)
  Verify Warehouse Inventory
    (DATA IN: order_details)
    (FLAG OUT: stock_ready)
    || Check Shelf Location ||
      (DATA IN: order_details)
      (DATA OUT: shelf_id)
  Dispatch Courier Delivery [COND]
    (DATA IN: order_details)
    (DATA IN: shelf_id)
    (FLAG OUT: dispatch_success)`,
    },
    blockMeanings: [
      {
        shapeName: 'Modul / Fungsi (Persegi Panjang)',
        syntax: 'Nama Modul',
        description: 'Merepresentasikan satu modul fungsi mandiri dalam program yang bertanggung jawab atas satu tugas spesifik.',
        colorBg: 'bg-blue-50',
        colorBorder: 'border-blue-300',
      },
      {
        shapeName: 'Data Couple (Panah Lingkaran Putih)',
        syntax: '(DATA IN/OUT: variable)',
        description: 'Parameter data murni yang dilewatkan antar-modul (tanpa mengubah keputusan alur kontrol logika).',
        colorBg: 'bg-sky-50',
        colorBorder: 'border-sky-300',
      },
      {
        shapeName: 'Control Flag (Panah Lingkaran Hitam)',
        syntax: '(FLAG IN/OUT: status)',
        description: 'Nilai bendera status kontrol logika (Boolean true/false, EOF, error status) yang memengaruhi keputusan pemanggilan.',
        colorBg: 'bg-slate-100',
        colorBorder: 'border-slate-400',
      },
      {
        shapeName: 'Keputusan Bersyarat [COND] (Diamond Hitam)',
        syntax: 'Nama Modul [COND]',
        description: 'Simbol belah ketupat di bawah modul induk yang menandakan bahwa modul anak dipanggil secara bersyarat (If/Switch).',
        colorBg: 'bg-indigo-50',
        colorBorder: 'border-indigo-300',
      },
      {
        shapeName: 'Perulangan Pemanggilan [LOOP] (Busur Melengkung)',
        syntax: 'Nama Modul [LOOP]',
        description: 'Busur panah melengkung di garis koneksi yang menandakan pemanggilan modul bawahan dilakukan berulang-ulang.',
        colorBg: 'bg-emerald-50',
        colorBorder: 'border-emerald-300',
      },
      {
        shapeName: 'Modul Library / Predefined (Garis Ganda Samping)',
        syntax: '|| Nama Modul ||',
        description: 'Modul pustaka baku atau fungsi sistem yang sudah tersedia sebelumnya dan siap dipanggil kapan saja.',
        colorBg: 'bg-purple-50',
        colorBorder: 'border-purple-300',
      },
    ],
  },

  ipo: {
    mode: 'ipo',
    title: 'IPO Chart Builder (Functional Design)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: 'emerald',
    steps: [
      {
        id: 'ipo_step_1',
        title: 'Langkah 1: Rancang Fungsi Mandiri (Left Panel)',
        task: 'Bangun Input, Process & Output Secara Manual',
        description:
          'Di panel kiri, klik tombol [+ Add Function] untuk membuat modul fungsi. Masukkan Nama Fungsi, lalu kelola daftar INPUT (data masuk), PROCESS (tahapan kalkulasi), dan OUTPUT (hasil keluar) dengan tombol + dan tombol panah reorder (↑ ↓).',
        actionHint: 'Setiap fungsi dapat diduplikasi atau dihapus secara fleksibel.',
        tip: 'Mode ini 100% manual dan murni tanpa auto-inferensi AI untuk melatih perancangan logika fungsional.',
      },
      {
        id: 'ipo_step_2',
        title: 'Langkah 2: Petakan Ketergantungan Data (Connections)',
        task: 'Hubungkan Output Fungsi Sumber ke Input Fungsi Tujuan',
        description:
          'Buka tab [Connections] di panel kiri dan klik [+ Add Connection]. Tentukan Source Function & Output-nya, serta Target Function & Input-nya, plus label nama datanya.',
        actionHint: 'Koneksi ini akan otomatis menggambar garis panah relasi ketergantungan data di graf preview.',
        tip: 'Aplikasi mendeteksi referensi rusak otomatis jika ada item fungsi/output yang terhapus.',
      },
      {
        id: 'ipo_step_3',
        title: 'Langkah 3: Jelajahi Dual-Mode Preview',
        task: 'Pilih Mode Tabel Akademik atau Graf Relasi',
        description:
          'Di panel kanan terdapat dua mode pratinjau: Mode [📋 IPO Charts] menampilkan tabel akademik 3 kolom proporsional (25% | 50% | 25%), sedangkan mode [🔗 Function Relationships] menampilkan graf kotak fungsi yang terhubung secara visual.',
        actionHint: 'Tombol [Export All IPO] mengekspor seluruh tabel IPO bertingkat dalam satu berkas gambar vertikal utuh.',
        tip: 'Pada graf relasi, posisi blok dapat digeser bebas dan posisinya tersimpan secara persisten.',
      },
      {
        id: 'ipo_step_4',
        title: 'Langkah 4: Kustomisasi Interaktif Garis & Label',
        task: 'Ubah Warna, Geser Label di Garis & Handle Anti-Overlap',
        description:
          'Klik garis relasi di graf untuk memunculkan Floating Toolbar: pilih 7 preset palet warna, ubah titik pin pangkal/ujung (Kanan/Kiri/Bawah/Pin Tag), dan geser posisi label sepanjang garis menggunakan slider presisi (5% - 95%) atau tombol preset.',
        actionHint: 'Garis yang keluar ke target samping otomatis beralih ke handle sisi kanan/kiri untuk mencegah overlap!',
        tip: 'Handle dot yang tidak terhubung ke garis disembunyikan otomatis agar tampilan diagram bersih.',
      },
    ],
    pseudocodeSummary: {
      title: 'Ringkasan Format Tabel IPO & Relasi Fungsi',
      description: 'Aturan perancangan tabel IPO (Input - Process - Output):',
      rules: [
        'Nama Fungsi: Mengikuti konvensi camelCase atau snake_case yang deskriptif (misal: calculateStayCharges).',
        'Kolom INPUT (25%): Semua variabel atau parameter yang wajib tersedia sebelum fungsi berjalan.',
        'Kolom PROCESS (50%): Langkah-langkah logika berurutan, formula matematika, validasi kondisi, atau loop.',
        'Kolom OUTPUT (25%): Variabel hasil, dokumen, atau status sukses yang dihasilkan oleh fungsi.',
        'Relasi Ketergantungan (Data Dependency): Output dari suatu fungsi yang menjadi Input bagi fungsi lain dipetakan melalui Connections.',
        'Anti-Overlap: Titik masuk garis dikelompokkan ke sisi samping atau slot atas terpisah untuk menjaga keterbacaan.',
      ],
      exampleCode: `Function: calculateStayCharges(dailyRate, stayNights)
-------------------------------------------------------------
INPUT (25%)  | PROCESS (50%)                      | OUTPUT (25%)
-------------------------------------------------------------
- dailyRate  | 1. stayCharges = dailyRate * stayNights | - stayCharges
- stayNights |                                    |
-------------------------------------------------------------`,
    },
    blockMeanings: [
      {
        shapeName: 'Tabel Akademik 3 Kolom',
        syntax: 'INPUT (25%) | PROCESS (50%) | OUTPUT (25%)',
        description: 'Format standar dokumentasi rekayasa perangkat lunak untuk mendefinisikan batas modul komputasi secara jelas.',
        colorBg: 'bg-emerald-50',
        colorBorder: 'border-emerald-300',
      },
      {
        shapeName: 'Blok Fungsi Relasi (React Flow Node)',
        syntax: 'functionName()',
        description: 'Kotak modul pada graf relasi yang menampilkan nama fungsi dan tag-tag input & output interaktif.',
        colorBg: 'bg-teal-50',
        colorBorder: 'border-teal-300',
      },
      {
        shapeName: 'Garis Relasi & Label Data',
        syntax: 'Source Output ──[dataName]──> Target Input',
        description: 'Panah terarah yang menggambarkan transfer data antar-fungsi dengan label yang dapat digeser posisinya.',
        colorBg: 'bg-indigo-50',
        colorBorder: 'border-indigo-300',
      },
      {
        shapeName: 'Directional Handle (Anti-Overlap)',
        syntax: 'Handle Kiri / Kanan / Bawah',
        description: 'Titik koneksi cerdas yang otomatis menyesuaikan posisi target ke kiri/kanan agar garis tidak saling menumpuk.',
        colorBg: 'bg-amber-50',
        colorBorder: 'border-amber-300',
      },
      {
        shapeName: 'Pin Tag Output Spesifik',
        syntax: 'Pin Tag [outputName]',
        description: 'Titik pangkal garis yang berakar langsung di bawah badge nama output tertentu pada kartu fungsi.',
        colorBg: 'bg-rose-50',
        colorBorder: 'border-rose-300',
      },
    ],
  },
};

const TUTORIAL_STORAGE_KEY = 'program_design_tutorial_progress_v1';

export interface TutorialProgressState {
  step: number;
  completed: boolean;
  skipped: boolean;
  isMinimized: boolean;
}

export type AllTutorialsState = Record<'flowchart' | 'structure' | 'ipo', TutorialProgressState>;

const defaultState: AllTutorialsState = {
  flowchart: { step: 0, completed: false, skipped: false, isMinimized: false },
  structure: { step: 0, completed: false, skipped: false, isMinimized: false },
  ipo: { step: 0, completed: false, skipped: false, isMinimized: false },
};

export function getAllTutorialProgress(): AllTutorialsState {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function saveTutorialProgress(
  mode: 'flowchart' | 'structure' | 'ipo',
  updates: Partial<TutorialProgressState>
): AllTutorialsState {
  const all = getAllTutorialProgress();
  all[mode] = { ...all[mode], ...updates };
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  return all;
}

export function resetTutorialProgress(mode: 'flowchart' | 'structure' | 'ipo'): AllTutorialsState {
  const all = getAllTutorialProgress();
  all[mode] = { step: 0, completed: false, skipped: false, isMinimized: false };
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(all));
  } catch {}
  return all;
}
