import type { AssessmentQuestion } from '../types';

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Modul 1
  {
    id: 'q-1-1',
    moduleId: 1,
    difficulty: 'Dasar',
    prompt: 'Manakah sifat utama yang wajib dimiliki sebuah algoritma yang baik?',
    options: [
      'Memiliki langkah terbatas, jelas (tidak ambigu), dan berhenti menghasilkan output',
      'Harus selalu ditulis dalam bahasa mesin biner',
      'Tidak boleh menerima input dari pengguna',
      'Hanya dapat berjalan jika terdiri dari minimal 100 baris',
    ],
    correctIndex: 0,
    explanation: 'Algoritma harus definit (jelas), finit (berhenti dalam langkah terbatas), memiliki input/output terdefinisi, dan efektif.',
  },
  {
    id: 'q-1-2',
    moduleId: 1,
    difficulty: 'Dasar',
    prompt: 'Mengapa Python dikelompokkan sebagai bahasa pemrograman berorientasi keterbacaan tinggi (high-level interpreted)?',
    options: [
      'Sintaksnya mendekati bahasa manusia dan dieksekusi langsung oleh interpreter',
      'Kode Python hanya berjalan tanpa sistem operasi',
      'Python tidak mendukung variabel numerik',
      'Python mewajibkan deklarasi tipe memori manual seperti pointer',
    ],
    correctIndex: 0,
    explanation: 'Python menekankan keterbacaan sintaks dan dieksekusi oleh interpreter sehingga mempercepat iterasi belajar dan pengembangan.',
  },

  // Modul 2
  {
    id: 'q-2-1',
    moduleId: 2,
    difficulty: 'Dasar',
    prompt: 'Perhatikan potongan kode berikut. Output apa yang dihasilkan?',
    code: `a = "12"\nb = "8"\nprint(a + b)`,
    options: ['20', '"128" (teks 128)', 'Error TypeError', '12 8'],
    correctIndex: 1,
    explanation: 'Operator + pada dua string melakukan penggabungan teks (concatenation), menghasilkan "128".',
  },
  {
    id: 'q-2-2',
    moduleId: 2,
    difficulty: 'Dasar',
    prompt: 'Manakah penamaan variabel yang VALID menurut aturan Python?',
    options: ['2_nilai', 'nilai-akhir', 'nilai_akhir_2', 'class'],
    correctIndex: 2,
    explanation: 'Nama variabel boleh memakai huruf, angka, dan underscore (_), tidak boleh diawali angka, tidak boleh memakai tanda hubung (-), dan bukan keyword.',
  },

  // Modul 3
  {
    id: 'q-3-1',
    moduleId: 3,
    difficulty: 'Dasar',
    prompt: 'Berapakah hasil akhir variabel x pada kode berikut?',
    code: `x = 2 + 3 * 4 ** 2 // 6`,
    options: ['10', '13', '26', '8'],
    correctIndex: 0,
    explanation: 'Urutan prioritas: 4**2 = 16 -> 3*16 = 48 -> 48 // 6 = 8 -> 2 + 8 = 10.',
  },
  {
    id: 'q-3-2',
    moduleId: 3,
    difficulty: 'Menengah',
    prompt: 'Evaluasi ekspresi logika: not (5 > 2 and 3 == 4) or False menghasilkan...',
    options: ['True', 'False', 'None', 'Error'],
    correctIndex: 0,
    explanation: '(True and False) -> False. not False -> True. True or False -> True.',
  },

  // Modul 4
  {
    id: 'q-4-1',
    moduleId: 4,
    difficulty: 'Dasar',
    prompt: 'Apa output yang dicetak kode percabangan berikut?',
    code: `x = 15\nif x % 3 == 0 and x % 5 == 0:\n    print("FizzBuzz")\nelif x % 3 == 0:\n    print("Fizz")\nelse:\n    print("Lainnya")`,
    options: ['Fizz', 'FizzBuzz', 'Lainnya', 'Fizz dan FizzBuzz'],
    correctIndex: 1,
    explanation: '15 habis dibagi 3 dan habis dibagi 5, sehingga cabang pertama langsung terpenuhi dan mencetak FizzBuzz.',
  },
  {
    id: 'q-4-2',
    moduleId: 4,
    difficulty: 'Menengah',
    prompt: 'Apa yang dicetak jika nilai = 60?',
    code: `nilai = 60\nstatus = "Lulus" if nilai >= 60 else "Ulang"\nprint(status)`,
    options: ['Lulus', 'Ulang', 'True', '60'],
    correctIndex: 0,
    explanation: 'Karena 60 >= 60 bernilai True, ekspresi ternary mengembalikan "Lulus".',
  },

  // Modul 5
  {
    id: 'q-5-1',
    moduleId: 5,
    difficulty: 'Menengah',
    prompt: 'Berapakah nilai akhir variabel total setelah loop selesai?',
    code: `total = 0\nfor i in range(1, 6):\n    if i == 3:\n        continue\n    total += i\nprint(total)`,
    options: ['15', '12', '3', '10'],
    correctIndex: 1,
    explanation: 'Iterasi menjumlahkan 1 + 2 + 4 + 5 = 12 karena saat i == 3, pernyataan continue melewati penjumlahan.',
  },
  {
    id: 'q-5-2',
    moduleId: 5,
    difficulty: 'Dasar',
    prompt: 'Mengapa loop while berikut berbahaya jika dijalankan?',
    code: `i = 1\nwhile i <= 5:\n    print(i)`,
    options: [
      'Terjadi infinite loop karena nilai i tidak pernah bertambah',
      'Terjadi SyntaxError karena kurang titik koma',
      'Loop tidak berjalan sama sekali',
      'Fungsi print tidak bisa dipakai di dalam while',
    ],
    correctIndex: 0,
    explanation: 'Kondisi i <= 5 selalu True karena tidak ada pernyataan i += 1 di dalam blok while.',
  },

  // Modul 6
  {
    id: 'q-6-1',
    moduleId: 6,
    difficulty: 'Menengah',
    prompt: 'Apa output dari program berikut?',
    code: `def tambah(a, b=5):\n    return a + b\n\nprint(tambah(4), tambah(4, 2))`,
    options: ['9 6', '4 6', '9 9', 'TypeError'],
    correctIndex: 0,
    explanation: 'tambah(4) memakai default b=5 (hasil 9), sedangkan tambah(4, 2) menimpa b dengan 2 (hasil 6).',
  },
  {
    id: 'q-6-2',
    moduleId: 6,
    difficulty: 'Menengah',
    prompt: 'Apa yang terjadi jika mencoba mencetak variabel lokal milik fungsi dari luar fungsi?',
    options: [
      'Menimbulkan NameError karena variabel lokal tidak dikenal di scope global',
      'Otomatis mencetak angka 0',
      'Mencetak nilai terakhir variabel tersebut',
      'Mengubah variabel menjadi konstanta',
    ],
    correctIndex: 0,
    explanation: 'Variabel lokal hanya berlaku di dalam blok fungsi tempat ia dibuat.',
  },

  // Modul 7
  {
    id: 'q-7-1',
    moduleId: 7,
    difficulty: 'Menengah',
    prompt: 'Berapakah hasil dari pemanggilan hitung(4)?',
    code: `def hitung(n):\n    if n == 0:\n        return 0\n    return n + hitung(n - 1)`,
    options: ['4', '10', '24', '6'],
    correctIndex: 1,
    explanation: 'Rekursi menghitung 4 + 3 + 2 + 1 + 0 = 10.',
  },
  {
    id: 'q-7-2',
    moduleId: 7,
    difficulty: 'Menengah',
    prompt: 'Apa hasil dari ekspresi list(map(lambda x: x + 1, [10, 20, 30]))?',
    options: ['[11, 21, 31]', '[10, 20, 30, 1]', '[1, 2, 3]', '60'],
    correctIndex: 0,
    explanation: 'map menerapkan lambda x: x + 1 ke setiap elemen list, menghasilkan [11, 21, 31].',
  },

  // Modul 8
  {
    id: 'q-8-1',
    moduleId: 8,
    difficulty: 'Dasar',
    prompt: 'Apa hasil akhir variabel potongan pada kode berikut?',
    code: `data = [5, 10, 15, 20, 25]\npotongan = data[-3:]`,
    options: ['[15, 20, 25]', '[5, 10, 15]', '[20, 25]', '[25, 20, 15]'],
    correctIndex: 0,
    explanation: 'Slicing [-3:] mengambil 3 elemen terakhir dari list secara berurutan: [15, 20, 25].',
  },
  {
    id: 'q-8-2',
    moduleId: 8,
    difficulty: 'Menengah',
    prompt: 'Manakah pernyataan yang BENAR mengenai perbedaan List dan Tuple?',
    options: [
      'List bersifat mutable (dapat diubah), sedangkan Tuple bersifat immutable (tetap)',
      'Tuple ditulis dengan kurung siku [ ], List dengan kurung biasa ( )',
      'Tuple tidak dapat menyimpan angka duplikat',
      'List tidak mendukung pengindeksan negatif',
    ],
    correctIndex: 0,
    explanation: 'Perbedaan fundamental keduanya adalah mutabilitas: elemen list bisa diubah/ditambah, sedangkan tuple tetap.',
  },

  // Modul 9
  {
    id: 'q-9-1',
    moduleId: 9,
    difficulty: 'Menengah',
    prompt: 'Apa output dari operasi set berikut?',
    code: `a = {1, 2, 3, 4}\nb = {3, 4, 5}\nprint(len(a | b))`,
    options: ['7', '5', '2', '4'],
    correctIndex: 1,
    explanation: 'Operator | (union) menggabungkan kedua himpunan tanpa duplikat: {1, 2, 3, 4, 5}, panjangnya 5.',
  },
  {
    id: 'q-9-2',
    moduleId: 9,
    difficulty: 'Dasar',
    prompt: 'Method dictionary apa yang mengembalikan pasangan (key, value) untuk diiterasi dalam loop for?',
    options: ['.items()', '.pairs()', '.entries()', '.elements()'],
    correctIndex: 0,
    explanation: 'dict.items() mengembalikan pasangan tuple (key, value) yang ideal untuk loop for k, v in d.items().',
  },

  // Modul 10
  {
    id: 'q-10-1',
    moduleId: 10,
    difficulty: 'Menengah',
    prompt: 'Pada list terurut berisi 16 elemen, paling banyak berapa kali perbandingan titik tengah dibutuhkan Binary Search?',
    options: ['Sekitar 4-5 langkah (O(log n))', 'Selalu 16 langkah', '32 langkah', '1 langkah saja'],
    correctIndex: 0,
    explanation: 'Karena setiap langkah membuang separuh elemen, log2(16) = 4, sehingga sangat efisien dibanding Linear Search.',
  },
  {
    id: 'q-10-2',
    moduleId: 10,
    difficulty: 'Menengah',
    prompt: 'Setelah 1 pass penuh Bubble Sort (menaik) pada [9, 4, 7, 2], posisi elemen 9 berada di...',
    options: ['Indeks paling akhir (kanan)', 'Indeks paling awal (kiri)', 'Indeks tengah', 'Tetap di posisi semula'],
    correctIndex: 0,
    explanation: 'Bubble Sort menggeser elemen terbesar melalui pertukaran berpasangan hingga tiba di ujung paling kanan pada akhir pass pertama.',
  },

  // Modul 11
  {
    id: 'q-11-1',
    moduleId: 11,
    difficulty: 'Dasar',
    prompt: 'Apa output dari potongan kode OOP berikut?',
    code: `class Counter:\n    def __init__(self):\n        self.nilai = 0\n    def naik(self):\n        self.nilai += 2\n\nc = Counter()\nc.naik()\nc.naik()\nprint(c.nilai)`,
    options: ['0', '2', '4', 'Error'],
    correctIndex: 2,
    explanation: 'nilai dimulai dari 0, lalu method naik() dipanggil dua kali (+2 +2) sehingga c.nilai menjadi 4.',
  },
  {
    id: 'q-11-2',
    moduleId: 11,
    difficulty: 'Dasar',
    prompt: 'Hubungan yang paling tepat untuk menggambarkan Class dan Object adalah...',
    options: [
      'Class adalah cetak biru (blueprint), sedangkan Object adalah hasil instansiasi nyatanya',
      'Object adalah induk dari semua file Python, Class adalah variabel angka',
      'Class hanya boleh memiliki satu Object saja',
      'Keduanya adalah istilah yang sama untuk fungsi rekursif',
    ],
    correctIndex: 0,
    explanation: 'Satu Class dapat melahirkan banyak Object (instance) dengan struktur atribut serupa namun nilai berbeda.',
  },

  // Modul 12
  {
    id: 'q-12-1',
    moduleId: 12,
    difficulty: 'Lanjut',
    prompt: 'Apa output yang dicetak oleh kode pewarisan berikut?',
    code: `class A:\n    def pesan(self):\n        return "Induk"\n\nclass B(A):\n    def pesan(self):\n        return super().pesan() + " -> Anak"\n\nprint(B().pesan())`,
    options: ['Induk', 'Anak', 'Induk -> Anak', 'TypeError'],
    correctIndex: 2,
    explanation: 'super().pesan() memanggil method milik class induk A ("Induk"), lalu digabung dengan " -> Anak".',
  },
  {
    id: 'q-12-2',
    moduleId: 12,
    difficulty: 'Menengah',
    prompt: 'Keuntungan utama menerapkan Inheritance (pewarisan) pada perancangan program adalah...',
    options: [
      'Mengurangi duplikasi kode dengan mewariskan atribut dan method umum dari parent class',
      'Menghapus kebutuhan akan fungsi __init__',
      'Membuat semua variabel menjadi tipe string',
      'Menghilangkan semua error runtime secara otomatis',
    ],
    correctIndex: 0,
    explanation: 'Inheritance memungkinkan kode umum ditulis sekali di parent class lalu diperluas atau disesuaikan di child class.',
  },

  // Modul 13
  {
    id: 'q-13-1',
    moduleId: 13,
    difficulty: 'Menengah',
    prompt: 'Apa output yang dihasilkan blok penanganan eksepsi berikut?',
    code: `try:\n    daftar = [10, 20]\n    print(daftar[5])\nexcept IndexError:\n    print("Indeks salah")\nfinally:\n    print("Selesai")`,
    options: [
      'Indeks salah lalu Selesai',
      'Hanya Selesai',
      'Program crash dengan IndexError',
      '20 lalu Selesai',
    ],
    correctIndex: 0,
    explanation: 'daftar[5] memicu IndexError yang ditangkap blok except ("Indeks salah"), lalu blok finally selalu mencetak "Selesai".',
  },
  {
    id: 'q-13-2',
    moduleId: 13,
    difficulty: 'Lanjut',
    prompt: 'Apa perbedaan antara SyntaxError dan Logic Bug saat melakukan debugging?',
    options: [
      'SyntaxError mencegah program berjalan karena aturan bahasa dilanggar; Logic Bug berjalan tanpa error namun outputnya keliru',
      'Logic Bug selalu menghentikan interpreter sebelum baris pertama',
      'SyntaxError hanya terjadi pada operasi pembagian nol',
      'Keduanya dapat diatasi cukup dengan menambahkan blok try/except',
    ],
    correctIndex: 0,
    explanation: 'SyntaxError terdeteksi saat parsing kode; Logic Bug memerlukan penelusuran alur data (tracing) karena program tetap berjalan normal.',
  },
];
