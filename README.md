# Aplikasi Konversi JSON/TXT ke Excel/CSV

Aplikasi web ini memungkinkan pengguna untuk mengonversi file JSON atau TXT menjadi file Excel (.xlsx) atau CSV dengan antarmuka yang sederhana dan modern. Aplikasi ini mendukung unggahan file melalui drag-and-drop atau pemilihan file dari direktori, menampilkan pratinjau data dalam tabel dengan paginasi, serta menyediakan opsi untuk mengunduh hasil konversi.

---

## Fitur Utama

- Unggah file JSON atau TXT (dengan berbagai format TXT yang didukung)
- Konversi file TXT ke JSON secara internal menggunakan PapaParse
- Perataan (flattening) struktur JSON bersarang untuk tampilan tabel yang mudah dibaca
- Pratinjau data dalam tabel dengan paginasi dan navigasi halaman yang responsif
- Unduh data dalam format Excel (.xlsx) menggunakan SheetJS (XLSX)
- Unduh data dalam format CSV menggunakan PapaParse
- Indikator loading dan progress saat memproses file
- Penanganan error yang jelas dan ramah pengguna

---

## Cara Menggunakan

1. **Jalankan Aplikasi**

   Pastikan Anda sudah menginstal dependensi dengan perintah:

   ```
   npm install
   ```

   Kemudian jalankan aplikasi dengan:

   ```
   npm start
   ```

   Aplikasi akan berjalan di `http://localhost:3000` (atau port lain jika 3000 sudah digunakan).

2. **Unggah File**

   - Drag & drop file JSON atau TXT ke area unggah, atau klik tombol "Pilih File" untuk memilih file dari direktori.
   - Jika file TXT, aplikasi akan mencoba mengonversinya ke JSON secara otomatis.
   - Setelah file berhasil diunggah dan diproses, data akan ditampilkan dalam tabel pratinjau.

3. **Pratinjau Data**

   - Data JSON yang sudah diratakan akan ditampilkan dalam tabel.
   - Gunakan kontrol paginasi di bawah tabel untuk menavigasi halaman data.
   - Jika jumlah halaman banyak, paginasi akan menampilkan ellipsis ("...") untuk memudahkan navigasi.

4. **Unduh Data**

   - Klik tombol "Unduh Excel" untuk mengunduh data dalam format Excel (.xlsx).
   - Klik tombol "Unduh CSV" untuk mengunduh data dalam format CSV (.csv).
   - Gunakan tombol "Unggah Ulang" untuk menghapus data saat ini dan mengunggah file baru.

---

## Struktur Proyek

- `src/App.jsx` - Komponen utama aplikasi React
- `src/index.js` - Entry point React, mengimpor Tailwind CSS dan merender App
- `public/index.html` - File HTML utama, memuat skrip eksternal SheetJS dan PapaParse
- `package.json` - Konfigurasi proyek dan dependensi
- `tailwind.config.js` & `postcss.config.js` - Konfigurasi Tailwind CSS
- `src/index.css` - File CSS utama yang memuat Tailwind directives

---

## Dependensi Utama

- [React](https://reactjs.org/) - Library UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS untuk styling
- [SheetJS (XLSX)](https://sheetjs.com/) - Untuk konversi dan ekspor Excel
- [PapaParse](https://www.papaparse.com/) - Untuk parsing dan ekspor CSV
- [lucide-react](https://lucide.dev/) - Ikon yang digunakan dalam UI

---

## Catatan Penting

- Pastikan file XLSX dan PapaParse dimuat secara global melalui tag `<script>` di `public/index.html`.
- Aplikasi ini hanya mendukung file dengan ekstensi `.json` dan `.txt`.
- Jika file TXT tidak dapat dikonversi ke JSON, akan muncul pesan error.
- Paginasi menggunakan ellipsis untuk navigasi yang lebih baik pada jumlah halaman yang banyak.

---

## Cara Pengembangan

1. Clone atau salin proyek ini.
2. Jalankan `npm install` untuk menginstal semua dependensi.
3. Jalankan `npm start` untuk memulai server pengembangan.
4. Buka browser dan akses `http://localhost:3000`.
5. Modifikasi kode di `src/App.jsx` untuk menyesuaikan fitur atau tampilan.

---

## Lisensi

Proyek ini bersifat open-source dan dapat digunakan serta dimodifikasi sesuai kebutuhan.

---

Dokumentasi ini dibuat untuk memudahkan penggunaan dan pengembangan aplikasi konversi JSON/TXT ke Excel/CSV.
