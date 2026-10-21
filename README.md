# Satu Pintu

Satu Pintu adalah direktori independen untuk membantu warga menemukan layanan publik Indonesia tanpa harus mengetahui nama portal atau instansi pengelolanya.

Website memuat 771 layanan, portal informasi, aplikasi, layanan daerah, dan kampus. Data dikelompokkan berdasarkan kebutuhan seperti bantuan sosial, pendidikan, kesehatan, pekerjaan, identitas, pajak, hukum, usaha, transportasi, lingkungan, agama, dan layanan digital.

## Fitur

- Pencarian dengan padanan istilah.
- Filter bidang, kebutuhan, kondisi tautan, dan cara masuk.
- Detail layanan dan status pemeriksaan tautan.
- Simpan layanan di browser.
- Salin tautan dan ekspor hasil menjadi CSV.
- Popup kebutuhan awal maksimal sekali sehari.
- Mini game Lompat Karung 3D yang dimuat saat dibuka.

## File

```text
index.html   Halaman utama
style.css   Tampilan dan animasi
app.js      Pencarian, filter, detail, dan interaksi
game.js     Mini game Three.js
catalog.js  Data layanan untuk browser
```

## Menjalankan lokal

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`.

## Publikasi

Seluruh file website berada langsung di root repository. Hubungkan repository ke hosting statis atau unggah lima file utama tanpa proses build.

## Catatan data

Status tautan mencerminkan pemeriksaan terakhir pada 21 Oktober 2026. Alamat, akses, dan kebijakan layanan pemerintah dapat berubah. Satu Pintu bukan portal resmi pemerintah dan selalu mengarahkan pengguna ke sumber pengelola layanan.

## Lisensi

MIT. Lihat `LICENSE`.
