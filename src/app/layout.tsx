import type { Metadata } from 'next'
import { Geist, Playfair_Display } from 'next/font/google'
import './globals.css'
import NavWrapper from '@/components/NavWrapper'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'Teo & Noelle',
  description: 'Our little world',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[#080d1a] text-[#f0ece4] antialiased">
        <NavWrapper />
        {children}
      </body>
    </html>
  )
}
