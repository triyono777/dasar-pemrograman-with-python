import type { CurriculumModule } from '../types';

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 1,
    slug: 'konsep-dasar-algoritma',
    shortTitle: 'Konsep & Algoritma',
    title: 'Konsep Dasar Pemrograman, Algoritma & Ekosistem Python',
    category: 'Fondasi',
    durationMinutes: 15,
    xpReward: 100,
    overview:
      'Memahami cara komputer mengeksekusi instruksi berurutan (algoritma), peran interpreter Python, serta struktur dasar program pertama.',
    objectives: [
      'Menyusun langkah algoritma terstruktur (Input -> Proses -> Output).',
      'Memahami cara kerja interpreter Python mengeksekusi kode baris demi baris.',
      'Menulis dan menjalankan program Python sederhana menggunakan print().',
    ],
    concepts: [
      {
        title: 'Algoritma: Urutan Langkah yang Jelas',
        summary:
          'Algoritma adalah serangkaian langkah logis, terbatas, dan tidak ambigu untuk menyelesaikan masalah sebelum ditulis dalam bahasa pemrograman.',
        code: `# Contoh algoritma menghitung luas persegi panjang
panjang = 12
lebar = 5
luas = panjang * lebar
print("Luas bidang:", luas)`,
        keyTakeaway: 'Urutan baris sangat menentukan hasil — variabel harus didefinisikan sebelum dipakai.',
      },
      {
        title: 'Ekosistem & Interpreter Python',
        summary:
          'Python bersifat interpreted dan memiliki sintaks yang ringkas sehingga banyak digunakan di ilmu data, web backend, otomasi, dan pembelajaran algoritma.',
        code: `# Komentar diawali tanda pagar (#) dan diabaikan interpreter
print("Selamat datang di Dasar Pemrograman")
print("Versi kurikulum:", 2026)`,
        keyTakeaway: 'Gunakan komentar untuk menjelaskan alasan di balik logika kode, bukan mengulang sintaks.',
      },
    ],
    sandboxStarter: `# Program pertama: alur Input -> Proses -> Output
panjang = 14
lebar = 6
keliling = 2 * (panjang + lebar)
luas = panjang * lebar

print("Panjang:", panjang)
print("Lebar:", lebar)
print("Keliling:", keliling)
print("Luas:", luas)`,
    labChallenge: {
      title: 'Tantangan Lab 01: Kalkulator Waktu Tempuh',
      instruction:
        'Buat variabel jarak = 120 dan kecepatan = 40, lalu hitung variabel waktu = jarak / kecepatan dan cetak hasilnya dengan print(waktu).',
      starterCode: `# Lengkapi algoritma waktu tempuh di bawah ini
jarak = 120
kecepatan = 40
# Hitung variabel waktu dan cetak
`,
      solutionCode: `jarak = 120
kecepatan = 40
waktu = jarak / kecepatan
print(waktu)`,
      expectedOutputIncludes: ['3'],
      expectedVariables: { waktu: 3 },
      hint: 'Tulis waktu = jarak / kecepatan lalu tambahkan print(waktu).',
    },
    checkpoints: [
      {
        id: 'cp-1-1',
        prompt: 'Urutan tahapan dasar dalam sebuah algoritma komputasi yang tepat adalah...',
        options: [
          'Input -> Proses -> Output',
          'Output -> Input -> Proses',
          'Proses -> Output -> Input',
          'Kompilasi -> Output -> Variabel',
        ],
        correctIndex: 0,
        explanation: 'Algoritma menerima masukan (Input), mengolahnya secara logis (Proses), lalu menghasilkan keluaran (Output).',
      },
      {
        id: 'cp-1-2',
        prompt: 'Fungsi tanda pagar (#) pada baris kode Python adalah...',
        options: [
          'Membuat variabel bertipe teks',
          'Menulis komentar yang tidak dieksekusi oleh interpreter',
          'Menghentikan program secara paksa',
          'Mengimpor pustaka eksternal',
        ],
        correctIndex: 1,
        explanation: 'Teks setelah tanda # pada satu baris dianggap komentar dokumentasi dan diabaikan saat eksekusi.',
      },
    ],
    miniGameId: 'mg-1',
  },
  {
    id: 2,
    slug: 'variabel-tipe-data-io',
    shortTitle: 'Variabel, Tipe Data & I/O',
    title: 'Variabel, Tipe Data Primitif, dan Input/Output',
    category: 'Fondasi',
    durationMinutes: 20,
    xpReward: 110,
    overview:
      'Mengenal penyimpanan nilai di memori melalui variabel, empat tipe data primitif Python (int, float, str, bool), type casting, serta format f-string.',
    objectives: [
      'Membedakan tipe data int, float, str, dan bool secara tepat.',
      'Melakukan konversi tipe data (type casting) dari hasil input().',
      'Menampilkan output rapi menggunakan f-string.',
    ],
    concepts: [
      {
        title: 'Empat Tipe Data Primitif Utama',
        summary:
          'Python menggunakan dynamic typing: tipe variabel ditentukan otomatis berdasarkan nilai yang diberikan.',
        code: `usia = 19               # int (bilangan bulat)
ipk = 3.85              # float (bilangan desimal)
prodi = "Informatika"   # str (teks)
aktif = True            # bool (True / False)
print(type(ipk))`,
        keyTakeaway: 'Perhatikan tanda kutip: "19" bertipe str, sedangkan 19 bertipe int.',
      },
      {
        title: 'Input, Type Casting & f-string',
        summary:
          'Fungsi input() selalu mengembalikan string (str). Untuk perhitungan numerik, ubah terlebih dahulu memakai int() atau float().',
        code: `nama = input("Nama mahasiswa: ")
sks = int(input("Jumlah SKS: "))
print(f"Halo {nama}, beban studi Anda {sks} SKS.")`,
        keyTakeaway: 'f-string mempermudah penyisipan ekspresi langsung di dalam kurung kurawal {}.',
      },
    ],
    sandboxStarter: `nama = input("Nama: ")
nilai_tugas = int(input("Nilai tugas: "))
ipk = 3.78
lulus = True

print(f"Mahasiswa: {nama}")
print(f"Nilai + Bonus: {nilai_tugas + 5}")
print("Tipe ipk:", type(ipk))`,
    sandboxInputs: ['Rina', '85'],
    labChallenge: {
      title: 'Tantangan Lab 02: Konversi Suhu Celcius ke Fahrenheit',
      instruction:
        'Buat variabel celcius = 25 (int), hitung fahrenheit = (celcius * 9 / 5) + 32, lalu cetak hasilnya dengan f-string agar memuat angka 77.',
      starterCode: `celcius = 25
# Hitung variabel fahrenheit dan tampilkan hasilnya
`,
      solutionCode: `celcius = 25
fahrenheit = (celcius * 9 / 5) + 32
print(f"{celcius} C = {fahrenheit} F")`,
      expectedOutputIncludes: ['77'],
      expectedVariables: { fahrenheit: 77 },
      hint: 'Rumus: fahrenheit = (celcius * 9 / 5) + 32 lalu print(f"{fahrenheit}").',
    },
    checkpoints: [
      {
        id: 'cp-2-1',
        prompt: 'Apa tipe data dari variabel x pada pernyataan x = "42"?',
        options: ['int', 'float', 'str', 'bool'],
        correctIndex: 2,
        explanation: 'Nilai yang diapit tanda kutip tunggal atau ganda selalu bertipe str (string).',
      },
      {
        id: 'cp-2-2',
        prompt: 'Mengapa hasil input() perlu dibungkus int() sebelum dijumlahkan dengan angka?',
        options: [
          'Karena input() selalu mengembalikan tipe str',
          'Karena Python tidak memiliki tipe angka bulat',
          'Agar output otomatis dibulatkan ke bawah',
          'Karena print() hanya menerima angka',
        ],
        correctIndex: 0,
        explanation: 'Nilai bawaan input() adalah string sehingga perlu konversi ke int() atau float() agar operasi aritmatika berjalan.',
      },
    ],
    miniGameId: 'mg-2',
  },
  {
    id: 3,
    slug: 'operator-logika-ekspresi',
    shortTitle: 'Operator & Logika',
    title: 'Operator Aritmatika, Perbandingan, Logika, dan Ekspresi',
    category: 'Fondasi',
    durationMinutes: 20,
    xpReward: 110,
    overview:
      'Menguasai operator aritmatika khusus Python (//, %, **), operator perbandingan, logika boolean (and, or, not), dan urutan prioritas eksekusi.',
    objectives: [
      'Membedakan pembagian normal (/), pembagian bulat (//), dan sisa bagi (%).',
      'Menyusun ekspresi boolean gabungan dengan and, or, dan not.',
      'Memahami prioritas operator agar terhindar dari bug perhitungan.',
    ],
    concepts: [
      {
        title: 'Aritmatika Presisi: /, //, %, dan **',
        summary:
          'Python membedakan hasil pembagian desimal (/) dengan pembagian bulat ke bawah (//) serta sisa bagi modulo (%) dan pangkat (**).',
        code: `print(17 / 5)   # 3.4 (float)
print(17 // 5)  # 3 (hasil bagi bulat)
print(17 % 5)   # 2 (sisa bagi)
print(2 ** 4)   # 16 (pangkat)`,
        keyTakeaway: 'Operator % sangat berguna untuk mengecek bilangan genap/ganjil (n % 2 == 0).',
      },
      {
        title: 'Perbandingan & Logika Boolean',
        summary:
          'Ekspresi perbandingan menghasilkan True atau False yang dapat digabungkan dengan operator logika and, or, dan not.',
        code: `nilai = 82
hadir = 90
lulus = (nilai >= 70) and (hadir >= 75)
print("Status lulus:", lulus)`,
        keyTakeaway: 'Operator and bernilai True hanya jika seluruh syarat bernilai True.',
      },
    ],
    sandboxStarter: `total_detik = 3725
jam = total_detik // 3600
sisa = total_detik % 3600
menit = sisa // 60
detik = sisa % 60

print(f"{jam} jam {menit} menit {detik} detik")
print("Lebih dari 1 jam?", jam >= 1 and menit > 0)`,
    labChallenge: {
      title: 'Tantangan Lab 03: Pengecek Syarat Beasiswa',
      instruction:
        'Diberikan ipk = 3.65 dan sks = 20. Buat variabel layak yang bernilai True jika ipk >= 3.5 dan sks >= 18, lalu cetak variabel layak.',
      starterCode: `ipk = 3.65
sks = 20
# Tentukan variabel layak dengan operator perbandingan dan and
`,
      solutionCode: `ipk = 3.65
sks = 20
layak = ipk >= 3.5 and sks >= 18
print(layak)`,
      expectedOutputIncludes: ['True'],
      expectedVariables: { layak: true },
      hint: 'Tulis layak = ipk >= 3.5 and sks >= 18 lalu print(layak).',
    },
    checkpoints: [
      {
        id: 'cp-3-1',
        prompt: 'Berapakah hasil dari ekspresi Python 19 // 4 + 19 % 4?',
        options: ['7', '6', '7.75', '5'],
        correctIndex: 0,
        explanation: '19 // 4 menghasilkan 4, dan 19 % 4 menghasilkan 3. Jadi 4 + 3 = 7.',
      },
      {
        id: 'cp-3-2',
        prompt: 'Hasil dari ekspresi (5 > 3) and (2 == 4) or (not False) adalah...',
        options: ['False', 'True', 'None', 'SyntaxError'],
        correctIndex: 1,
        explanation: '(True and False) menghasilkan False, lalu False or True menghasilkan True.',
      },
    ],
    miniGameId: 'mg-3',
  },
  {
    id: 4,
    slug: 'struktur-kendali-kondisi',
    shortTitle: 'Percabangan (If/Elif)',
    title: 'Struktur Kendali Kondisi (Percabangan)',
    category: 'Alur Kontrol',
    durationMinutes: 20,
    xpReward: 120,
    overview:
      'Mengarahkan jalur eksekusi program secara dinamis berdasarkan kondisi boolean menggunakan if, elif, else, dan indentasi blok Python.',
    objectives: [
      'Menulis percabangan bertingkat if, elif, dan else dengan indentasi tepat.',
      'Menghindari kesalahan urutan kondisi pada rentang nilai.',
      'Menerapkan percabangan bersarang (nested if) untuk validasi berlapis.',
    ],
    concepts: [
      {
        title: 'Struktur if - elif - else',
        summary:
          'Python mengevaluasi kondisi dari atas ke bawah dan hanya mengeksekusi blok pertama yang bernilai True.',
        code: `skor = 78
if skor >= 85:
    predikat = "A"
elif skor >= 70:
    predikat = "B"
else:
    predikat = "C"
print("Predikat:", predikat)`,
        keyTakeaway: 'Indentasi 4 spasi mendefinisikan blok kode yang termasuk di dalam cabang kondisi.',
      },
      {
        title: 'Ekspresi Kondisional Satu Baris',
        summary:
          'Untuk penetapan nilai sederhana dua cabang, Python menyediakan ekspresi ternary yang tetap mudah dibaca.',
        code: `angka = 11
jenis = "Genap" if angka % 2 == 0 else "Ganjil"
print(angka, "adalah bilangan", jenis)`,
        keyTakeaway: 'Gunakan ternary hanya untuk logika singkat; pakai blok if/elif untuk cabang kompleks.',
      },
    ],
    sandboxStarter: `nilai = 82
presensi = 80

if presensi < 75:
    status = "Tidak Lulus (Presensi Kurang)"
elif nilai >= 85:
    status = "Lulus Dengan Pujian (A)"
elif nilai >= 70:
    status = "Lulus Baik (B)"
else:
    status = "Perlu Remedial"

print("Status akhir:", status)`,
    labChallenge: {
      title: 'Tantangan Lab 04: Kategori Diskon Belanja',
      instruction:
        'Diberikan total = 250000. Jika total >= 200000 maka diskon = 20, elif total >= 100000 maka diskon = 10, else diskon = 0. Cetak variabel diskon.',
      starterCode: `total = 250000
# Tulis struktur if / elif / else untuk menentukan diskon
`,
      solutionCode: `total = 250000
if total >= 200000:
    diskon = 20
elif total >= 100000:
    diskon = 10
else:
    diskon = 0
print(diskon)`,
      expectedOutputIncludes: ['20'],
      expectedVariables: { diskon: 20 },
      hint: 'Pastikan kondisi >= 200000 dicek lebih dulu sebelum >= 100000.',
    },
    checkpoints: [
      {
        id: 'cp-4-1',
        prompt: 'Jika nilai = 90 dan cabang pertama adalah "if nilai >= 70:" diikuti "elif nilai >= 85:", cabang mana yang dijalankan?',
        options: [
          'Cabang pertama (if nilai >= 70)',
          'Cabang kedua (elif nilai >= 85)',
          'Keduanya dijalankan bersamaan',
          'Tidak ada cabang yang dijalankan',
        ],
        correctIndex: 0,
        explanation: 'Karena 90 >= 70 sudah bernilai True, Python langsung menjalankan blok pertama dan melewati elif berikutnya.',
      },
      {
        id: 'cp-4-2',
        prompt: 'Apa yang menentukan sekumpulan baris termasuk ke dalam blok if di Python?',
        options: [
          'Tanda kurung kurawal { }',
          'Kata kunci begin dan end',
          'Indentasi spasi yang sejajar',
          'Tanda titik koma (;) di akhir baris',
        ],
        correctIndex: 2,
        explanation: 'Python menggunakan indentasi (standar 4 spasi) untuk mengelompokkan blok pernyataan.',
      },
    ],
    miniGameId: 'mg-4',
  },
  {
    id: 5,
    slug: 'struktur-perulangan-looping',
    shortTitle: 'Perulangan (Looping)',
    title: 'Struktur Perulangan (Looping)',
    category: 'Alur Kontrol',
    durationMinutes: 25,
    xpReward: 120,
    overview:
      'Mengotomatisasi eksekusi berulang menggunakan for + range(), while loop, akumulator, serta pengendalian iterasi break dan continue.',
    objectives: [
      'Memilih antara perulangan for (terukur) dan while (berbasis kondisi).',
      'Menggunakan range(start, stop, step) secara akurat.',
      'Mengontrol aliran iterasi dengan break dan continue.',
    ],
    concepts: [
      {
        title: 'Perulangan for dan range()',
        summary:
          'range(start, stop, step) menghasilkan barisan bilangan dari start hingga sebelum stop (nilai stop tidak ikut).',
        code: `total = 0
for i in range(1, 6):
    total += i
print("Jumlah 1..5 =", total)`,
        keyTakeaway: 'range(1, 6) menghasilkan 1, 2, 3, 4, 5 — batas atas selalu eksklusif.',
      },
      {
        title: 'while Loop, break, dan continue',
        summary:
          'while terus berjalan selama kondisi bernilai True. Pastikan variabel kontrol selalu berubah agar tidak terjadi infinite loop.',
        code: `n = 1
while n <= 6:
    if n == 4:
        break
    print("Iterasi:", n)
    n += 1`,
        keyTakeaway: 'break keluar dari loop sepenuhnya; continue melompat ke iterasi berikutnya.',
      },
    ],
    sandboxStarter: `# Menghitung jumlah bilangan genap dari 1 sampai 10
jumlah_genap = 0
for angka in range(1, 11):
    if angka % 2 != 0:
        continue
    jumlah_genap += angka
    print("Menambah:", angka)

print("Total bilangan genap:", jumlah_genap)`,
    labChallenge: {
      title: 'Tantangan Lab 05: Akumulator Kelipatan 3',
      instruction:
        'Gunakan loop for untuk menjumlahkan semua bilangan kelipatan 3 dari 3 sampai 15 (3, 6, 9, 12, 15) ke variabel total, lalu cetak total.',
      starterCode: `total = 0
# Gunakan for i in range(...) untuk menjumlahkan 3, 6, 9, 12, 15
`,
      solutionCode: `total = 0
for i in range(3, 16, 3):
    total += i
print(total)`,
      expectedOutputIncludes: ['45'],
      expectedVariables: { total: 45 },
      hint: 'Gunakan range(3, 16, 3) lalu total += i di dalam loop.',
    },
    checkpoints: [
      {
        id: 'cp-5-1',
        prompt: 'Berapa kali tubuh loop pada "for i in range(2, 10, 2):" akan dijalankan?',
        options: ['3 kali', '4 kali', '5 kali', '8 kali'],
        correctIndex: 1,
        explanation: 'range(2, 10, 2) menghasilkan 2, 4, 6, 8 — total 4 iterasi.',
      },
      {
        id: 'cp-5-2',
        prompt: 'Perbedaan utama antara break dan continue di dalam loop adalah...',
        options: [
          'break menghentikan seluruh loop, continue hanya melewati sisa iterasi saat ini',
          'continue menghentikan seluruh program, break hanya menghentikan fungsi',
          'break hanya dipakai di for, continue hanya di while',
          'Keduanya memiliki perilaku yang sama persis',
        ],
        correctIndex: 0,
        explanation: 'break langsung keluar dari blok perulangan, sedangkan continue langsung melanjutkan ke putaran berikutnya.',
      },
    ],
    miniGameId: 'mg-5',
  },
  {
    id: 6,
    slug: 'fungsi-modular',
    shortTitle: 'Fungsi Modular',
    title: 'Fungsi Modular: Parameter dan Return Value',
    category: 'Modularisasi',
    durationMinutes: 25,
    xpReward: 130,
    overview:
      'Memecah program besar menjadi fungsi reusable dengan def, parameter posisional/default, nilai kembalian (return), dan ruang lingkup variabel (scope).',
    objectives: [
      'Mendefinisikan fungsi dengan parameter dan nilai default.',
      'Membedakan fungsi yang mengembalikan nilai (return) dengan sekadar print().',
      'Memahami scope variabel lokal dan global.',
    ],
    concepts: [
      {
        title: 'Parameter, Default Value & Return',
        summary:
          'Fungsi menerima input lewat parameter dan mengirimkan hasil olahan ke pemanggil lewat kata kunci return.',
        code: `def hitung_harga(harga, diskon=10):
    potongan = harga * (diskon / 100)
    return harga - potongan

bayar = hitung_harga(100000, 15)
print("Total bayar:", bayar)`,
        keyTakeaway: 'Nilai return dapat disimpan ke variabel atau dipakai lagi di ekspresi lain, berbeda dengan print().',
      },
      {
        title: 'Scope Lokal vs Global',
        summary:
          'Variabel yang dibuat di dalam fungsi bersifat lokal dan hanya hidup selama fungsi dieksekusi.',
        code: `faktor = 2  # global
def kalikan(x):
    hasil = x * faktor  # lokal
    return hasil

print(kalikan(8))`,
        keyTakeaway: 'Sebaiknya kirim data melalui parameter agar fungsi mudah diuji dan tidak bergantung pada state global.',
      },
    ],
    sandboxStarter: `def hitung_bmi(berat_kg, tinggi_m):
    bmi = berat_kg / (tinggi_m ** 2)
    return round(bmi, 1)

def kategori_bmi(bmi):
    if bmi < 18.5:
        return "Kurus"
    elif bmi < 25:
        return "Normal"
    return "Berlebih"

skor_bmi = hitung_bmi(64, 1.72)
print("BMI:", skor_bmi, "| Kategori:", kategori_bmi(skor_bmi))`,
    labChallenge: {
      title: 'Tantangan Lab 06: Fungsi Nilai Akhir',
      instruction:
        'Buat fungsi nilai_akhir(tugas, uts, uas) yang mengembalikan (0.3 * tugas) + (0.3 * uts) + (0.4 * uas). Panggil dengan nilai_akhir(80, 90, 85), simpan ke variabel hasil, dan cetak hasil.',
      starterCode: `# Definisikan fungsi nilai_akhir(tugas, uts, uas)

hasil = 0
print(hasil)`,
      solutionCode: `def nilai_akhir(tugas, uts, uas):
    return (0.3 * tugas) + (0.3 * uts) + (0.4 * uas)

hasil = nilai_akhir(80, 90, 85)
print(hasil)`,
      expectedOutputIncludes: ['85'],
      expectedVariables: { hasil: 85 },
      hint: 'Pastikan menggunakan return (0.3 * tugas) + (0.3 * uts) + (0.4 * uas).',
    },
    checkpoints: [
      {
        id: 'cp-6-1',
        prompt: 'Jika sebuah fungsi Python tidak memiliki pernyataan return, nilai apa yang dikembalikannya?',
        options: ['0', 'False', 'None', 'String kosong ""'],
        correctIndex: 2,
        explanation: 'Secara bawaan, fungsi tanpa return mengembalikan objek khusus None.',
      },
      {
        id: 'cp-6-2',
        prompt: 'Pada def sapa(nama="Mahasiswa"):, pemanggilan sapa() akan menghasilkan parameter nama bernilai...',
        options: ['Error TypeError', 'None', '"Mahasiswa"', '""'],
        correctIndex: 2,
        explanation: 'Parameter default digunakan otomatis bila argumen tidak diberikan saat pemanggilan.',
      },
    ],
    miniGameId: 'mg-6',
  },
  {
    id: 7,
    slug: 'modularisasi-lanjutan',
    shortTitle: 'Lambda, Rekursi & Modul',
    title: 'Modularisasi Lanjutan: Lambda, Rekursi, dan Import Modul',
    category: 'Modularisasi',
    durationMinutes: 25,
    xpReward: 140,
    overview:
      'Mengenal fungsi anonim lambda bersama map/filter, pemecahan masalah secara rekursif dengan base case, serta pemanfaatan modul standar seperti math.',
    objectives: [
      'Menulis fungsi singkat dengan lambda dan menerapkannya pada map/filter.',
      'Merancang fungsi rekursif dengan base case dan recursive case yang valid.',
      'Mengimpor dan menggunakan fungsi dari modul standar math.',
    ],
    concepts: [
      {
        title: 'Lambda, map(), dan filter()',
        summary:
          'lambda membuat fungsi satu baris tanpa nama, ideal untuk transformasi ringkas di dalam map() dan filter().',
        code: `angka = [2, 5, 8, 11, 14]
genap = filter(lambda x: x % 2 == 0, angka)
kuadrat = map(lambda x: x ** 2, genap)
print("Kuadrat genap:", kuadrat)`,
        keyTakeaway: 'Lambda hanya boleh berisi satu ekspresi dan otomatis mengembalikan nilainya.',
      },
      {
        title: 'Rekursi & Import Modul math',
        summary:
          'Rekursi memanggil dirinya sendiri hingga mencapai base case. Modul math menyediakan fungsi matematika siap pakai.',
        code: `import math

def faktorial(n):
    if n <= 1:
        return 1
    return n * faktorial(n - 1)

print("5! rekursif:", faktorial(5))
print("Akar 81:", math.sqrt(81))`,
        keyTakeaway: 'Tanpa base case yang dicapai, rekursi akan memicu RecursionError.',
      },
    ],
    sandboxStarter: `from math import sqrt, ceil

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

deret = [fibonacci(i) for i in range(7)]
print("Deret Fibonacci:", deret)
print("Sisi miring (3, 4):", sqrt(3**2 + 4**2))
print("Pembulatan ke atas 4.2:", ceil(4.2))`,
    labChallenge: {
      title: 'Tantangan Lab 07: Rekursi Jumlah Deret',
      instruction:
        'Buat fungsi rekursif jumlah_deret(n) yang mengembalikan 1 jika n <= 1, selain itu n + jumlah_deret(n - 1). Simpan hasil jumlah_deret(6) ke variabel hasil dan cetak.',
      starterCode: `def jumlah_deret(n):
    # Tulis base case dan recursive case
    return 0

hasil = jumlah_deret(6)
print(hasil)`,
      solutionCode: `def jumlah_deret(n):
    if n <= 1:
        return 1
    return n + jumlah_deret(n - 1)

hasil = jumlah_deret(6)
print(hasil)`,
      expectedOutputIncludes: ['21'],
      expectedVariables: { hasil: 21 },
      hint: 'Jika n <= 1: return 1, lalu return n + jumlah_deret(n - 1).',
    },
    checkpoints: [
      {
        id: 'cp-7-1',
        prompt: 'Komponen wajib pada fungsi rekursif agar tidak berjalan tanpa henti adalah...',
        options: ['Loop while', 'Base case (kondisi berhenti)', 'Keyword global', 'Import modul math'],
        correctIndex: 1,
        explanation: 'Base case menghentikan pemanggilan rekursif sehingga call stack dapat kembali menghasilkan nilai.',
      },
      {
        id: 'cp-7-2',
        prompt: 'Manakah penulisan lambda yang benar untuk mengalikan dua bilangan a dan b?',
        options: [
          'lambda a, b: a * b',
          'def lambda(a, b): return a * b',
          'lambda(a, b) => a * b',
          'lambda a, b: return a * b',
        ],
        correctIndex: 0,
        explanation: 'Sintaks lambda Python adalah "lambda parameter: ekspresi" tanpa kata kunci return.',
      },
    ],
    miniGameId: 'mg-7',
  },
  {
    id: 8,
    slug: 'collections-list-tuple',
    shortTitle: 'List & Tuple',
    title: 'Python Collections I: List dan Tuple',
    category: 'Struktur Data & Algoritma',
    durationMinutes: 25,
    xpReward: 130,
    overview:
      'Mengelola sekumpulan data berurutan menggunakan List (mutable) dan Tuple (immutable), indexing negatif, slicing, serta list comprehension.',
    objectives: [
      'Memanipulasi elemen List dengan append(), pop(), slicing, dan indexing negatif.',
      'Memahami perbedaan sifat mutable pada List vs immutable pada Tuple.',
      'Menyaring dan mentransformasi data secara ringkas lewat list comprehension.',
    ],
    concepts: [
      {
        title: 'List: Mutable, Indexing & Slicing',
        summary:
          'List ditulis dengan kurung siku [ ] dan isinya dapat ditambah, diubah, maupun dihapus kapan saja.',
        code: `nilai = [75, 80, 92, 88]
nilai.append(95)
print("Elemen terakhir:", nilai[-1])
print("Potongan [1:4]:", nilai[1:4])`,
        keyTakeaway: 'Indeks -1 selalu menunjuk elemen terakhir; slicing [a:b] mengambil indeks a hingga b-1.',
      },
      {
        title: 'Tuple: Immutable & Unpacking',
        summary:
          'Tuple ditulis dengan tanda kurung ( ) dan tidak dapat diubah isinya setelah dibuat — cocok untuk koordinat atau konstanta.',
        code: `koordinat = (-6.2, 106.8)
lintang, bujur = koordinat
print(f"Lat: {lintang}, Lon: {bujur}")`,
        keyTakeaway: 'Mencoba mengubah elemen tuple (misal koordinat[0] = 0) akan menghasilkan TypeError.',
      },
    ],
    sandboxStarter: `mata_kuliah = ["Algoritma", "Kalkulus", "Basis Data"]
mata_kuliah.append("Struktur Data")
print("Daftar MK:", mata_kuliah)
print("2 MK pertama:", mata_kuliah[:2])

nilai_ujian = [68, 74, 85, 92, 79]
lulus = [n for n in nilai_ujian if n >= 75]
print("Nilai lulus:", lulus)

batas_sks = (18, 24)
min_sks, max_sks = batas_sks
print(f"Rentang SKS: {min_sks}-{max_sks}")`,
    labChallenge: {
      title: 'Tantangan Lab 08: Filter Nilai Unggul',
      instruction:
        'Diberikan data = [65, 82, 90, 71, 88]. Buat list unggul berisi nilai >= 80 menggunakan list comprehension atau loop, lalu cetak unggul dan jumlah elemennya.',
      starterCode: `data = [65, 82, 90, 71, 88]
# Buat variabel list bernama unggul berisi nilai >= 80
`,
      solutionCode: `data = [65, 82, 90, 71, 88]
unggul = [x for x in data if x >= 80]
print(unggul)
print(len(unggul))`,
      expectedOutputIncludes: ['[82, 90, 88]', '3'],
      hint: 'Gunakan unggul = [x for x in data if x >= 80] lalu print(unggul) dan print(len(unggul)).',
    },
    checkpoints: [
      {
        id: 'cp-8-1',
        prompt: 'Jika angka = [10, 20, 30, 40, 50], hasil dari angka[1:4] adalah...',
        options: ['[10, 20, 30, 40]', '[20, 30, 40]', '[20, 30, 40, 50]', '[10, 20, 30]'],
        correctIndex: 1,
        explanation: 'Slicing [1:4] mengambil elemen pada indeks 1, 2, dan 3 yaitu 20, 30, dan 40.',
      },
      {
        id: 'cp-8-2',
        prompt: 'Mengapa Tuple lebih tepat dipakai untuk menyimpan koordinat tetap (x, y) dibanding List?',
        options: [
          'Tuple bersifat immutable sehingga melindungi data dari perubahan tak sengaja',
          'Tuple hanya bisa menyimpan tipe string',
          'List tidak dapat diindeks dengan angka',
          'Tuple dapat di-append lebih cepat',
        ],
        correctIndex: 0,
        explanation: 'Sifat immutable pada tuple menjamin data tidak berubah selama program berjalan.',
      },
    ],
    miniGameId: 'mg-8',
  },
  {
    id: 9,
    slug: 'collections-dict-set',
    shortTitle: 'Dictionary & Set',
    title: 'Python Collections II: Dictionary dan Set',
    category: 'Struktur Data & Algoritma',
    durationMinutes: 25,
    xpReward: 130,
    overview:
      'Menyimpan pasangan kunci-nilai yang cepat dicari dengan Dictionary serta mengelola elemen unik dan operasi himpunan matematika dengan Set.',
    objectives: [
      'Mengakses, menambah, dan mengiterasi Dictionary menggunakan .get() dan .items().',
      'Menghapus duplikasi data secara otomatis dengan Set.',
      'Menerapkan operasi himpunan union (|), intersection (&), dan difference (-).',
    ],
    concepts: [
      {
        title: 'Dictionary: Pasangan Key-Value',
        summary:
          'Dictionary memetakan kunci unik ke nilai tertentu dengan pencarian cepat. Gunakan .get() agar aman bila key tidak ada.',
        code: `mhs = {"nama": "Bima", "nilai": 88}
mhs["prodi"] = "Teknik Informatika"
print(mhs.get("nama"), "-", mhs.get("ipk", 0.0))`,
        keyTakeaway: 'Mengakses mhs["tidak_ada"] memicu KeyError, sedangkan mhs.get("tidak_ada", 0) aman.',
      },
      {
        title: 'Set: Elemen Unik & Operasi Himpunan',
        summary:
          'Set otomatis membuang duplikat dan mendukung operasi irisan (&), gabungan (|), serta selisih (-).',
        code: `kelas_a = {"Python", "SQL", "Git"}
kelas_b = {"Python", "Docker", "Git"}
print("Irisan:", kelas_a & kelas_b)
print("Gabungan:", kelas_a | kelas_b)`,
        keyTakeaway: 'Untuk membuat set kosong, gunakan set() karena {} kosong adalah dictionary.',
      },
    ],
    sandboxStarter: `stok = {"buku": 12, "pulpen": 25, "penggaris": 8}
stok["penghapus"] = 15

for barang, jumlah in stok.items():
    print(f"{barang}: {jumlah} unit")

peserta_a = {"Alya", "Budi", "Citra"}
peserta_b = {"Citra", "Dodi", "Alya"}
print("Hadir di keduanya:", peserta_a & peserta_b)`,
    labChallenge: {
      title: 'Tantangan Lab 09: Menghitung Elemen Unik & Lookup',
      instruction:
        'Diberikan nilai_kelas = {"Alya": 90, "Budi": 84}. Tambahkan key "Citra" dengan nilai 95, lalu buat variabel unik = set([1, 2, 2, 3, 3, 4]) dan cetak len(unik) serta nilai_kelas["Citra"].',
      starterCode: `nilai_kelas = {"Alya": 90, "Budi": 84}
# Tambahkan Citra: 95 dan buat set unik dari [1, 2, 2, 3, 3, 4]
`,
      solutionCode: `nilai_kelas = {"Alya": 90, "Budi": 84}
nilai_kelas["Citra"] = 95
unik = set([1, 2, 2, 3, 3, 4])
print(len(unik))
print(nilai_kelas["Citra"])`,
      expectedOutputIncludes: ['4', '95'],
      hint: 'Tambahkan nilai_kelas["Citra"] = 95, buat unik = set([1, 2, 2, 3, 3, 4]), lalu print keduanya.',
    },
    checkpoints: [
      {
        id: 'cp-9-1',
        prompt: 'Ekspresi apa yang dibuat oleh x = {} di Python?',
        options: ['Set kosong', 'Dictionary kosong', 'List kosong', 'Tuple kosong'],
        correctIndex: 1,
        explanation: 'Tanda {} kosong membuat dictionary kosong; untuk set kosong harus memakai set().',
      },
      {
        id: 'cp-9-2',
        prompt: 'Jika A = {1, 2, 3} dan B = {3, 4, 5}, hasil dari A & B adalah...',
        options: ['{1, 2, 3, 4, 5}', '{3}', '{1, 2}', '{4, 5}'],
        correctIndex: 1,
        explanation: 'Operator & pada set mencari irisan (elemen yang ada di kedua himpunan), yaitu {3}.',
      },
    ],
    miniGameId: 'mg-9',
  },
  {
    id: 10,
    slug: 'searching-dan-sorting',
    shortTitle: 'Searching & Sorting',
    title: 'Algoritma Searching dan Sorting',
    category: 'Struktur Data & Algoritma',
    durationMinutes: 30,
    xpReward: 150,
    overview:
      'Membandingkan Linear Search vs Binary Search serta memahami mekanisme pertukaran elemen pada Bubble Sort dan efisiensi kompleksitas langkah.',
    objectives: [
      'Membedakan syarat penggunaan Linear Search dan Binary Search.',
      'Mengimplementasikan Binary Search dengan pointer kiri, kanan, dan tengah.',
      'Menelusuri iterasi perbandingan dan penukaran (swap) pada Bubble Sort.',
    ],
    concepts: [
      {
        title: 'Linear Search vs Binary Search',
        summary:
          'Linear Search memeriksa satu per satu (O(n)). Binary Search membelah ruang pencarian menjadi dua setiap langkah (O(log n)), tetapi mensyaratkan data sudah terurut.',
        code: `def binary_search(arr, target):
    kiri, kanan = 0, len(arr) - 1
    while kiri <= kanan:
        mid = (kiri + kanan) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            kiri = mid + 1
        else:
            kanan = mid - 1
    return -1

print("Indeks 23:", binary_search([5, 11, 17, 23, 31], 23))`,
        keyTakeaway: 'Data WAJIB terurut sebelum menjalankan Binary Search.',
      },
      {
        title: 'Bubble Sort: Bandingkan & Tukar Berpasangan',
        summary:
          'Bubble Sort membandingkan elemen bersebelahan dan menukarnya jika urutan salah hingga elemen terbesar mengapung ke ujung kanan.',
        code: `data = [29, 10, 14, 7]
n = len(data)
for i in range(n):
    for j in range(0, n - i - 1):
        if data[j] > data[j + 1]:
            temp = data[j]
            data[j] = data[j + 1]
            data[j + 1] = temp
print("Terurut:", data)`,
        keyTakeaway: 'Setiap pass penuh menempatkan 1 elemen terbesar berikutnya pada posisi finalnya.',
      },
    ],
    sandboxStarter: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                sementara = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = sementara
    return arr

angka = [42, 15, 8, 23, 16]
hasil = bubble_sort(angka)
print("Hasil Bubble Sort:", hasil)`,
    labChallenge: {
      title: 'Tantangan Lab 10: Pencarian Linear',
      instruction:
        'Buat fungsi cari_indeks(data, target) yang mengembalikan indeks elemen target jika ditemukan, atau -1 jika tidak ada. Uji dengan cari_indeks([12, 25, 37, 49], 37), simpan ke variabel posisi, dan cetak.',
      starterCode: `def cari_indeks(data, target):
    # Telusuri indeks 0..len(data)-1
    return -1

posisi = cari_indeks([12, 25, 37, 49], 37)
print(posisi)`,
      solutionCode: `def cari_indeks(data, target):
    for i in range(len(data)):
        if data[i] == target:
            return i
    return -1

posisi = cari_indeks([12, 25, 37, 49], 37)
print(posisi)`,
      expectedOutputIncludes: ['2'],
      expectedVariables: { posisi: 2 },
      hint: 'Gunakan for i in range(len(data)): lalu cek if data[i] == target: return i.',
    },
    checkpoints: [
      {
        id: 'cp-10-1',
        prompt: 'Prasyarat utama agar algoritma Binary Search memberikan hasil yang benar adalah...',
        options: [
          'Jumlah elemen harus bilangan prima',
          'Data di dalam list harus sudah dalam keadaan terurut',
          'Semua elemen harus bertipe string',
          'Data harus disimpan di dalam Set',
        ],
        correctIndex: 1,
        explanation: 'Binary Search membuang separuh data berdasarkan perbandingan dengan titik tengah, sehingga urutan data wajib tersortir.',
      },
      {
        id: 'cp-10-2',
        prompt: 'Pada array [5, 2, 8, 1], berapa kali pertukaran (swap) terjadi pada pass pertama Bubble Sort menaik?',
        options: ['1 kali', '2 kali', '3 kali', '4 kali'],
        correctIndex: 1,
        explanation: '(5,2)->tukar [2,5,8,1], (5,8)->tetap, (8,1)->tukar [2,5,1,8]. Total 2 kali pertukaran.',
      },
    ],
    miniGameId: 'mg-10',
  },
  {
    id: 11,
    slug: 'dasar-oop',
    shortTitle: 'Dasar OOP',
    title: 'Dasar OOP: Class, Object, Atribut, dan Method',
    category: 'OOP & Kualitas Kode',
    durationMinutes: 25,
    xpReward: 140,
    overview:
      'Memodelkan entitas dunia nyata menjadi cetak biru Class dengan konstruktor __init__, atribut instance (self), dan perilaku melalui Method.',
    objectives: [
      'Membedakan Class (cetak biru) dengan Object/Instance (wujud nyata).',
      'Menginisialisasi atribut objek melalui konstruktor __init__(self, ...).',
      'Menulis method yang membaca atau memperbarui state objek.',
    ],
    concepts: [
      {
        title: 'Class, Konstruktor __init__, dan self',
        summary:
          'self merujuk pada objek spesifik yang sedang dibuat atau memanggil method, sehingga setiap instance menyimpan datanya sendiri.',
        code: `class Mahasiswa:
    def __init__(self, nama, nim):
        self.nama = nama
        self.nim = nim

    def perkenalan(self):
        return f"{self.nama} ({self.nim})"

m1 = Mahasiswa("Sari", "240101")
print(m1.perkenalan())`,
        keyTakeaway: 'Parameter pertama setiap method instance di Python selalu self.',
      },
      {
        title: 'Method Pengubah State Objek',
        summary:
          'Method dapat mengubah nilai atribut internal secara terkontrol — misalnya menambah saldo atau memperbarui progres.',
        code: `class Dompet:
    def __init__(self, saldo):
        self.saldo = saldo
    def setor(self, jumlah):
        self.saldo += jumlah

d = Dompet(50000)
d.setor(25000)
print("Saldo:", d.saldo)`,
        keyTakeaway: 'Enkapsulasi perilaku di dalam method menjaga konsistensi perubahan data objek.',
      },
    ],
    sandboxStarter: `class Buku:
    def __init__(self, judul, penulis, stok):
        self.judul = judul
        self.penulis = penulis
        self.stok = stok

    def pinjam(self):
        if self.stok > 0:
            self.stok -= 1
            return f"Berhasil pinjam '{self.judul}'. Sisa stok: {self.stok}"
        return "Stok habis"

b1 = Buku("Algoritma Python", "Dr. Hendra", 3)
print(b1.pinjam())
print(b1.pinjam())`,
    labChallenge: {
      title: 'Tantangan Lab 11: Class Persegi',
      instruction:
        'Buat class Persegi dengan __init__(self, sisi) dan method luas(self) yang mengembalikan self.sisi * self.sisi. Buat objek p = Persegi(9), simpan p.luas() ke variabel hasil_luas, lalu cetak.',
      starterCode: `class Persegi:
    def __init__(self, sisi):
        self.sisi = sisi

    # Tambahkan method luas(self)

p = Persegi(9)
hasil_luas = 0
print(hasil_luas)`,
      solutionCode: `class Persegi:
    def __init__(self, sisi):
        self.sisi = sisi

    def luas(self):
        return self.sisi * self.sisi

p = Persegi(9)
hasil_luas = p.luas()
print(hasil_luas)`,
      expectedOutputIncludes: ['81'],
      expectedVariables: { hasil_luas: 81 },
      hint: 'Tambahkan def luas(self): return self.sisi * self.sisi lalu hasil_luas = p.luas().',
    },
    checkpoints: [
      {
        id: 'cp-11-1',
        prompt: 'Method khusus apa yang otomatis dipanggil saat sebuah object baru dibuat dari Class di Python?',
        options: ['__start__', '__init__', '__create__', '__main__'],
        correctIndex: 1,
        explanation: '__init__ adalah konstruktor inisialisasi atribut objek saat instansiasi class.',
      },
      {
        id: 'cp-11-2',
        prompt: 'Peran parameter self pada method di dalam class Python adalah...',
        options: [
          'Merujuk pada instance objek yang memanggil method tersebut',
          'Menjadikan atribut bersifat global untuk semua file',
          'Menghapus objek dari memori otomatis',
          'Menjalankan perulangan secara otomatis',
        ],
        correctIndex: 0,
        explanation: 'self memberi akses ke atribut dan method milik objek tertentu yang sedang diproses.',
      },
    ],
    miniGameId: 'mg-11',
  },
  {
    id: 12,
    slug: 'oop-lanjutan',
    shortTitle: 'Inheritance & Polymorphism',
    title: 'OOP Lanjutan: Inheritance dan Polymorphism',
    category: 'OOP & Kualitas Kode',
    durationMinutes: 25,
    xpReward: 150,
    overview:
      'Mewariskan atribut dan method dari parent class ke child class menggunakan Inheritance + super(), serta meng-override method untuk Polymorphism.',
    objectives: [
      'Membuat hierarki pewarisan class anak dari class induk.',
      'Memanggil konstruktor induk dengan super().__init__(...).',
      'Menerapkan polymorphism dengan method override pada daftar objek berbeda.',
    ],
    concepts: [
      {
        title: 'Inheritance & super()',
        summary:
          'Class turunan mewarisi properti induk tanpa duplikasi kode dan dapat menambahkan atribut atau perilaku khusus.',
        code: `class Kendaraan:
    def __init__(self, merk):
        self.merk = merk

class MobilListrik(Kendaraan):
    def __init__(self, merk, baterai):
        super().__init__(merk)
        self.baterai = baterai

m = MobilListrik("Ioniq", 77)
print(m.merk, m.baterai, "kWh")`,
        keyTakeaway: 'super().__init__() memastikan inisialisasi dari parent class tetap dijalankan.',
      },
      {
        title: 'Polymorphism Lewat Method Override',
        summary:
          'Objek dari class berbeda dapat merespons pemanggilan nama method yang sama dengan perilaku masing-masing.',
        code: `class Kucing:
    def suara(self):
        return "Meong"

class Bebek:
    def suara(self):
        return "Kwek"

for hewan in [Kucing(), Bebek()]:
    print(hewan.suara())`,
        keyTakeaway: 'Polymorphism membuat kode pemanggil tetap seragam walau tipe objek berkembang.',
      },
    ],
    sandboxStarter: `class Pegawai:
    def __init__(self, nama, gaji_pokok):
        self.nama = nama
        self.gaji_pokok = gaji_pokok

    def hitung_gaji(self):
        return self.gaji_pokok

class Manajer(Pegawai):
    def __init__(self, nama, gaji_pokok, tunjangan):
        super().__init__(nama, gaji_pokok)
        self.tunjangan = tunjangan

    def hitung_gaji(self):
        return self.gaji_pokok + self.tunjangan

tim = [Pegawai("Dina", 6000000), Manajer("Arif", 8000000, 2500000)]
for p in tim:
    print(f"{p.nama}: Rp {p.hitung_gaji()}")`,
    labChallenge: {
      title: 'Tantangan Lab 12: Override Method Polymorphism',
      instruction:
        'Buat class Bentuk dengan method nama(self) -> "Bentuk", lalu class Lingkaran(Bentuk) yang meng-override nama(self) agar mengembalikan "Lingkaran". Cetak Lingkaran().nama().',
      starterCode: `class Bentuk:
    def nama(self):
        return "Bentuk"

# Buat class Lingkaran turunan Bentuk dan override method nama(self)
`,
      solutionCode: `class Bentuk:
    def nama(self):
        return "Bentuk"

class Lingkaran(Bentuk):
    def nama(self):
        return "Lingkaran"

obj = Lingkaran()
print(obj.nama())`,
      expectedOutputIncludes: ['Lingkaran'],
      hint: 'Tulis class Lingkaran(Bentuk): lalu def nama(self): return "Lingkaran".',
    },
    checkpoints: [
      {
        id: 'cp-12-1',
        prompt: 'Sintaks yang tepat agar class Dosen mewarisi class Pengguna di Python adalah...',
        options: [
          'class Dosen extends Pengguna:',
          'class Dosen(Pengguna):',
          'class Dosen <- Pengguna:',
          'inherit Pengguna to Dosen:',
        ],
        correctIndex: 1,
        explanation: 'Di Python, nama parent class diletakkan di dalam tanda kurung setelah nama child class.',
      },
      {
        id: 'cp-12-2',
        prompt: 'Apa yang dimaksud dengan Polymorphism dalam OOP?',
        options: [
          'Satu variabel tidak boleh diubah nilainya',
          'Kemampuan objek dari class berbeda merespons nama method yang sama secara spesifik',
          'Menghapus seluruh method dari parent class',
          'Menyimpan seluruh program dalam satu baris',
        ],
        correctIndex: 1,
        explanation: 'Polymorphism memungkinkan pemanggilan antarmuka method yang sama menghasilkan perilaku sesuai class objeknya.',
      },
    ],
    miniGameId: 'mg-12',
  },
  {
    id: 13,
    slug: 'eksepsi-dan-debugging',
    shortTitle: 'Eksepsi & Debugging',
    title: 'Penanganan Eksepsi dan Debugging',
    category: 'OOP & Kualitas Kode',
    durationMinutes: 25,
    xpReward: 150,
    overview:
      'Menangani kesalahan runtime secara elegan menggunakan try, except, finally, dan raise, serta membaca pesan traceback untuk debugging sistematis.',
    objectives: [
      'Membedakan SyntaxError, Runtime Exception (ZeroDivisionError, ValueError, IndexError), dan Logic Bug.',
      'Melindungi kode berisiko menggunakan blok try / except / finally.',
      'Mendiagnosis penyebab error dari pesan traceback dan memperbaikinya.',
    ],
    concepts: [
      {
        title: 'Struktur try - except - finally',
        summary:
          'Blok try menjalankan kode berisiko, except menangkap tipe error spesifik agar program tidak crash, dan finally selalu dieksekusi untuk pembersihan.',
        code: `def bagi(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Error: pembagi tidak boleh nol"
    finally:
        print("Proses pembagian selesai")

print(bagi(10, 0))`,
        keyTakeaway: 'Tangkap jenis eksepsi yang spesifik (misal ValueError, ZeroDivisionError), bukan sekadar except kosong.',
      },
      {
        title: 'Validasi dengan raise & Debugging Terstruktur',
        summary:
          'Gunakan raise untuk menolak input yang melanggar aturan bisnis lebih awal dan cek nilai variabel per langkah saat melacak logic bug.',
        code: `def cek_usia(usia):
    if usia < 0:
        raise ValueError("Usia tidak boleh negatif")
    return "Valid"

try:
    print(cek_usia(-3))
except ValueError as err:
    print("Tertangkap:", err)`,
        keyTakeaway: 'Baca pesan error dari baris terakhir traceback: jenis error dan nomor baris menunjukkan akar masalah.',
      },
    ],
    sandboxStarter: `data_input = ["40", "0", "abc", "10"]

for teks in data_input:
    try:
        angka = int(teks)
        hasil = 100 / angka
        print(f"100 / {angka} = {hasil}")
    except ValueError:
        print(f"Input '{teks}' bukan angka valid")
    except ZeroDivisionError:
        print("Tidak bisa membagi dengan angka 0")`,
    labChallenge: {
      title: 'Tantangan Lab 13: Pembagian Aman',
      instruction:
        'Buat fungsi bagi_aman(a, b) menggunakan try/except ZeroDivisionError yang mengembalikan 0 bila b == 0. Simpan bagi_aman(15, 0) ke variabel hasil dan cetak.',
      starterCode: `def bagi_aman(a, b):
    # Bungkus a / b dengan try / except ZeroDivisionError
    return a / b

hasil = bagi_aman(15, 0)
print(hasil)`,
      solutionCode: `def bagi_aman(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return 0

hasil = bagi_aman(15, 0)
print(hasil)`,
      expectedOutputIncludes: ['0'],
      expectedVariables: { hasil: 0 },
      hint: 'Gunakan try: return a / b diikuti except ZeroDivisionError: return 0.',
    },
    checkpoints: [
      {
        id: 'cp-13-1',
        prompt: 'Eksepsi apa yang muncul ketika kode menjalankan int("python")?',
        options: ['ZeroDivisionError', 'IndexError', 'ValueError', 'KeyError'],
        correctIndex: 2,
        explanation: 'Tipe argumen benar (str), tetapi nilainya tidak dapat dikonversi ke bilangan bulat sehingga memicu ValueError.',
      },
      {
        id: 'cp-13-2',
        prompt: 'Kapan blok finally di dalam struktur try/except dijalankan?',
        options: [
          'Hanya saat tidak terjadi error',
          'Hanya saat terjadi error',
          'Selalu dijalankan baik terjadi error maupun tidak',
          'Hanya saat dipanggil dengan kata kunci raise',
        ],
        correctIndex: 2,
        explanation: 'Blok finally selalu dieksekusi di akhir untuk memastikan langkah penutupan/cleanup tetap berjalan.',
      },
    ],
    miniGameId: 'mg-13',
  },
];
