import { redirect } from "next/navigation"

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getSafeNextPath(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) || {}
  const next = getSafeNextPath(params.next)

  if (next) {
    redirect(`/home?login=1&next=${encodeURIComponent(next)}`)
  }

  redirect("/home?login=1")
}
