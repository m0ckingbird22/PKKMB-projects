import { supabase } from "@/lib/supabase";

export default async function home() {
  const { data, error } = await supabase.from("prodi").select("*");

  return (
    <main>
      <h1>test</h1>
      {error && <p>error: {error.message}</p>}
      {data && <p>koneksi berhasil</p>}
    </main>
  );
}
