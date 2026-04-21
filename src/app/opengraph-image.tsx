import { ImageResponse } from "next/og"
import { getResolvedSeoSettings } from "@/lib/server/site-metadata"
import { clampOgText } from "@/lib/og"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function OpenGraphImage() {
  const settings = await getResolvedSeoSettings()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #fbfbfd 0%, #f7f4ff 45%, #fff4ee 100%)",
          color: "#16171d",
          fontFamily: "sans-serif",
          padding: "54px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 18% 22%, rgba(108,63,245,0.18), transparent 28%), radial-gradient(circle at 82% 18%, rgba(255,155,107,0.18), transparent 30%), radial-gradient(circle at 70% 78%, rgba(123,155,255,0.12), transparent 22%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            borderRadius: "40px",
            border: "1px solid rgba(255,255,255,0.75)",
            background: "rgba(255,255,255,0.72)",
            padding: "48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "20px",
                background: "#16171d",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: 700,
              }}
            >
              {(settings.brandName.trim().charAt(0) || "C").toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "20px", letterSpacing: "0.24em", color: "#7b7f8f" }}>PERSONAL BLOG</div>
              <div style={{ fontSize: "34px", fontWeight: 700 }}>{settings.brandName}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "860px" }}>
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
              {settings.authorName}
            </div>
            <div
              style={{
                fontSize: "72px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.06em",
              }}
            >
              {clampOgText(settings.homeTitle || settings.brandName, 34)}
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.5,
                color: "#5b6174",
              }}
            >
              {clampOgText(settings.siteDescription, 110)}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: "14px" }}>
              {[
                { tone: "#7b9bff", mouth: "#5f79d9" },
                { tone: "#2f3138", mouth: "#25272d" },
                { tone: "#ffb98f", mouth: "#db936f" },
              ].map((item, index) => (
                <div
                  key={index}
                  style={{
                    width: "78px",
                    height: "78px",
                    borderRadius: "24px",
                    background: item.tone,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "absolute", top: "28px", left: "18px", width: "14px", height: "14px", borderRadius: "999px", background: "#fff" }} />
                  <div style={{ position: "absolute", top: "28px", right: "18px", width: "14px", height: "14px", borderRadius: "999px", background: "#fff" }} />
                  <div style={{ position: "absolute", bottom: "18px", width: "28px", height: "7px", borderRadius: "999px", background: item.mouth }} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: "18px", color: "#7b7f8f" }}>{settings.twitterHandle || settings.authorName}</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
