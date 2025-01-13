"use client"

import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
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
        <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-2">
                <Image
                  src="/footer-logo.png"
                  alt="Nunge Returns Logo"
                  width={250}
                  height={250}
                  className="w-auto h-auto max-w-[200px] md:max-w-[350px]"
                />
              </div>
            </Link>
          </div>
          
          {navigation.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-800">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
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
            <a 
              href="https://hadeazy.com" 
              className="text-purple-600 hover:text-purple-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hadeazy Digital Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}