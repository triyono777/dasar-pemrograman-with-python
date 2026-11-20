import type { CurriculumModule, LaymanModuleGuide, LaymanTone } from '../types';

export const LAYMAN_MODULE_GUIDES: LaymanModuleGuide[] = [
  {
    moduleId: 1,
    category: 'Fondasi',
    moduleShortTitle: 'Konsep & Algoritma',
    analogyTitle: 'Resep Masak Mie Instan untuk Robot',
    analogyEmojiLabel: 'Analogi Dapur',
    oneLineHook: 'Algoritma itu cuma urutan langkah dari awal sampai selesai, persis kayak resep masak.',
    babyStory: {
      headline: 'Komputer itu kayak robot bayi yang super penurut',
      paragraphs: [
        'Bayangkan kamu punya robot lucu. Robot ini pintar banget, tapi dia nggak bisa menebak pikiranmu. Kalau kamu cuma bilang "bikinin susu!", dia malah bengong.',
        'Supaya robotnya paham, kamu harus kasih tahu langkah satu-satu secara urut: 1) Ambil gelas, 2) Tuang susu, 3) Aduk, 4) Kasih ke kamu. Nah, daftar langkah berurutan itulah yang disebut Algoritma!',
        'Sedangkan Python itu cuma "bahasa" yang kita pakai buat ngobrol sama si robot, karena bahasa Python gampang dibaca manusia.',
      ],
      rememberRule: 'Kalau urutannya ketukar (minum dulu baru tuang susu), hasilnya pasti kacau!',
    },
    laymanStory: {
      headline: 'Seperti panduan memasak mie instan langkah demi langkah',
      paragraphs: [
        'Banyak orang mengira pemrograman itu rumus rumit. Padahal intinya sederhana: menyusun instruksi yang jelas dari bahan mentah (Input), diolah (Proses), sampai jadi hasil (Output).',
        'Saat Anda memasak mie instan: siapkan air dan mie (Input), rebus lalu campur bumbu (Proses), sajikan di mangkuk (Output). Di dunia komputer, urutan logis tanpa bikin bingung itulah yang dinamakan Algoritma.',
        'Interpreter Python bertugas membaca tulisan kita dari baris paling atas ke bawah satu per satu, lalu langsung menjalankannya.',
      ],
      rememberRule: 'Komputer menjalankan instruksi persis sesuai urutan baris dari atas ke bawah.',
    },
    visualSteps: [
      {
        stepLabel: '1. Input (Bahan)',
        realLife: 'Siapkan panjang meja 10 cm dan lebar 4 cm.',
        inPython: 'panjang = 10, lebar = 4',
      },
      {
        stepLabel: '2. Proses (Olah)',
        realLife: 'Kalikan panjang dengan lebar untuk tahu luasnya.',
        inPython: 'luas = panjang * lebar',
      },
      {
        stepLabel: '3. Output (Hasil)',
        realLife: 'Ucapkan atau tulis hasilnya di layar supaya terbaca.',
        inPython: 'print("Luas:", luas)',
      },
    ],
    sampleCode: `# Resep hitung luas meja
panjang = 10
lebar = 4
luas = panjang * lebar
print("Luas meja adalah:", luas)`,
    codeTranslations: [
      { code: '# Resep hitung luas meja', humanMeaning: 'Catatan kecil buat manusia saja, robot tidak membacanya.' },
      { code: 'panjang = 10', humanMeaning: 'Ingat ya robot, panjangnya itu 10.' },
      { code: 'lebar = 4', humanMeaning: 'Dan lebarnya itu 4.' },
      { code: 'luas = panjang * lebar', humanMeaning: 'Tolong kalikan panjang dan lebar, simpan hasilnya bernama luas.' },
      { code: 'print("Luas meja adalah:", luas)', humanMeaning: 'Tampilkan jawaban luasnya di layar!' },
    ],
    glossary: [
      { term: 'Algoritma', plainMeaning: 'Urutan langkah-langkah yang jelas dan rapi untuk menyelesaikan suatu masalah.' },
      { term: 'Interpreter', plainMeaning: 'Penerjemah yang membaca kode Python baris demi baris lalu langsung melakukannya.' },
      { term: 'Komentar (#)', plainMeaning: 'Tulisan catatan untuk manusia yang dilewati begitu saja oleh komputer.' },
    ],
    quickCheck: {
      question: 'Kalau kamu menyuruh robot menyikat gigi, mana urutan algoritma yang masuk akal?',
      options: [
        'Kumur dulu → sikat gigi → baru taruh pasta gigi',
        'Taruh pasta gigi di sikat → sikat gigi → kumur air bersih',
        'Langsung tidur tanpa menyikat gigi',
      ],
      correctIndex: 1,
      feedback: 'Tepat! Algoritma selalu bekerja dengan urutan logis dari awal (bahan), proses, sampai hasil akhir.',
    },
  },
  {
    moduleId: 2,
    category: 'Fondasi',
    moduleShortTitle: 'Variabel, Tipe Data & I/O',
    analogyTitle: 'Kotak Mainan Berlabel Nama',
    analogyEmojiLabel: 'Analogi Kotak',
    oneLineHook: 'Variabel itu kayak toples atau kotak mainan yang ditempeli stiker nama supaya gampang dicari.',
    babyStory: {
      headline: 'Simpan barangmu di kotak yang ada stikernya!',
      paragraphs: [
        'Coba bayangkan kamu punya 4 toples di kamar. Toples pertama kamu tempeli stiker "umur" lalu diisi angka 5. Toples kedua stikernya "nama" lalu diisi tulisan "Budi".',
        'Di Python, toples berstiker itu namanya Variabel! Isinya bisa bermacam-macam: ada angka bulat (seperti 5 permen), angka koma (seperti 2.5 roti), kata-kata dalam tanda kutip ("Halo"), atau jawaban Ya/Tidak (True/False).',
        'Kalau nanti kamu mau ganti isi toples "umur" jadi 6, tinggal masukkan saja angka baru — isi lama otomatis terganti!',
      ],
      rememberRule: 'Tulisan selalu dipeluk tanda kutip ("Halo"), sedangkan angka biasa tidak pakai kutip (10).',
    },
    laymanStory: {
      headline: 'Seperti loker penitipan barang dengan label isi',
      paragraphs: [
        'Saat membuat aplikasi, komputer perlu tempat sementara untuk mengingat data seperti nama pelanggan, harga barang, atau status pembayaran. Tempat penyimpanan bernama itulah Variabel.',
        'Setiap data punya jenisnya (Tipe Data): int untuk bilangan bulat (jumlah barang), float untuk desimal (harga atau IPK), str untuk teks (nama), dan bool untuk benar/salah (sudah bayar atau belum).',
        'Perintah input() dipakai saat program bertanya ke pengguna, dan print() dipakai untuk menjawab ke layar.',
      ],
      rememberRule: 'Hasil input() selalu berupa teks (str); ubah dengan int() jika ingin dihitung secara matematika.',
    },
    visualSteps: [
      {
        stepLabel: 'Toples Angka Bulat',
        realLife: 'Isi 3 donat utuh (tidak terpotong).',
        inPython: 'donat = 3  (int)',
      },
      {
        stepLabel: 'Toples Teks',
        realLife: 'Label nama "Alya" ditulis di dalam tanda kutip.',
        inPython: 'nama = "Alya"  (str)',
      },
      {
        stepLabel: 'Toples Ya/Tidak',
        realLife: 'Lampu sakelar cuma punya dua kondisi: Nyala atau Mati.',
        inPython: 'lapar = True  (bool)',
      },
    ],
    sampleCode: `nama = "Alya"
jumlah_kue = 4
harga_kue = 2.5
sudah_bayar = True
print(f"Halo {nama}, kamu beli {jumlah_kue} kue!")`,
    codeTranslations: [
      { code: 'nama = "Alya"', humanMeaning: 'Buat kotak bernama "nama", masukkan tulisan Alya.' },
      { code: 'jumlah_kue = 4', humanMeaning: 'Buat kotak bernama "jumlah_kue", masukkan angka bulat 4.' },
      { code: 'harga_kue = 2.5', humanMeaning: 'Buat kotak bernama "harga_kue", masukkan angka koma 2.5.' },
      { code: 'sudah_bayar = True', humanMeaning: 'Buat kotak status: benar (True) sudah dibayar.' },
      { code: 'print(f"Halo {nama}, kamu beli {jumlah_kue} kue!")', humanMeaning: 'Cetak kalimat sambil mengambil isi kotak nama dan jumlah_kue.' },
    ],
    glossary: [
      { term: 'Variabel', plainMeaning: 'Wadah bernama di memori komputer untuk menyimpan suatu nilai.' },
      { term: 'int / float', plainMeaning: 'int adalah angka bulat (5), float adalah angka berkoma (3.14).' },
      { term: 'str (String)', plainMeaning: 'Kumpulan huruf atau teks yang selalu dibungkus tanda kutip.' },
      { term: 'bool (Boolean)', plainMeaning: 'Nilai kebenaran yang cuma ada dua: True (Benar) atau False (Salah).' },
    ],
    quickCheck: {
      question: 'Kenapa "10" (pakai kutip) berbeda dengan 10 (tanpa kutip) di Python?',
      options: [
        '"10" dianggap tulisan biasa (str), sedangkan 10 adalah angka asli (int) yang bisa dihitung',
        'Tidak ada bedanya sama sekali, keduanya persis sama',
        '10 tanpa kutip tidak boleh dipakai di Python',
      ],
      correctIndex: 0,
      feedback: 'Betul sekali! Tanda kutip membuat komputer membacanya sebagai teks (str), bukan bilangan.',
    },
  },
  {
    moduleId: 3,
    category: 'Fondasi',
    moduleShortTitle: 'Operator & Logika',
    analogyTitle: 'Kalkulator & Timbangan Kebenaran',
    analogyEmojiLabel: 'Analogi Timbangan',
    oneLineHook: 'Operator itu tombol hitung (+, -, *, /) sekaligus timbangan untuk mengecek apakah sesuatu benar atau salah.',
    babyStory: {
      headline: 'Menghitung permen dan membandingkan siapa yang lebih banyak',
      paragraphs: [
        'Kalau kamu punya 7 permen lalu dibagi rata ke 2 anak, masing-masing dapat 3 permen (di Python ditulis 7 // 2), dan masih ada sisa 1 permen di toples (ditulis 7 % 2).',
        'Selain menghitung, kita juga bisa bertanya ke robot pakai tanda banding, misalnya: "Apakah 5 lebih besar dari 3?" Robot akan menjawab True (Benar!) atau False (Salah!).',
        'Ada juga kata sakti "and" (harus dua-duanya benar) dan "or" (cukup salah satu saja yang benar).',
      ],
      rememberRule: 'Tanda = artinya "isi kotak", sedangkan == (dua sama dengan) artinya "apakah sama?".',
    },
    laymanStory: {
      headline: 'Seperti syarat promo belanja dan kasir supermarket',
      paragraphs: [
        'Kasir memakai operator aritmatika untuk menghitung total belanja, diskon, dan kembalian. Di Python, tanda % (modulo) sering dipakai untuk mengecek sisa bagi—misalnya apakah sebuah angka genap atau ganjil.',
        'Operator logika bekerja persis seperti syarat promo toko: "Gratis ongkir jika belanja >= 50.000 AND member aktif". Kalau salah satu syarat tidak terpenuhi, maka hasilnya False.',
        'Sebaliknya, operator OR bersifat longgar: "Boleh bayar pakai tunai OR QRIS" — cukup salah satu saja sudah lolos.',
      ],
      rememberRule: 'AND butuh semua syarat benar; OR cukup minimal satu syarat benar.',
    },
    visualSteps: [
      {
        stepLabel: 'Bagi Bulat (//)',
        realLife: '7 kue dibagi 2 anak → tiap anak dapat 3 kue utuh.',
        inPython: '7 // 2  ->  3',
      },
      {
        stepLabel: 'Sisa Bagi (%)',
        realLife: 'Dari 7 kue dibagi 2 anak → tersisa 1 kue di piring.',
        inPython: '7 % 2   ->  1',
      },
      {
        stepLabel: 'Syarat AND',
        realLife: 'Boleh main keluar kalau PR selesai DAN tidak hujan.',
        inPython: 'pr_selesai and (not hujan)',
      },
    ],
    sampleCode: `permen = 7
anak = 2
dapat = permen // anak
sisa = permen % anak
print("Tiap anak dapat:", dapat, "sisa:", sisa)
print("Apakah sisa 1?", sisa == 1)`,
    codeTranslations: [
      { code: 'permen = 7', humanMeaning: 'Kita punya 7 permen.' },
      { code: 'anak = 2', humanMeaning: 'Mau dibagikan ke 2 anak.' },
      { code: 'dapat = permen // anak', humanMeaning: 'Hitung berapa permen utuh yang didapat tiap anak (hasilnya 3).' },
      { code: 'sisa = permen % anak', humanMeaning: 'Hitung berapa permen yang tersisa (hasilnya 1).' },
      { code: 'print("Apakah sisa 1?", sisa == 1)', humanMeaning: 'Tanya ke komputer: apakah sisanya sama dengan 1? Jawabannya True!' },
    ],
    glossary: [
      { term: 'Modulo (%)', plainMeaning: 'Menghitung sisa setelah pembagian; sangat berguna untuk cek angka genap/ganjil.' },
      { term: 'Operator ==', plainMeaning: 'Bertanya apakah nilai kiri dan kanan sama persis.' },
      { term: 'and / or / not', plainMeaning: 'Penggabung syarat: and (keduanya wajib), or (salah satu cukup), not (kebalikannya).' },
    ],
    quickCheck: {
      question: 'Jika syarat masuk wahana adalah "tinggi >= 120 and punya_tiket", apa yang terjadi kalau tinggimu 130 cm tapi lupa beli tiket?',
      options: [
        'Boleh masuk karena tingginya cukup',
        'Belum boleh masuk (False), karena kata "and" mewajibkan kedua syarat terpenuhi',
        'Komputer menjadi rusak',
      ],
      correctIndex: 1,
      feedback: 'Benar! Operator AND mensyaratkan semua kondisi bernilai True agar hasilnya True.',
    },
  },
  {
    moduleId: 4,
    category: 'Alur Kontrol',
    moduleShortTitle: 'Percabangan (If/Elif)',
    analogyTitle: 'Persimpangan Jalan & Lampu Lalu Lintas',
    analogyEmojiLabel: 'Analogi Rambu',
    oneLineHook: 'Percabangan (if/elif/else) itu cara komputer memilih jalan berdasarkan situasi saat itu.',
    babyStory: {
      headline: 'Kalau hujan pakai payung, kalau cerah pakai topi!',
      paragraphs: [
        'Sebelum pergi main, kamu lihat jendela dulu. JIKA (if) di luar hujan, kamu ambil payung. KALAU TIDAK, tapi (elif) matahari terik banget, kamu pakai topi. SELAIN ITU (else), kamu langsung jalan santai!',
        'Komputer juga begitu! Dengan if, elif, dan else, robot tidak lagi cuma jalan lurus—dia bisa mengambil keputusan pintar sesuai keadaan.',
        'Perhatikan spasi menjorok ke dalam (indentasi) di bawah if: itu tanda bahwa perintah tersebut cuma dikerjakan kalau syarat di atasnya benar.',
      ],
      rememberRule: 'Dari rangkaian if → elif → else, komputer hanya memilih SATU jalan pertama yang benar.',
    },
    laymanStory: {
      headline: 'Seperti aturan lampu lalu lintas di perempatan',
      paragraphs: [
        'Pengemudi melihat lampu: jika merah berhenti, jika kuning hati-hati, selain itu (hijau) jalan terus. Itulah struktur if, elif, dan else di Python.',
        'Struktur ini dipakai di hampir semua aplikasi nyata: menentukan lulus atau remedial dari nilai ujian, mengecek saldo cukup atau tidak saat transfer, hingga memberi diskon otomatis.',
        'Indentasi (4 spasi di awal baris) adalah cara Python mengelompokkan perintah milik cabang tertentu.',
      ],
      rememberRule: 'Jangan lupa titik dua (:) di ujung baris if/elif/else dan spasi menjorok di baris bawahnya.',
    },
    visualSteps: [
      {
        stepLabel: 'Cek 1 (if)',
        realLife: 'Apakah nilai >= 80? Jika ya → dapat hadiah bintang emas.',
        inPython: 'if nilai >= 80:',
      },
      {
        stepLabel: 'Cek 2 (elif)',
        realLife: 'Kalau belum 80, apakah >= 60? Jika ya → lulus dengan baik.',
        inPython: 'elif nilai >= 60:',
      },
      {
        stepLabel: 'Cadangan (else)',
        realLife: 'Kalau semua cek di atas salah → yuk belajar bareng lagi.',
        inPython: 'else:',
      },
    ],
    sampleCode: `cuaca = "hujan"
if cuaca == "hujan":
    print("Bawa payung ya!")
elif cuaca == "panas":
    print("Pakai topi biar adem!")
else:
    print("Cuaca cerah, santai jalan!")`,
    codeTranslations: [
      { code: 'cuaca = "hujan"', humanMeaning: 'Situasi sekarang: cuacanya sedang hujan.' },
      { code: 'if cuaca == "hujan":', humanMeaning: 'Cek dulu: apakah cuacanya hujan?' },
      { code: '    print("Bawa payung ya!")', humanMeaning: 'Karena benar hujan, komputer menjalankan baris ini.' },
      { code: 'elif cuaca == "panas":', humanMeaning: 'Dilewati karena pilihan pertama sudah benar.' },
      { code: 'else:', humanMeaning: 'Jalan terakhir jika semua pengecekan sebelumnya salah.' },
    ],
    glossary: [
      { term: 'if / elif / else', plainMeaning: 'Jika / atau jika / selain itu — untuk membuat cabang keputusan.' },
      { term: 'Indentasi', plainMeaning: 'Spasi menjorok ke kanan untuk menandai baris yang masuk ke dalam blok if.' },
    ],
    quickCheck: {
      question: 'Jika nilai = 90, pada blok if nilai >= 80 lalu elif nilai >= 60, cabang mana yang dijalankan?',
      options: [
        'Hanya cabang if nilai >= 80 saja',
        'Keduanya dijalankan bersamaan',
        'Hanya cabang else yang dijalankan',
      ],
      correctIndex: 0,
      feedback: 'Benar! Begitu kondisi pertama (if) terpenuhi, Python langsung selesai dan tidak mengecek elif di bawahnya.',
    },
  },
  {
    moduleId: 5,
    category: 'Alur Kontrol',
    moduleShortTitle: 'Perulangan (Looping)',
    analogyTitle: 'Putaran Komidi Putar & Lagu Repeat',
    analogyEmojiLabel: 'Analogi Ulang',
    oneLineHook: 'Looping membuat komputer mengulang pekerjaan membosankan ratusan kali dalam sekejap tanpa capek.',
    babyStory: {
      headline: 'Daripada nulis "Halo" 100 kali, suruh robot mengulang!',
      paragraphs: [
        'Bayangkan ibu guru menyuruhmu menulis "Aku rajin belajar" sebanyak 10 kali. Tanganmu pasti pegal kalau menulis satu-satu!',
        'Dengan perulangan (for), kamu cukup bilang ke robot: "Ulangi 10 kali: tulis Aku rajin belajar!" Selesai dalam 2 baris kode saja.',
        'Ada juga perulangan "while" yang artinya "selama masih...": misalnya "Selama piring belum kosong, suap nasi satu sendok lagi!"',
      ],
      rememberRule: 'Pastikan perulangan while punya rem berhenti, supaya robot tidak berputar selamanya!',
    },
    laymanStory: {
      headline: 'Seperti mesin cuci atau kasir memindai barang di keranjang',
      paragraphs: [
        'Manusia cepat lelah melakukan hal berulang, sedangkan komputer diciptakan untuk itu. Perulangan for dipakai saat kita tahu berapa kali atau daftar apa yang ingin diproses (misal: semua barang di keranjang).',
        'Perulangan while dipakai saat kita mengulang selama sebuah syarat masih berlaku (misal: minta PIN ulang selama PIN masih salah).',
        'Kata break dipakai untuk langsung keluar dari putaran, sedangkan continue untuk melompati satu putaran tertentu.',
      ],
      rememberRule: 'Pakai for jika jumlah/daftar sudah jelas; pakai while jika bergantung pada kondisi berhenti.',
    },
    visualSteps: [
      {
        stepLabel: 'Mulai Putaran',
        realLife: 'Siapkan hitungan dari 1 sampai 3.',
        inPython: 'for i in range(1, 4):',
      },
      {
        stepLabel: 'Aksi Berulang',
        realLife: 'Tepuk tangan di setiap hitungan.',
        inPython: '    print("Tepuk ke-", i)',
      },
      {
        stepLabel: 'Berhenti Otomatis',
        realLife: 'Setelah hitungan ke-3 selesai, putaran berhenti rapi.',
        inPython: 'print("Selesai!")',
      },
    ],
    sampleCode: `for putaran in range(1, 4):
    print("Lompat ke-", putaran)
print("Hore, selesai olahraga!")`,
    codeTranslations: [
      { code: 'for putaran in range(1, 4):', humanMeaning: 'Ulangi untuk angka 1, 2, dan 3 (angka 4 jadi batas berhenti).' },
      { code: '    print("Lompat ke-", putaran)', humanMeaning: 'Setiap putaran, tampilkan nomor lompatannya.' },
      { code: 'print("Hore, selesai olahraga!")', humanMeaning: 'Baris ini tidak menjorok, jadi cuma dicetak sekali setelah loop selesai.' },
    ],
    glossary: [
      { term: 'for loop', plainMeaning: 'Mengulang perintah untuk setiap item dalam daftar atau rentang angka.' },
      { term: 'while loop', plainMeaning: 'Terus mengulang selama kondisi tertentu masih bernilai Benar (True).' },
      { term: 'range(1, 4)', plainMeaning: 'Menghasilkan urutan angka 1, 2, 3 (berhenti sebelum angka terakhir).' },
    ],
    quickCheck: {
      question: 'Kapan kita lebih cocok memakai while loop dibanding for loop?',
      options: [
        'Saat kita tidak tahu pasti berapa kali harus mengulang, misalnya menunggu tebakan benar',
        'Saat hanya ingin mencetak satu kata satu kali saja',
        'Saat membuat variabel teks biasa',
      ],
      correctIndex: 0,
      feedback: 'Tepat! While loop bersinar ketika jumlah pengulangan bergantung pada kondisi yang berubah di tengah jalan.',
    },
  },
  {
    moduleId: 6,
    category: 'Modularisasi',
    moduleShortTitle: 'Fungsi Modular',
    analogyTitle: 'Mesin Blender Jus Otomatis',
    analogyEmojiLabel: 'Analogi Mesin',
    oneLineHook: 'Fungsi itu seperti mesin blender: masukkan bahan (parameter), tekan tombol, keluarlah jus (return).',
    babyStory: {
      headline: 'Bikin mesin sendiri biar tinggal pencet tombol!',
      paragraphs: [
        'Setiap kali mau bikin jus, kamu nggak perlu merakit blender dari nol. Cukup punya satu blender di dapur: masukkan mangga → keluar jus mangga; masukkan jeruk → keluar jus jeruk!',
        'Di Python, kita bikin "mesin kecil" pakai kata def. Lubang tempat memasukkan buahnya disebut Parameter, dan hasil jus yang keluar disebut Return.',
        'Enaknya lagi, sekali mesinnya dibuat, kamu bisa memanggilnya berkali-kali kapan saja mau!',
      ],
      rememberRule: 'def hanya merakit mesinnya; mesin baru bekerja saat kamu memanggil namanya!',
    },
    laymanStory: {
      headline: 'Membagi tugas besar menjadi modul-modul kecil yang bisa dipakai ulang',
      paragraphs: [
        'Bayangkan menulis kode hitung diskon di 20 tempat berbeda. Jika aturan diskon berubah, Anda harus mengedit 20 tempat. Dengan Fungsi (def), logika ditulis cukup di SATU tempat lalu dipanggil di mana saja.',
        'Parameter adalah data masukan yang dikirim ke fungsi, sementara return mengembalikan hasil perhitungan agar bisa disimpan ke variabel lain.',
        'Memecah program besar menjadi fungsi-fungsi kecil membuat kode jauh lebih rapi, mudah dibaca, dan gampang diperbaiki.',
      ],
      rememberRule: 'print() cuma menampilkan ke layar; return benar-benar menyerahkan hasil kembali ke pemanggil.',
    },
    visualSteps: [
      {
        stepLabel: '1. Rakit Mesin (def)',
        realLife: 'Buat mesin "buat_jus" yang menerima 1 buah.',
        inPython: 'def buat_jus(buah):',
      },
      {
        stepLabel: '2. Keluarkan Hasil (return)',
        realLife: 'Blender menghasilkan segelas jus segar.',
        inPython: '    return "Jus " + buah',
      },
      {
        stepLabel: '3. Panggil Mesin',
        realLife: 'Masukkan "Mangga" dan terima gelasnya.',
        inPython: 'gelas = buat_jus("Mangga")',
      },
    ],
    sampleCode: `def buat_jus(buah):
    return "Segelas Jus " + buah

pesanan1 = buat_jus("Mangga")
pesanan2 = buat_jus("Alpukat")
print(pesanan1)
print(pesanan2)`,
    codeTranslations: [
      { code: 'def buat_jus(buah):', humanMeaning: 'Rakit mesin bernama buat_jus yang punya lubang input bernama buah.' },
      { code: '    return "Segelas Jus " + buah', humanMeaning: 'Kembalikan hasil berupa tulisan Segelas Jus + nama buahnya.' },
      { code: 'pesanan1 = buat_jus("Mangga")', humanMeaning: 'Nyalakan mesin dengan input Mangga, simpan hasilnya ke pesanan1.' },
      { code: 'pesanan2 = buat_jus("Alpukat")', humanMeaning: 'Pakai mesin yang sama lagi, kali ini inputnya Alpukat!' },
      { code: 'print(pesanan1)', humanMeaning: 'Tampilkan hasil pesanan pertama di layar.' },
    ],
    glossary: [
      { term: 'Fungsi (def)', plainMeaning: 'Blok kode bernama yang bisa dipanggil berkali-kali agar tidak menulis ulang.' },
      { term: 'Parameter', plainMeaning: 'Bahan masukan yang diterima oleh fungsi saat dipanggil.' },
      { term: 'return', plainMeaning: 'Mengirim hasil keluaran fungsi kembali ke program utama.' },
    ],
    quickCheck: {
      question: 'Apa bedanya print() dan return di dalam sebuah fungsi?',
      options: [
        'print() hanya mencetak di layar, sedangkan return mengembalikan nilai agar bisa disimpan atau dihitung lagi',
        'return hanya untuk menghapus layar',
        'Tidak ada bedanya, keduanya selalu mengembalikan angka 0',
      ],
      correctIndex: 0,
      feedback: 'Benar! Return menyerahkan hasil kerja fungsi supaya bisa disimpan di variabel dan diolah lebih lanjut.',
    },
  },
  {
    moduleId: 7,
    category: 'Modularisasi',
    moduleShortTitle: 'Lambda, Rekursi & Modul',
    analogyTitle: 'Boneka Matryoshka & Kotak Perkakas Pinjaman',
    analogyEmojiLabel: 'Analogi Boneka',
    oneLineHook: 'Lambda itu fungsi mini 1 baris, Rekursi itu boneka di dalam boneka, dan Import itu meminjam alat siap pakai.',
    babyStory: {
      headline: 'Fungsi mini, boneka bersusun, dan kotak alat pintar',
      paragraphs: [
        'Kadang kamu cuma butuh mesin super mini untuk hitung cepat sekali pakai, misalnya mengalikan angka dengan 2. Di Python, mesin mini 1 baris tanpa nama itu disebut Lambda.',
        'Pernah lihat boneka Rusia (Matryoshka) yang kalau dibuka ada boneka lebih kecil di dalamnya sampai ketemu boneka paling kecil yang tidak bisa dibuka lagi? Nah, fungsi yang memanggil dirinya sendiri sampai ketemu bagian paling kecil (base case) itu namanya Rekursi!',
        'Sedangkan import itu seperti meminjam kotak perkakas milik tetangga (misalnya modul math) supaya kamu nggak perlu bikin alat akar kuadrat sendiri.',
      ],
      rememberRule: 'Rekursi WAJIB punya base case (boneka terkecil) biar berhenti dan tidak menggali tanpa akhir.',
    },
    laymanStory: {
      headline: 'Menulis fungsi ringkas, pemecahan masalah bertingkat, dan memakai pustaka bawaan',
      paragraphs: [
        'Lambda dipakai untuk operasi singkat satu baris, misalnya rumus cepat menghitung pajak atau mengurutkan data berdasarkan kolom tertentu.',
        'Rekursi memecah masalah besar menjadi versi yang lebih kecil dari masalah yang sama—contoh klasiknya adalah hitung mundur atau faktorial (5! = 5 × 4!). Titik berhentinya disebut base case.',
        'Python punya ribuan modul bawaan (seperti math, random) yang bisa langsung dipakai lewat perintah import.',
      ],
      rememberRule: 'Import modul menghemat waktu karena kita memakai fungsi teruji buatan komunitas Python.',
    },
    visualSteps: [
      {
        stepLabel: 'Lambda (Mini)',
        realLife: 'Catatan tempel kecil untuk rumus cepat 1 baris.',
        inPython: 'kali_dua = lambda x: x * 2',
      },
      {
        stepLabel: 'Rekursi (Boneka)',
        realLife: 'Hitung mundur 3 → 2 → 1 → berhenti di 0 (base case).',
        inPython: 'if n == 0: return 1',
      },
      {
        stepLabel: 'Import Modul',
        realLife: 'Buka kotak perkakas matematika siap pakai.',
        inPython: 'import math  ->  math.sqrt(16)',
      },
    ],
    sampleCode: `kali_dua = lambda x: x * 2
print("Lambda 6 x 2 =", kali_dua(6))

def faktorial(n):
    if n <= 1:
        return 1
    return n * faktorial(n - 1)

print("Faktorial 4 =", faktorial(4))`,
    codeTranslations: [
      { code: 'kali_dua = lambda x: x * 2', humanMeaning: 'Buat fungsi kilat 1 baris: angka apa pun langsung dikali 2.' },
      { code: 'def faktorial(n):', humanMeaning: 'Fungsi rekursif untuk menghitung n × (n-1) × ... × 1.' },
      { code: '    if n <= 1: return 1', humanMeaning: 'Base case! Kalau sudah sampai 1, langsung berhenti dan kembalikan 1.' },
      { code: '    return n * faktorial(n - 1)', humanMeaning: 'Panggil versi lebih kecil dari dirinya sendiri (n - 1).' },
    ],
    glossary: [
      { term: 'Lambda', plainMeaning: 'Fungsi singkat satu baris tanpa perlu menulis def.' },
      { term: 'Rekursi', plainMeaning: 'Fungsi yang memanggil dirinya sendiri untuk masalah yang makin kecil.' },
      { term: 'Base Case', plainMeaning: 'Kondisi paling sederhana tempat rekursi harus berhenti.' },
    ],
    quickCheck: {
      question: 'Apa yang terjadi jika fungsi rekursif lupa diberi base case (syarat berhenti)?',
      options: [
        'Fungsi memanggil dirinya terus-menerus tanpa berhenti hingga error memori penuh',
        'Program otomatis berhenti setelah 3 kali',
        'Python mengubahnya menjadi variabel string',
      ],
      correctIndex: 0,
      feedback: 'Tepat sekali! Tanpa base case, rekursi seperti membuka boneka tanpa ujung hingga terjadi RecursionError.',
    },
  },
  {
    moduleId: 8,
    category: 'Struktur Data & Algoritma',
    moduleShortTitle: 'List & Tuple',
    analogyTitle: 'Daftar Belanja Kertas vs Batu Prasasti',
    analogyEmojiLabel: 'Analogi Daftar',
    oneLineHook: 'List itu daftar belanja pakai pensil (bisa ditambah/dihapus), Tuple itu daftar yang diukir di batu (tetap permanen).',
    babyStory: {
      headline: 'Kereta gerbong bernomor mulai dari angka NOL!',
      paragraphs: [
        'Kalau mainanmu banyak, repot banget bikin 10 kotak terpisah. Mending susun semua mainan dalam satu kereta panjang bernama List — dibungkus kurung siku [ ].',
        'Uniknya, komputer suka mulai berhitung dari angka 0! Jadi gerbong paling depan adalah indeks [0], gerbong kedua indeks [1], dan seterusnya.',
        'List itu fleksibel: kamu bisa tambah gerbong baru (.append) atau ganti isinya. Nah, kalau kamu pakai kurung biasa ( ), itu namanya Tuple — seperti mainan yang sudah dilem permanen agar tidak terubah tanpa sengaja!',
      ],
      rememberRule: 'Ingat selalu: urutan pertama di Python dimulai dari indeks 0, bukan 1!',
    },
    laymanStory: {
      headline: 'Perbedaan daftar yang boleh diedit dan data yang dikunci tetap',
      paragraphs: [
        'List [...] digunakan untuk menyimpan banyak data berurutan yang sering berubah, seperti daftar belanjaan, antrean pelanggan, atau daftar tugas harian.',
        'Tuple (...) mirip dengan List, tetapi bersifat immutable (tidak bisa diubah isinya setelah dibuat). Cocok untuk data tetap seperti koordinat GPS (latitude, longitude) atau nama hari dalam seminggu.',
        'Teknik Slicing (misal daftar[1:3]) memungkinkan kita memotong dan mengambil sebagian isi daftar sekaligus.',
      ],
      rememberRule: 'List = [kurung siku, bisa diubah]; Tuple = (kurung biasa, terkunci permanen).',
    },
    visualSteps: [
      {
        stepLabel: 'Indeks 0, 1, 2',
        realLife: 'Gerbong [0]="Apel", [1]="Jeruk", [2]="Pisang".',
        inPython: 'buah[0] -> "Apel"',
      },
      {
        stepLabel: 'Tambah ke List',
        realLife: 'Tulis "Mangga" di baris paling bawah daftar belanja.',
        inPython: 'buah.append("Mangga")',
      },
      {
        stepLabel: 'Tuple Terkunci',
        realLife: 'Koordinat lokasi tidak boleh asal diganti.',
        inPython: 'posisi = (10, 20)',
      },
    ],
    sampleCode: `belanja = ["Apel", "Susu", "Roti"]
belanja.append("Keju")
print("Barang pertama:", belanja[0])
print("Semua belanja:", belanja)
koordinat = (7, 110)
print("Koordinat tetap:", koordinat)`,
    codeTranslations: [
      { code: 'belanja = ["Apel", "Susu", "Roti"]', humanMeaning: 'Buat daftar belanja berisi 3 barang (indeks 0, 1, 2).' },
      { code: 'belanja.append("Keju")', humanMeaning: 'Tambahkan "Keju" di urutan paling belakang.' },
      { code: 'print("Barang pertama:", belanja[0])', humanMeaning: 'Ambil barang urutan pertama (indeks 0), yaitu Apel.' },
      { code: 'koordinat = (7, 110)', humanMeaning: 'Buat Tuple terkunci dengan kurung biasa agar nilainya aman.' },
    ],
    glossary: [
      { term: 'List [...]', plainMeaning: 'Kumpulan data berurutan yang isinya bisa ditambah, diubah, atau dihapus.' },
      { term: 'Tuple (...)', plainMeaning: 'Kumpulan data berurutan yang terkunci permanen (immutable).' },
      { term: 'Indeks', plainMeaning: 'Nomor posisi tiap barang dalam daftar, selalu mulai dari 0.' },
    ],
    quickCheck: {
      question: 'Pada list hewan = ["Kucing", "Kelinci", "Burung"], apa hasil dari hewan[1]?',
      options: [
        '"Kucing" karena di urutan pertama',
        '"Kelinci" karena indeks di Python mulai dari 0',
        '"Burung" karena indeks 1 paling belakang',
      ],
      correctIndex: 1,
      feedback: 'Benar! Indeks 0 adalah Kucing, jadi indeks 1 adalah Kelinci.',
    },
  },
  {
    moduleId: 9,
    category: 'Struktur Data & Algoritma',
    moduleShortTitle: 'Dictionary & Set',
    analogyTitle: 'Buku Kontak HP & Kantong Kelereng Unik',
    analogyEmojiLabel: 'Analogi Kontak',
    oneLineHook: 'Dictionary itu kayak buku kontak (Nama → Nomor), sedangkan Set itu kantong yang otomatis membuang barang kembar.',
    babyStory: {
      headline: 'Cari lewat nama, dan kantong ajaib anti-kembar!',
      paragraphs: [
        'Di buku kontak HP, kamu nggak menghafal "nomor mama ada di urutan nomor 37". Kamu tinggal cari kata kuncinya: "Mama" → langsung keluar nomornya! Itulah Dictionary di Python: pasangan Kunci dan Nilai (Key: Value).',
        'Sekarang bayangkan kamu punya kantong ajaib bernama Set. Kalau kamu masukkan stiker "Bintang", lalu masukkan stiker "Bintang" lagi, kantong ini langsung bilang: "Eh udah ada, cukup simpan satu saja ya!"',
        'Jadi Set otomatis menghilangkan semua data yang kembar (duplikat)!',
      ],
      rememberRule: 'Dictionary pakai pasangan kunci: nilai; Set cuma menyimpan nilai unik tanpa kembar.',
    },
    laymanStory: {
      headline: 'Pencarian instan berbasis kata kunci dan penyaring data ganda',
      paragraphs: [
        'Dictionary ({kunci: nilai}) memudahkan kita menyimpan data profil terstruktur, misalnya {"nama": "Rafi", "sks": 20}. Kita tinggal menyebut kuncinya tanpa perlu tahu nomor urutnya.',
        'Set ({a, b, c}) adalah himpunan matematika yang menjamin setiap elemen bersifat unik. Sangat praktis untuk menghitung berapa banyak kota berbeda atau menghapus email duplikat.',
        'Set juga mendukung operasi himpunan seperti irisan (&) untuk mencari kesamaan dua grup, dan gabungan (|) untuk menyatukan keduanya.',
      ],
      rememberRule: 'Gunakan .get("kunci") pada Dictionary agar tidak error jika kunci belum ada.',
    },
    visualSteps: [
      {
        stepLabel: 'Dictionary (Kunci → Nilai)',
        realLife: 'Cari kontak "Ibu" → langsung ketemu "0812-3456".',
        inPython: 'kontak["Ibu"] -> "0812-3456"',
      },
      {
        stepLabel: 'Set (Anti Duplikat)',
        realLife: 'Kumpulkan kartu [A, B, A] → tersisa {A, B}.',
        inPython: 'set(["A", "B", "A"]) -> {"A", "B"}',
      },
      {
        stepLabel: 'Irisan Set (&)',
        realLife: 'Cari hobi yang sama-sama disukai kamu dan temanmu.',
        inPython: 'hobi_a & hobi_b',
      },
    ],
    sampleCode: `profil = {"nama": "Rafi", "kota": "Bandung"}
print("Kota asal:", profil["kota"])

stiker = {"Bintang", "Roket", "Bintang"}
print("Stiker unik:", stiker)`,
    codeTranslations: [
      { code: 'profil = {"nama": "Rafi", "kota": "Bandung"}', humanMeaning: 'Buat kamus data berisi pasangan kunci nama dan kota.' },
      { code: 'print("Kota asal:", profil["kota"])', humanMeaning: 'Panggil isi dari kunci "kota" → langsung keluar Bandung.' },
      { code: 'stiker = {"Bintang", "Roket", "Bintang"}', humanMeaning: 'Masukkan ke Set — kata "Bintang" yang kembar otomatis jadi satu.' },
      { code: 'print("Stiker unik:", stiker)', humanMeaning: 'Tampilkan isi kantong unik tanpa ada yang dobel.' },
    ],
    glossary: [
      { term: 'Dictionary (dict)', plainMeaning: 'Kumpulan data berpasangan kunci dan nilai, seperti kamus atau kontak HP.' },
      { term: 'Key & Value', plainMeaning: 'Key adalah kata kunci pencariannya, Value adalah isi di balik kunci itu.' },
      { term: 'Set', plainMeaning: 'Wadah himpunan yang tidak membolehkan adanya data kembar.' },
    ],
    quickCheck: {
      question: 'Jika kamu memasukkan ["Apel", "Apel", "Mangga"] ke dalam sebuah Set, berapa jumlah isinya?',
      options: [
        '3 buah karena semua disimpan',
        '2 buah ("Apel" dan "Mangga") karena Set menghapus data kembar',
        '0 buah karena Set tidak menerima teks',
      ],
      correctIndex: 1,
      feedback: 'Benar! Set otomatis membuang duplikat sehingga hanya tersisa 2 item unik.',
    },
  },
  {
    moduleId: 10,
    category: 'Struktur Data & Algoritma',
    moduleShortTitle: 'Searching & Sorting',
    analogyTitle: 'Buka Kamus dari Tengah & Merapikan Tinggi Badan',
    analogyEmojiLabel: 'Analogi Kamus',
    oneLineHook: 'Searching itu cara mencari cepat (buka tengah kamus!), Sorting itu merapikan urutan biar gampang dicari.',
    babyStory: {
      headline: 'Jangan buka kamus dari halaman 1 — buka langsung tengahnya!',
      paragraphs: [
        'Bayangkan kamu mencari kata "Monyet" di kamus tebal berisi 1.000 halaman. Kalau dicari satu-satu dari halaman 1 (Linear Search), lama banget!',
        'Cara cerdasnya (Binary Search): langsung buka halaman paling TENGAH! Kalau ketemu huruf "K", berarti "Monyet" pasti ada di sebelah KANAN — setengah buku di kiri langsung buang dari pencarian! Ulangi terus, cuma butuh beberapa bukaan langsung ketemu!',
        'Nah, supaya trik buka tengah itu bekerja, halamannya harus rapi dulu dari A sampai Z. Proses merapikan data dari kecil ke besar itulah Sorting (seperti menyuruh teman berbaris dari paling pendek ke paling tinggi).',
      ],
      rememberRule: 'Binary Search super cepat, TAPI syarat wajibnya datanya harus sudah terurut dulu!',
    },
    laymanStory: {
      headline: 'Mengurutkan data (Bubble Sort) dan pencarian belah dua (Binary Search)',
      paragraphs: [
        'Bubble Sort bekerja dengan membandingkan dua angka bersebelahan: jika urutannya terbalik, langsung ditukar! Seperti gelembung udara yang naik ke permukaan, angka terbesar pelan-pelan bergeser ke ujung kanan.',
        'Linear Search memeriksa satu per satu dari awal — cocok untuk data sedikit atau acak. Binary Search selalu memeriksa indeks tengah (mid) dan membuang separuh ruang pencarian di setiap langkah.',
        'Pada 1.000 data terurut, Linear Search bisa butuh 1.000 cek, sedangkan Binary Search paling lama cuma butuh 10 kali cek!',
      ],
      rememberRule: 'Merapikan data sekali di awal (Sorting) membuat ribuan pencarian setelahnya jadi sangat cepat.',
    },
    visualSteps: [
      {
        stepLabel: 'Sorting (Rapikan)',
        realLife: 'Tukar dua anak bersebelahan kalau yang depan lebih tinggi.',
        inPython: 'if arr[j] > arr[j+1]: tukar',
      },
      {
        stepLabel: 'Cek Tengah (mid)',
        realLife: 'Buka persis di tengah daftar angka terurut.',
        inPython: 'mid = (low + high) // 2',
      },
      {
        stepLabel: 'Pangkas Separuh',
        realLife: 'Target lebih besar? Fokus separuh kanan saja!',
        inPython: 'low = mid + 1',
      },
    ],
    sampleCode: `angka = [40, 10, 30, 20]
angka.sort()
print("Setelah rapi:", angka)

target = 30
ketemu = target in angka
print("Apakah 30 ketemu?", ketemu)`,
    codeTranslations: [
      { code: 'angka = [40, 10, 30, 20]', humanMeaning: 'Daftar angka yang awalnya masih berantakan.' },
      { code: 'angka.sort()', humanMeaning: 'Rapikan dari kecil ke besar → jadi [10, 20, 30, 40].' },
      { code: 'target = 30', humanMeaning: 'Kita ingin mencari apakah ada angka 30.' },
      { code: 'ketemu = target in angka', humanMeaning: 'Cek keberadaan target di dalam daftar.' },
    ],
    glossary: [
      { term: 'Sorting', plainMeaning: 'Proses mengurutkan data, misalnya dari terkecil ke terbesar.' },
      { term: 'Bubble Sort', plainMeaning: 'Cara mengurutkan dengan menukar dua elemen bersebelahan yang terbalik.' },
      { term: 'Binary Search', plainMeaning: 'Cara mencari super cepat di data terurut dengan selalu mengecek bagian tengah.' },
    ],
    quickCheck: {
      question: 'Apa syarat wajib sebelum kita boleh menggunakan Binary Search?',
      options: [
        'Datanya harus sudah terurut lebih dulu',
        'Datanya harus berupa teks semua',
        'Jumlah datanya harus di bawah 5 buah',
      ],
      correctIndex: 0,
      feedback: 'Tepat! Binary Search hanya bekerja jika data sudah rapi/terurut agar kita tahu harus mencari ke kiri atau ke kanan.',
    },
  },
  {
    moduleId: 11,
    category: 'OOP & Kualitas Kode',
    moduleShortTitle: 'Dasar OOP',
    analogyTitle: 'Cetakan Kue vs Kue yang Jadi',
    analogyEmojiLabel: 'Analogi Cetakan',
    oneLineHook: 'Class itu cetakan kuenya (rancangan), sedangkan Object itu kue asli yang bisa kamu beri rasa berbeda-beda.',
    babyStory: {
      headline: 'Satu cetakan bintang bisa bikin banyak kue berbeda rasa!',
      paragraphs: [
        'Bayangkan kamu punya 1 cetakan kue berbentuk bintang. Cetakan itu sendiri belum bisa dimakan—dia cuma gambar bentuknya saja. Di Python, cetakan itu disebut Class!',
        'Dari satu cetakan bintang, kamu bisa bikin Kue A rasa cokelat dan Kue B rasa stroberi. Nah, kue-kue nyata hasil cetakan itulah yang disebut Object!',
        'Rasa dan warna kue disebut Atribut (ciri-ciri), sedangkan hal yang bisa dilakukan benda itu (misal robot bisa menyapa atau berjalan) disebut Method!',
      ],
      rememberRule: 'Class = cetakan/blueprint; Object = benda nyatanya; self = menunjuk ke "diriku sendiri".',
    },
    laymanStory: {
      headline: 'Mengelompokkan data dan perilaku ke dalam satu cetak biru (Blueprint)',
      paragraphs: [
        'Saat membangun sistem besar seperti aplikasi kampus atau game, data mahasiswa punya banyak atribut (nama, NIM, IPK) dan perilaku (ambil SKS, cetak kartu). OOP menyatukan keduanya dalam satu rancangan bernama Class.',
        'Method khusus __init__ berjalan otomatis saat Object baru dicetak untuk mengisi data awalnya, sedangkan kata self merujuk pada masing-masing Object tersebut agar datanya tidak tertukar dengan Object lain.',
      ],
      rememberRule: 'Satu Class bisa mencetak ratusan Object dengan isi atribut masing-masing yang terpisah.',
    },
    visualSteps: [
      {
        stepLabel: 'Class (Cetakan)',
        realLife: 'Gambar rancangan Kucing (punya nama & bisa mengeong).',
        inPython: 'class Kucing:',
      },
      {
        stepLabel: 'Atribut (Ciri)',
        realLife: 'Nama kucingnya "Milo", warnanya oranye.',
        inPython: 'self.nama = nama',
      },
      {
        stepLabel: 'Object (Wujud)',
        realLife: 'Kucing nyata bernama Milo yang langsung bisa menyapa.',
        inPython: 'milo = Kucing("Milo")',
      },
    ],
    sampleCode: `class Kucing:
    def __init__(self, nama):
        self.nama = nama

    def sapa(self):
        print("Meong! Aku", self.nama)

k1 = Kucing("Milo")
k2 = Kucing("Luna")
k1.sapa()
k2.sapa()`,
    codeTranslations: [
      { code: 'class Kucing:', humanMeaning: 'Buat cetak biru (cetakan) untuk semua kucing.' },
      { code: '    def __init__(self, nama):', humanMeaning: 'Resep awal saat seekor kucing baru lahir: beri dia nama.' },
      { code: '        self.nama = nama', humanMeaning: 'Simpan nama itu sebagai milik kucing ini sendiri (self).' },
      { code: '    def sapa(self):', humanMeaning: 'Kemampuan (method) yang dimiliki setiap kucing: bisa menyapa.' },
      { code: 'k1 = Kucing("Milo")', humanMeaning: 'Cetak kucing nyata pertama bernama Milo.' },
    ],
    glossary: [
      { term: 'Class', plainMeaning: 'Cetakan atau rancangan awal untuk membuat suatu objek.' },
      { term: 'Object', plainMeaning: 'Wujud nyata yang dibuat dari sebuah Class.' },
      { term: 'Atribut & Method', plainMeaning: 'Atribut = ciri/data milik objek; Method = tindakan yang bisa dilakukan objek.' },
      { term: 'self', plainMeaning: 'Kata ganti "diriku sendiri" supaya setiap objek tahu datanya masing-masing.' },
    ],
    quickCheck: {
      question: 'Jika "Denah Rumah" adalah Class, maka apakah yang dimaksud dengan Object?',
      options: [
        'Rumah-rumah nyata yang sudah dibangun dari denah tersebut',
        'Kertas kosong tanpa gambar',
        'Pensil untuk menggambar',
      ],
      correctIndex: 0,
      feedback: 'Benar sekali! Class adalah denahnya, sedangkan Object adalah rumah nyata yang dibangun dari denah itu.',
    },
  },
  {
    moduleId: 12,
    category: 'OOP & Kualitas Kode',
    moduleShortTitle: 'Inheritance & Polymorphism',
    analogyTitle: 'Sifat Turunan Orang Tua & Tombol "Bunyi" Hewan',
    analogyEmojiLabel: 'Analogi Keluarga',
    oneLineHook: 'Inheritance itu anak mewarisi sifat orang tua biar nggak bikin ulang; Polymorphism itu satu perintah sama tapi gaya kerjanya beda-beda.',
    babyStory: {
      headline: 'Anak mewarisi keahlian orang tua, tapi punya suara khas sendiri!',
      paragraphs: [
        'Semua "Kendaraan" pasti bisa jalan dan berhenti. Nah, daripada menulis ulang cara jalan untuk Mobil, Motor, dan Sepeda satu per satu, cukup bikin induk bernama Kendaraan — lalu Mobil dan Motor tinggal mewarisi (Inheritance) sifatnya!',
        'Sekarang bayangkan kamu punya tombol bertuliskan "Bersuara!". Kalau ditekan ke Kucing, keluarnya "Meong!". Kalau ditekan ke Bebek, keluarnya "Kwek!".',
        'Nama tombolnya SAMA persis ("Bersuara"), tapi hasilnya menyesuaikan siapa yang dipencet — itulah yang disebut Polymorphism (banyak bentuk)!',
      ],
      rememberRule: 'Inheritance = warisan biar hemat kode; Polymorphism = satu nama aksi, banyak gaya hasil.',
    },
    laymanStory: {
      headline: 'Pewarisan class induk-anak dan penyesuaian perilaku (Method Override)',
      paragraphs: [
        'Dalam pengembangan perangkat lunak, Inheritance memungkinkan class anak (subclass) mewarisi seluruh atribut dan method dari class induk (parent) melalui tanda kurung: class Kucing(Hewan).',
        'Jika class anak ingin cara kerja berbeda dari induknya, ia cukup menimpa ulang method tersebut (Override). Fungsi super() dipakai jika anak masih ingin memanggil logika milik induknya.',
        'Berkat Polymorphism, kita bisa memanggil metode .suara() ke seluruh daftar hewan tanpa perlu repot menulis banyak if/elif untuk tiap jenis hewan.',
      ],
      rememberRule: 'Gunakan super() untuk meminjam kembali pekerjaan dari class induk.',
    },
    visualSteps: [
      {
        stepLabel: 'Induk (Parent)',
        realLife: 'Semua Hewan punya nama dan bisa bersuara.',
        inPython: 'class Hewan:',
      },
      {
        stepLabel: 'Warisan (Child)',
        realLife: 'Bebek mewarisi semua sifat Hewan tanpa nulis ulang.',
        inPython: 'class Bebek(Hewan):',
      },
      {
        stepLabel: 'Polymorphism',
        realLife: 'Perintah .suara() sama → Kucing "Meong", Bebek "Kwek".',
        inPython: 'for h in daftar: h.suara()',
      },
    ],
    sampleCode: `class Hewan:
    def suara(self):
        return "..."

class Kucing(Hewan):
    def suara(self):
        return "Meong!"

class Bebek(Hewan):
    def suara(self):
        return "Kwek!"

for h in [Kucing(), Bebek()]:
    print(h.suara())`,
    codeTranslations: [
      { code: 'class Hewan:', humanMeaning: 'Class induk umum untuk semua hewan.' },
      { code: 'class Kucing(Hewan):', humanMeaning: 'Kucing adalah anak dari Hewan (mewarisi sifat Hewan).' },
      { code: '    def suara(self): return "Meong!"', humanMeaning: 'Kucing mengganti (override) suaranya jadi Meong!' },
      { code: 'for h in [Kucing(), Bebek()]:', humanMeaning: 'Panggil .suara() yang sama ke semua hewan — masing-masing keluar suara khasnya!' },
    ],
    glossary: [
      { term: 'Inheritance', plainMeaning: 'Pewarisan sifat dan kemampuan dari class induk ke class anak.' },
      { term: 'Override', plainMeaning: 'Class anak mengubah isi method warisan agar sesuai karakternya sendiri.' },
      { term: 'Polymorphism', plainMeaning: 'Satu nama perintah yang sama menghasilkan perilaku berbeda tergantung objeknya.' },
    ],
    quickCheck: {
      question: 'Contoh Polymorphism di kehidupan sehari-hari yang paling tepat adalah...',
      options: [
        'Tombol "Play" yang sama: di aplikasi musik memutar lagu, di aplikasi video memutar film',
        'Menghapus semua file di komputer',
        'Menulis nama variabel dengan huruf kapital',
      ],
      correctIndex: 0,
      feedback: 'Tepat sekali! Satu antarmuka/perintah yang sama ("Play") menghasilkan perilaku spesifik sesuai objeknya.',
    },
  },
  {
    moduleId: 13,
    category: 'OOP & Kualitas Kode',
    moduleShortTitle: 'Eksepsi & Debugging',
    analogyTitle: 'Matras Pengaman & Detektif Pencari Kesalahan',
    analogyEmojiLabel: 'Analogi Pengaman',
    oneLineHook: 'try/except itu matras empuk supaya program nggak langsung jatuh pingsan saat ada kesalahan tak terduga.',
    babyStory: {
      headline: 'Pasang matras empuk biar robot nggak nangis kalau salah!',
      paragraphs: [
        'Coba suruh kalkulator membagi 10 kue dengan 0 orang (10 / 0). Komputer langsung panik dan berhenti total (crash)!',
        'Supaya program tetap ramah dan nggak langsung mati, kita pasang matras pengaman bernama try dan except: "Coba dulu (try) bagi kuenya. KALAU ternyata gagal (except), jangan panik—bilang saja dengan sopan: Maaf, tidak bisa dibagi nol!"',
        'Sedangkan Debugging itu main jadi detektif: mencari letak "kutu" (bug) kesalahan di kode kita lalu memperbaikinya satu per satu.',
      ],
      rememberRule: 'Error di layar bukan berarti kamu gagal — pesan error itu justru petunjuk detektif di baris mana yang perlu dibetulkan!',
    },
    laymanStory: {
      headline: 'Menangani error dengan anggun dan melacak sumber kesalahan kode',
      paragraphs: [
        'Pengguna aplikasi bisa saja salah ketik—misalnya mengetik huruf "abc" di kolom umur yang seharusnya angka. Tanpa penanganan eksepsi, aplikasi akan langsung crash.',
        'Blok try mencoba menjalankan kode berisiko, except menangkap jenis error tertentu (seperti ZeroDivisionError atau ValueError) untuk memberi pesan ramah, dan finally selalu berjalan di akhir untuk beres-beres.',
        'Debugging adalah keterampilan membaca pesan error (traceback), mengecek nomor baris, dan memverifikasi nilai variabel hingga bug teratasi.',
      ],
      rememberRule: 'Tangkap jenis error spesifik di except agar masalah yang sesungguhnya tidak tersembunyi.',
    },
    visualSteps: [
      {
        stepLabel: 'Coba Dulu (try)',
        realLife: 'Jalankan aksi yang berisiko gagal (misal pembagian).',
        inPython: 'try: hasil = 10 / pembagi',
      },
      {
        stepLabel: 'Matras Aman (except)',
        realLife: 'Kalau gagal, tangkap dengan ramah tanpa aplikasi mati.',
        inPython: 'except ZeroDivisionError:',
      },
      {
        stepLabel: 'Penutup (finally)',
        realLife: 'Berhasil atau gagal, selalu tutup proses dengan rapi.',
        inPython: 'finally: print("Selesai")',
      },
    ],
    sampleCode: `try:
    hasil = 10 / 0
    print("Hasil:", hasil)
except ZeroDivisionError:
    print("Ups! Angka tidak boleh dibagi 0 ya.")
finally:
    print("Program tetap aman dan lanjut berjalan!")`,
    codeTranslations: [
      { code: 'try:', humanMeaning: 'Coba jalankan langkah berisiko di dalam kotak aman ini.' },
      { code: '    hasil = 10 / 0', humanMeaning: 'Oops, membagi dengan nol memicu ZeroDivisionError!' },
      { code: 'except ZeroDivisionError:', humanMeaning: 'Matras pengaman menangkap error itu sebelum program crash.' },
      { code: '    print("Ups! Angka tidak boleh dibagi 0 ya.")', humanMeaning: 'Tampilkan pesan ramah yang mudah dipahami pengguna.' },
      { code: 'finally:', humanMeaning: 'Bagian ini PASTI dijalankan di akhir, mau sukses ataupun error.' },
    ],
    glossary: [
      { term: 'Exception (Eksepsi)', plainMeaning: 'Kejadian error saat program sedang berjalan, misalnya dibagi nol.' },
      { term: 'try / except', plainMeaning: 'Blok pengaman untuk mencoba kode dan menangkap error tanpa membuat aplikasi mati.' },
      { term: 'Debugging', plainMeaning: 'Proses melacak dan memperbaiki kesalahan (bug) di dalam kode.' },
    ],
    quickCheck: {
      question: 'Apa tujuan utama menggunakan blok try dan except di Python?',
      options: [
        'Mencegah program langsung berhenti paksa (crash) dan memberi penanganan ramah saat terjadi error',
        'Mempercepat komputer sampai 100 kali lipat',
        'Menghapus seluruh isi variabel secara otomatis',
      ],
      correctIndex: 0,
      feedback: 'Benar! Blok try/except bertindak seperti matras pengaman agar error ditangani secara terkendali.',
    },
  },
];

