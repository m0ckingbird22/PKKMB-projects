import {createClient} from "@/lib/supabase-server"
import AbsensiForm from "./absensi-form"

interface PageProps {
    params: {token : string}
}

export default async function AbsensiPage ({params}: PageProps) {
    const  supabase = await createClient()

    const {data: session,error} = await supabase
    .from('qr_session')
    .select('day, is_active')
    .eq('token',params.token)
    .single()

    if (error || !session) { 
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-black">QR TIDAK VALID!</h1>
                    <p className="mt-2 text-black">Link ini tidak di kenali.</p>
                </div>
            </div>
        )
    }

    if (!session.is_active) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-xl font-semibold text-black">QR ini sudah tidak berlaku</h1>
                    <p className="mt-2 text-black">QR sudah tidak aktif silahkan tanya panitia di pintu masuk</p>
                </div>
            </div>
        )
    }

  return <AbsensiForm day = {session.day} token = {params.token}/>
    
} 

