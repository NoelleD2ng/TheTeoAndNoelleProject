import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import NavWrapper from '@/components/NavWrapper'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-geist-sans', weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: 'Teo & Noelle',
  description: 'Our little world',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen bg-[#080d1a] text-[#f0ece4] antialiased">
        <NavWrapper />
        {children}
      </body>
    </html>
  )
}
