"use client"

import Link from "next/link"
import Image from "next/image"

export function SiteFooter(): JSX.Element {
  const navigation = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Blog", href: "/blog" },
        { label: "Careers", href: "/careers" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Security", href: "/security" },
      ],
    },
  ]
  
  return (
    <footer className="border-t border-purple-100 bg-gradient-to-b from-white to-purple-50/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-40 py-8 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo column - now takes full width on mobile and 1/4 on desktop */}
          <div className="col-span-1 flex justify-center md:justify-start">
            <Link href="/" className="inline-block">
              <div className="flex items-center justify-center">
                <Image
                  src="/footer-logo.png"
                  alt="Nunge Returns Logo"
                  width={150}
                  height={150}
                  className="w-auto h-auto max-h-[100px] object-contain"
                />
              </div>
            </Link>
          </div>
          
          {/* Navigation columns - each takes 1/4 width on desktop */}
          {navigation.map((section) => (
            <div key={section.title} className="col-span-1 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-800 text-center md:text-left">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href} className="text-center md:text-left">
                    <Link
                      href={link.href}
                      className="text-sm text-purple-600 transition-colors hover:text-purple-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-purple-100">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-xs md:text-sm text-purple-600">
            &copy; 2025 Nunge Returns. All rights reserved. Developed by{" "}
            <Link
              href="https://hadeazy.com"
              className="text-purple-600 hover:text-purple-800"
            >
              Hadeazy Digital Solutions
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}