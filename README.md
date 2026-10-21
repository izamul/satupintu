# Satu Pintu

Satu Pintu adalah direktori independen untuk membantu warga menemukan layanan publik Indonesia tanpa harus mengetahui nama portal atau instansi pengelolanya terlebih dahulu.

Website memuat 771 tautan layanan, portal informasi, aplikasi, layanan daerah, dan kampus. Data dikelompokkan berdasarkan kebutuhan warga seperti bantuan sosial, pendidikan, kesehatan, pekerjaan, identitas, pajak, hukum, usaha, transportasi, lingkungan, agama, dan layanan digital.

## Fitur

- Pencarian dengan padanan istilah, misalnya `BPJS` dan `JKN`.
- Filter bidang, kebutuhan, kondisi tautan, dan cara masuk.
- Tag berwarna berdasarkan kelompok kebutuhan.
- Detail layanan dengan pengelola, cakupan, status kurasi, dan tanggal pemeriksaan.
- Simpan layanan di browser.
- Salin tautan dan buka portal resmi.
- Ekspor hasil pencarian menjadi CSV.
- Popup kebutuhan awal yang muncul maksimal sekali sehari.
- Mini game Lompat Karung 3D yang dimuat hanya saat dibuka.

## Struktur penting

```text
outputs/satu-pintu/
├── index.html                 Halaman utama
├── style.css                 Tampilan dan animasi
├── app.js                    Pencarian, filter, detail, dan interaksi
├── game.js                   Mini game Three.js
├── catalog.js                Data JSON untuk browser
├── layanan_indonesia_v2.csv  Sumber data utama
└── build.py                  Generator catalog.js dari CSV

outputs/build_satu_pintu_dist.py  Pembuat folder deployment
netlify.toml                      Konfigurasi deployment Netlify
```

## Menjalankan lokal

```bash
cd outputs/satu-pintu
python3 -m http.server 8080
```

Buka `http://localhost:8080`.

Mini game mengambil Three.js dari CDN saat tombol game dibuka. Pencarian dan direktori utama tidak membutuhkan Three.js.

## Memperbarui data

1. Edit `outputs/satu-pintu/layanan_indonesia_v2.csv`.
2. Jalankan generator:

```bash
python3 outputs/satu-pintu/build.py
```

3. Periksa perubahan pada `outputs/satu-pintu/catalog.js`.

CSV tetap menjadi sumber data kerja. `catalog.js` adalah bentuk JSON yang dikirim ke browser. Tombol ekspor CSV di website membangun file langsung dari data katalog, sehingga file CSV sumber tidak perlu masuk deployment.

## Membuat paket deployment

```bash
python3 outputs/build_satu_pintu_dist.py
```

Hasil berada di `outputs/satu-pintu-dist/` dan hanya berisi lima file publik. CSV, generator, hasil riset, cache, dan arsip ZIP tidak ikut.

## Deployment

Repository sudah memiliki `netlify.toml`. Netlify menjalankan builder lalu memublikasikan `outputs/satu-pintu-dist`.

Untuk Cloudflare Pages atau hosting statis lain, jalankan builder dan unggah isi `outputs/satu-pintu-dist/`.

## Catatan data

Status tautan mencerminkan pemeriksaan terakhir pada 21 Oktober 2026. Alamat, akses, serta kebijakan layanan pemerintah dapat berubah. Satu Pintu bukan portal resmi pemerintah dan selalu mengarahkan pengguna ke sumber pengelola layanan.

## Lisensi

Kode proyek tersedia dengan lisensi MIT. Lihat `LICENSE`.
