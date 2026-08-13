import { createClient } from "@/lib/supabase-server";
import FeedbackForm from "./feedback-form";

interface PageProps {
  params: { token: string };
}

export default async function FeedbackPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: session, error } = await supabase
    .from("qr_session")
    .select("day, is_active, type")
    .eq("token", params.token)
    .single();

  if (error || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-black">QR TIDAK VALID!</h1>
          <p className="mt-2 text-black">Link ini tidak dikenali.</p>
        </div>
      </div>
    );
  }

  if (!session.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-black">
            QR ini sudah tidak berlaku
          </h1>
          <p className="mt-2 text-black">
            QR sudah tidak aktif silahkan tanya panitia di pintu masuk
          </p>
        </div>
      </div>
    );
  }

  if (session.type !== "feedback") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-black">
            QR ini bukan untuk feedback
          </h1>
          <p className="mt-2 text-black">
            Scan QR feedback yang benar untuk mengisi formulir ini.
          </p>
        </div>
      </div>
    );
  }

  return <FeedbackForm day={session.day} token={params.token} />;
}
