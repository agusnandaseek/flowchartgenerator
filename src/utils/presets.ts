import type { PresetItem } from '../types/flowchart';

export const FLOWCHART_PRESETS: PresetItem[] = [
  {
    id: 'start',
    label: 'Mulai',
    category: 'terminator',
    shapeName: 'Oval / Kapsul',
    iconName: 'PlayCircle',
    description: 'Titik awal jalannya diagram alur',
    snippet: 'MULAI\n',
  },
  {
    id: 'end',
    label: 'Selesai',
    category: 'terminator',
    shapeName: 'Oval / Kapsul',
    iconName: 'StopCircle',
    description: 'Titik akhir dari proses diagram alur',
    snippet: 'SELESAI\n',
  },
  {
    id: 'input',
    label: 'Input Data',
    category: 'io',
    shapeName: 'Jajar Genjang',
    iconName: 'ArrowRightToLine',
    description: 'Membaca atau menerima masukan data',
    snippet: 'MASUKKAN nama_variabel\n',
  },
  {
    id: 'output',
    label: 'Output Data',
    category: 'io',
    shapeName: 'Jajar Genjang',
    iconName: 'ArrowLeftFromLine',
    description: 'Menampilkan atau mencetak hasil ke pengguna',
    snippet: 'TAMPILKAN "Hasil: ", nilai\n',
  },
  {
    id: 'process',
    label: 'Proses / Rumus',
    category: 'process',
    shapeName: 'Persegi Panjang',
    iconName: 'Square',
    description: 'Operasi aritmatika, penugasan, atau pengolahan data',
    snippet: 'hasil = a + b\n',
  },
  {
    id: 'if-else',
    label: 'Percabangan (If)',
    category: 'decision',
    shapeName: 'Belah Ketupat',
    iconName: 'GitFork',
    description: 'Kondisi dengan dua alur logika (Ya / Tidak)',
    snippet: `JIKA nilai > 75 MAKA
    TAMPILKAN "Lulus"
LAINNYA
    TAMPILKAN "Perbaikan"
AKHIR-JIKA\n`,
  },
  {
    id: 'loop-while',
    label: 'Perulangan (While)',
    category: 'loop',
    shapeName: 'Belah Ketupat Loop',
    iconName: 'Repeat',
    description: 'Perulangan yang berjalan selama kondisi terpenuhi',
    snippet: `SELAMA i < 5 LAKUKAN
    TAMPILKAN "Iterasi ke-", i
    i = i + 1
AKHIR-SELAMA\n`,
  },
];
