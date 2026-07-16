import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Disha - Education Management System',
  description: 'Comprehensive education management platform for schools and institutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}
