import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Copy text to clipboard. Works in secure (HTTPS/localhost) and many insecure contexts (e.g. http on LAN). */
export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true, () => false)
  }
  return new Promise((resolve) => {
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.setAttribute("readonly", "")
      el.setAttribute("aria-hidden", "true")
      el.tabIndex = -1
      Object.assign(el.style, {
        position: "fixed",
        left: "-9999px",
        top: "0",
        width: "1px",
        height: "1px",
        opacity: "0",
        pointerEvents: "none",
      })
      document.body.appendChild(el)
      el.select()
      el.setSelectionRange(0, text.length)
      const ok = document.execCommand("copy")
      el.blur()
      requestAnimationFrame(() => {
        document.body.removeChild(el)
        resolve(ok)
      })
    } catch {
      resolve(false)
    }
  })
}
