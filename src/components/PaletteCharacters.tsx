import type { CSSProperties } from "react"

export interface PaletteTone {
  label: string
  tone: string
  mouthTone: string
  mood?: "flat" | "smile" | "soft-smile" | "smirk"
}

export const paletteTones: PaletteTone[] = [
  { label: "安静蓝角色", tone: "#7b9bff", mouthTone: "#6f8de4", mood: "flat" },
  { label: "石墨黑角色", tone: "#3b3b40", mouthTone: "#34343a", mood: "smirk" },
  { label: "暖橙角色", tone: "#ffb98f", mouthTone: "#e5a97d", mood: "soft-smile" },
  { label: "柔黄角色", tone: "#f2e06c", mouthTone: "#d7c45b", mood: "smile" },
  { label: "雾粉角色", tone: "#f6b7ce", mouthTone: "#dd9eb5", mood: "soft-smile" },
]

const faceFrameClasses = [
  "rounded-[44%_56%_48%_52%/52%_46%_54%_48%]",
  "rounded-[40%_60%_46%_54%/55%_42%_58%_45%]",
  "rounded-[48%_52%_42%_58%/50%_54%_46%_50%]",
  "rounded-[46%_54%_50%_50%/58%_44%_56%_42%]",
]

function PaletteFace({
  tone,
  mouthTone,
  heightClass = "h-28",
  style,
  frameClassName,
  size = "default",
  mood = "flat",
}: {
  tone: string
  mouthTone: string
  heightClass?: string
  style?: CSSProperties
  frameClassName?: string
  size?: "default" | "compact"
  mood?: PaletteTone["mood"]
}) {
  const eyeClass = size === "compact" ? "h-7 w-7" : "h-8 w-8"
  const pupilClass = size === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"
  const eyeGapClass = size === "compact" ? "gap-4" : "gap-6"
  const blushClass = size === "compact" ? "h-2.5 w-2.5" : "h-3 w-3"
  const mouthWidthClass = size === "compact" ? "w-12" : "w-16"
  const mouthBottomClass = size === "compact" ? "bottom-3.5" : "bottom-4.5"
  const mouthHeightClass = size === "compact" ? "h-5" : "h-6"
  const mouthStrokeWidth = size === "compact" ? 2.4 : 2.8

  const mouthPaths: Record<NonNullable<PaletteTone["mood"]>, string> = {
    flat: "M10 14 Q20 13 30 14",
    smile: "M8 12 Q20 24 32 12",
    "soft-smile": "M8 13 Q20 19 32 13",
    smirk: "M8 15 Q15 20 22 15 T32 13",
  }

  return (
    <div
      className={`relative ${heightClass} overflow-hidden ${frameClassName || "rounded-[1.9rem]"}`}
      style={{
        backgroundColor: tone,
        boxShadow: "0 18px 30px -22px rgba(86, 104, 153, 0.22)",
        ...style,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-[58%] bg-white/15 blur-2xl" />
      <div className={`absolute left-1/2 top-[34%] flex -translate-x-1/2 ${eyeGapClass}`}>
        <span className={`flex ${eyeClass} items-center justify-center rounded-full bg-white shadow-sm`}>
          <span className={`${pupilClass} rounded-full bg-[#343744]`} />
        </span>
        <span className={`flex ${eyeClass} items-center justify-center rounded-full bg-white shadow-sm`}>
          <span className={`${pupilClass} rounded-full bg-[#343744]`} />
        </span>
      </div>
      <span className={`absolute ${mouthBottomClass} left-1/2 ${mouthHeightClass} ${mouthWidthClass} -translate-x-1/2`}>
        <svg viewBox="0 0 40 28" className="h-full w-full overflow-visible" aria-hidden="true">
          <path
            d={mouthPaths[mood]}
            fill="none"
            stroke={mouthTone}
            strokeWidth={mouthStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.98"
          />
        </svg>
      </span>
      {(mood === "soft-smile" || mood === "smile") ? (
        <>
          <span className={`absolute left-[24%] top-[58%] ${blushClass} rounded-full bg-white/16 blur-[1px]`} />
          <span className={`absolute right-[24%] top-[58%] ${blushClass} rounded-full bg-white/16 blur-[1px]`} />
        </>
      ) : null}
    </div>
  )
}

export function PaletteShowcaseGrid({
  tones = paletteTones,
  compact = false,
}: {
  tones?: PaletteTone[]
  compact?: boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tones.map((item) => (
        <div key={item.label} className={`apple-panel-soft ${compact ? "rounded-[1.75rem] p-3" : "rounded-[2rem] p-4"}`}>
          <PaletteFace
            tone={item.tone}
            mouthTone={item.mouthTone}
            heightClass={compact ? "h-24" : "h-28"}
            mood={item.mood}
          />
          <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

export function PaletteInlineStrip({
  tones = paletteTones,
}: {
  tones?: PaletteTone[]
}) {
  return (
    <div className="relative mx-auto h-[150px] w-[244px] sm:h-[160px] sm:w-[258px]">
      {tones.map((item, index) => {
        const positions = [
          { left: 0, top: 20, width: 68, height: 74, rotate: "-14deg", zIndex: 2 },
          { left: 84, top: 0, width: 78, height: 84, rotate: "0deg", zIndex: 5 },
          { left: 176, top: 20, width: 68, height: 74, rotate: "14deg", zIndex: 3 },
          { left: 40, top: 88, width: 62, height: 66, rotate: "-8deg", zIndex: 1 },
          { left: 142, top: 92, width: 62, height: 66, rotate: "8deg", zIndex: 1 },
        ]
        const position = positions[index] || positions[0]

        return (
          <div
            key={item.label}
            className="absolute"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              height: position.height,
              transform: `rotate(${position.rotate})`,
              zIndex: position.zIndex,
            }}
          >
            <PaletteFace
              tone={item.tone}
              mouthTone={item.mouthTone}
              heightClass="h-full"
              frameClassName={faceFrameClasses[index % faceFrameClasses.length]}
              size="compact"
              mood={item.mood}
            />
          </div>
        )
      })}
    </div>
  )
}

export function PaletteHeroTrio({
  tones = [paletteTones[0], paletteTones[1], paletteTones[2]],
}: {
  tones?: PaletteTone[]
}) {
  return (
    <div className="relative mx-auto h-[116px] w-[208px] sm:h-[124px] sm:w-[220px]">
      {tones.map((item, index) => {
        const positions = [
          { left: 6, top: 28, width: 62, height: 68, rotate: "-10deg", zIndex: 2 },
          { left: 70, top: 2, width: 78, height: 86, rotate: "0deg", zIndex: 4 },
          { left: 142, top: 28, width: 62, height: 68, rotate: "10deg", zIndex: 3 },
        ]
        const position = positions[index] || positions[0]

        return (
          <div
            key={item.label}
            className="absolute"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              height: position.height,
              transform: `rotate(${position.rotate})`,
              zIndex: position.zIndex,
            }}
          >
            <PaletteFace
              tone={item.tone}
              mouthTone={item.mouthTone}
              heightClass="h-full"
              frameClassName={faceFrameClasses[index % faceFrameClasses.length]}
              size="compact"
              mood={item.mood}
            />
          </div>
        )
      })}
    </div>
  )
}

export function PaletteBadge({
  tone,
  mouthTone,
  mood = "flat",
}: {
  tone: string
  mouthTone: string
  mood?: PaletteTone["mood"]
}) {
  return (
    <div className="apple-panel-soft w-[70px] rounded-[1.25rem] p-2">
      <PaletteFace
        tone={tone}
        mouthTone={mouthTone}
        mood={mood}
        size="compact"
        heightClass="h-16"
      />
    </div>
  )
}
