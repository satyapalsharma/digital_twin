import Link from "next/link";

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Scenarios", href: "/#scenarios" },
      { label: "Features", href: "/#features" },
      { label: "Simulations", href: "/simulations" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Personas", href: "/personas" },
      { label: "Audiences", href: "/audiences" },
      { label: "Products", href: "/products" },
      { label: "Insights", href: "/insights" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#features" },
      { label: "Careers", href: "/#features" },
      { label: "Contact", href: "/#features" },
      { label: "Blog", href: "/#features" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/EXL_logo.svg" alt="EXL" className="h-5 w-auto" />
            <span className="text-xl leading-none font-bold tracking-tight text-primary">
              CX Digital Twin
            </span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            Test insurance products against AI-twin customer personas and get a
            Launch · Optimize · Halt verdict before going to market.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.heading} className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {col.heading}
            </h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-foreground/80 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} CX Digital Twin. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
