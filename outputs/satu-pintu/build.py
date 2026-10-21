import csv, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
data = json.loads((ROOT / "satu-pintu/catalog.json").read_text())
(OUT / "catalog.js").write_text("window.CATALOG=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";", encoding="utf-8")

cols = ["id","judul_tugas","nama","ringkasan","url","url_akhir","bidang","sektor","kelompok","tags","instansi","jenis_pengelola","jenis_layanan","akses","cakupan","provinsi","kabupaten_kota","status_kurasi","status_tautan","http_status","tanggal_periksa","sumber_url","catatan","asal_data"]
with (OUT / "layanan_indonesia_v2.csv").open("w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(data["rows"])
print(f"{len(data['rows'])} rows; catalog.js + CSV ready")
