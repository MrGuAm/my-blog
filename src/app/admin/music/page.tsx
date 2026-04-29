import { redirect } from "next/navigation"

export default function AdminMusicPage() {
  redirect("/admin/media?tab=music")
}
