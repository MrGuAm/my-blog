import { ImageResponse } from "next/og"
import { getPost } from "@/lib/posts"
import { clampOgText, pickOgCategoryLabel } from "@/lib/og"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PostOpenGraphImage({ params }: Props) {
  const { id } = await params
  const [post, settings] = await Promise.all([getPost(decodeURIComponent(id)), getResolvedSeoSettings()])

  const title = clampOgText(post?.title || settings.brandName, 38)
  const excerpt = clampOgText(post?.excerpt || settings.siteDescription, 120)
  const label = pickOgCategoryLabel(post?.category, post?.series)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(140deg, #fbfbfd 0%, #f7f4ff 40%, #fff6ef 100%)",
          color: "#16171d",
          padding: "52px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(108,63,245,0.18), transparent 26%), radial-gradient(circle at 83% 18%, rgba(255,155,107,0.18), transparent 26%), radial-gradient(circle at 82% 82%, rgba(123,155,255,0.14), transparent 24%)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: "42px",
            background: "rgba(255,255,255,0.76)",
            border: "1px solid rgba(255,255,255,0.8)",
            padding: "44px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "760px" }}>
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  background: "rgba(108,63,245,0.12)",
                  color: "#6c3ff5",
                  fontSize: "20px",
                  padding: "10px 20px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "66px",
                  lineHeight: 1.02,
                  fontWeight: 800,
                  letterSpacing: "-0.06em",
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: "26px", color: "#5b6174", lineHeight: 1.5 }}>{excerpt}</div>
            </div>

            <div
              style={{
                minWidth: "180px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                alignItems: "stretch",
              }}
            >
              <div style={{ borderRadius: "24px", background: "#16171d", color: "#fff", padding: "22px 20px" }}>
                <div style={{ fontSize: "16px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.68)" }}>BLOG</div>
                <div style={{ marginTop: "10px", fontSize: "24px", fontWeight: 700 }}>{settings.brandName}</div>
              </div>
              <div
                style={{
                  borderRadius: "24px",
                  background: "rgba(255,255,255,0.72)",
                  padding: "18px 20px",
                  border: "1px solid rgba(22,23,29,0.08)",
                }}
              >
                <div style={{ fontSize: "16px", color: "#7b7f8f" }}>作者</div>
                <div style={{ marginTop: "8px", fontSize: "24px", fontWeight: 700 }}>{settings.authorName}</div>
              </div>
              {post?.seriesOrder ? (
                <div
                  style={{
                    borderRadius: "24px",
                    background: "rgba(255,185,143,0.24)",
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ fontSize: "16px", color: "#b26434" }}>顺序</div>
                  <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>第 {post.seriesOrder} 篇</div>
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#7b7f8f", fontSize: "18px" }}>
            <div>{post?.date || settings.authorName}</div>
            <div>{settings.twitterHandle || settings.authorName}</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
