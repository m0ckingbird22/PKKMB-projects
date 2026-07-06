import pandas as pd
from supabase import create_client
import sys

SUPABASE_URL = "https://ygoybdirmszzsqebfkph.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = ""
EXCEL_PATH = "data-dummy/data dummy mahasiswa.xlsx"

def parse_nim(raw) -> str:
    try:
        return str(int(float(raw)))
    except (ValueError, TypeError):
        return str(raw).strip()

def main():
    print("📂 Membaca file Excel...")
    df = pd.read_excel(EXCEL_PATH, dtype=str)
    df = df.dropna(subset=["Nama Mahasiswa", "NIM", "Prodi"])
    df = df[["Nama Mahasiswa", "NIM", "Prodi", "Fakultas"]]
    df["NIM"] = df["NIM"].apply(parse_nim)
    print(f"✅ {len(df)} mahasiswa terbaca dari Excel")
    print(f"   Sample NIM: {df['NIM'].head(3).tolist()}")

    print("\n🔌 Connecting ke Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    print("📋 Fetching data prodi...")
    res = supabase.table("prodi").select("id, nama").execute()
    if not res.data:
        print("❌ ERROR: Tabel prodi kosong! Jalankan INSERT prodi dulu.")
        sys.exit(1)

    prodi_map = {p["nama"]: p["id"] for p in res.data}
    print(f"✅ {len(prodi_map)} prodi ditemukan")

    print("\n🔍 Validasi prodi...")
    prodi_excel = df["Prodi"].unique()
    missing_prodi = [p for p in prodi_excel if p not in prodi_map]
    if missing_prodi:
        print(f"❌ ERROR: Prodi berikut tidak ada di database:")
        for p in missing_prodi:
            print(f"   - '{p}'")
        sys.exit(1)
    print("✅ Semua prodi valid")

    rows = []
    for _, row in df.iterrows():
        rows.append({
            "nim": row["NIM"],
            "nama": row["Nama Mahasiswa"].strip(),
            "prodi_id": prodi_map[row["Prodi"]],
        })

    print(f"\n📤 Mengupload {len(rows)} mahasiswa ke Supabase...")
    batch_size = 50
    success_count = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        try:
            supabase.table("students").upsert(
                batch, on_conflict="nim"
            ).execute()
            success_count += len(batch)
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} rows inserted")
        except Exception as e:
            print(f"   ❌ Batch {i//batch_size + 1} ERROR: {e}")

    print(f"\n{'='*50}")
    print(f"✅ Selesai: {success_count} mahasiswa berhasil diimport")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()