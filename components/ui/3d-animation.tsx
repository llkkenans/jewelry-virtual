"use client"

import { useEffect, useRef } from "react"

interface PoemAnimationProps {
  poemHTML: React.ReactNode
  backgroundImageUrl: string
  modelImageUrl: string
}

export function PoemAnimation({ poemHTML, backgroundImageUrl, modelImageUrl }: PoemAnimationProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function adjustContentSize() {
      if (contentRef.current) {
        const viewportWidth = window.innerWidth
        const baseWidth = 1000
        const scaleFactor = viewportWidth < baseWidth ? (viewportWidth / baseWidth) * 0.9 : 1
        contentRef.current.style.transform = `scale(${scaleFactor})`
      }
    }

    adjustContentSize()
    window.addEventListener("resize", adjustContentSize)
    return () => window.removeEventListener("resize", adjustContentSize)
  }, [])

  return (
    <header className="anim3d-hero">
      <div className="anim3d-wrapper">
        <div
          ref={contentRef}
          className="anim3d-content"
          style={{ display: "block", width: "1000px", height: "562px" }}
        >
          <div className="anim3d-scene">
            <div className="anim3d-hue" />
            <img
              className="anim3d-bg"
              src={backgroundImageUrl}
              alt=""
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />
            <img
              className="anim3d-model"
              src={modelImageUrl}
              alt=""
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
            />

            <div className="anim3d-wrapper">
              <div className="anim3d-cube">
                <div className="anim3d-face top" />
                <div className="anim3d-face bottom" />
                <div className="anim3d-face left text"><div>{poemHTML}</div></div>
                <div className="anim3d-face right text"><div>{poemHTML}</div></div>
                <div className="anim3d-face front" />
                <div className="anim3d-face back text"><div>{poemHTML}</div></div>
              </div>
            </div>

            <div className="anim3d-reflect">
              <div className="anim3d-cube">
                <div className="anim3d-face top" />
                <div className="anim3d-face bottom" />
                <div className="anim3d-face left text"><div>{poemHTML}</div></div>
                <div className="anim3d-face right text"><div>{poemHTML}</div></div>
                <div className="anim3d-face front" />
                <div className="anim3d-face back text"><div>{poemHTML}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
