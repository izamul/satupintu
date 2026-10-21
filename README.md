# Satu Pintu

Direktori independen untuk membantu warga menemukan layanan publik Indonesia berdasarkan kebutuhan, bukan nama portal atau instansi.

Satu Pintu memuat 771 layanan, portal informasi, aplikasi, layanan daerah, dan kampus. Bidang mencakup bantuan sosial, pendidikan, kesehatan, pekerjaan, identitas, pajak, hukum, usaha, transportasi, lingkungan, agama, dan layanan digital.

## Fitur

- Pencarian dengan padanan istilah.
- Filter bidang, kebutuhan, kondisi tautan, dan cara masuk.
- Detail layanan dan status pemeriksaan tautan.
- Simpan layanan di browser.
- Salin tautan dan ekspor hasil menjadi CSV.
- Popup kebutuhan awal maksimal sekali sehari.
- Mini game Lompat Karung 3D dengan lazy loading Three.js.

## Struktur

```text
.
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── bootstrap.js
│       ├── app.js
│       └── game.js
├── data/
│   └── catalog.js
└── partials/
    ├── header.html
    ├── hero.html
    ├── quick-links.html
    ├── welcome-dialog.html
    ├── game-dialog.html
    ├── explorer.html
    ├── sidebar.html
    ├── results.html
    ├── about.html
    └── footer.html
```

`index.html` hanya menjadi shell. `assets/js/bootstrap.js` memuat seluruh partial HTML, lalu menjalankan katalog dan aplikasi. Partial dapat memiliki partial lain; `explorer.html` memuat `sidebar.html` dan `results.html`.

## Menjalankan lokal

Partial HTML memakai `fetch`, jadi website harus dibuka lewat HTTP server.

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`.

## Publikasi

Upload seluruh isi repository ke hosting statis. Tidak ada proses build dan tidak membutuhkan backend.

## Catatan data

Status tautan mencerminkan pemeriksaan terakhir pada 21 Oktober 2026. Alamat, akses, dan kebijakan layanan pemerintah dapat berubah. Satu Pintu bukan portal resmi pemerintah dan selalu mengarahkan pengguna ke sumber pengelola layanan.

## Lisensi

MIT. Lihat `LICENSE`.
