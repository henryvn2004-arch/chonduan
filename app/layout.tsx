import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ChonDuAn — Chọn dự án tốt nhất',
    template: '%s | ChonDuAn',
  },
  description: 'Nền tảng tìm kiếm bất động sản dự án Việt Nam. Map-first, data-driven.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={poppins.variable}>
      <body className="font-sans antialiased bg-[#F5F7FA] text-[#0D1B3D]">
        {children}
      </body>
    </html>
  )
}