export function filterLaymanGuides(
  guides: LaymanModuleGuide[],
  query: string,
  category: 'Semua' | CurriculumModule['category']
): LaymanModuleGuide[] {
  const q = query.trim().toLowerCase();
  return guides.filter((g) => {
    if (category !== 'Semua' && g.category !== category) return false;
    if (!q) return true;
    const haystack = [
      `modul ${String(g.moduleId).padStart(2, '0')}`,
      g.moduleShortTitle,
      g.analogyTitle,
      g.oneLineHook,
      g.babyStory.headline,
      g.laymanStory.headline,
      ...g.glossary.map((item) => `${item.term} ${item.plainMeaning}`),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getExplanationByTone(guide: LaymanModuleGuide, tone: LaymanTone) {
  return tone === 'bayi' ? guide.babyStory : guide.laymanStory;
}

export function calculateLaymanProgress(
  understoodModuleIds: number[],
  totalCount: number
): { understoodCount: number; totalCount: number; percent: number } {
  const uniqueValid = new Set(understoodModuleIds.filter((id) => id >= 1 && id <= totalCount));
  const understoodCount = uniqueValid.size;
  const percent = totalCount > 0 ? Math.round((understoodCount / totalCount) * 100) : 0;
  return { understoodCount, totalCount, percent };
}
