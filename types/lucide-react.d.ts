declare module 'lucide-react' {
  import * as React from 'react'

  interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    absoluteStrokeWidth?: boolean
  }

  type LucideIcon = React.FC<IconProps>

  export const Check: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronUp: LucideIcon
  export const ChevronRight: LucideIcon
  export const Download: LucideIcon
  export const ImageOff: LucideIcon
  export const ImagePlus: LucideIcon
  export const Sparkles: LucideIcon
  export const Gem: LucideIcon
  export const Link2: LucideIcon
  export const Heart: LucideIcon
  export const Share2: LucideIcon
  export const Trash2: LucideIcon
  export const CheckSquare: LucideIcon
  export const Square: LucideIcon
  export const X: LucideIcon
  export const Watch: LucideIcon
  export const FolderPlus: LucideIcon
  export const LogOut: LucideIcon
  export const Circle: LucideIcon
  export const Sun: LucideIcon
  export const CircleCheckIcon: LucideIcon
  export const InfoIcon: LucideIcon
  export const TriangleAlertIcon: LucideIcon
  export const OctagonXIcon: LucideIcon
  export const Loader2Icon: LucideIcon
  export const BookmarkPlus: LucideIcon
}
