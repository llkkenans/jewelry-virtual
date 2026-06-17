declare module 'lucide-react' {
  import * as React from 'react'

  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string
    absoluteStrokeWidth?: boolean
  }

  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >

  const icons: Record<string, LucideIcon>
  export = icons
}
