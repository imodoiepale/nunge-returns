"use client"

import Link from "next/link"

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
      <div className="px-40 py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-3">
            <Link href="/" className="inline-block group">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-700 group-hover:to-purple-500 transition-colors">
                Nunge Returns
              </h3>
            </Link>
            <p className="text-sm leading-6 text-purple-600">
              Simplifying tax returns for everyone
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-800">Product</h3>
            <ul className="space-y-3">
              {navigation[0].links.map((link) => (
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-800">Company</h3>
            <ul className="space-y-3">
              {navigation[1].links.map((link) => (
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
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-purple-800">Legal</h3>
            <ul className="space-y-3">
              {navigation[2].links.map((link) => (
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
        </div>
      </div>

      <div className="border-t border-purple-100">
        <div className="container px-4 py-6">
          <p className="text-center text-sm text-purple-600">
            {new Date().getFullYear()} Nunge Returns. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
