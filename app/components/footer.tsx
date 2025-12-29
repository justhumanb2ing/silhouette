import { useIntlayer } from "react-intlayer";

export default function Footer() {
  const {
    layout: { logo },
    footer: { copyright },
  } = useIntlayer("landing-page");

  return (
    <footer className="py-20 md:py-32 bg-background relative overflow-hidden border-t border-border/40">
      <div className="container mx-auto px-6 flex flex-col items-center">
        <div className="mb-6 select-none">
          <span className="text-4xl font-black italic tracking-tighter">
            {logo}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-12">
          <a
            href="#"
            className="text-base font-medium hover:text-primary transition-colors"
          >
            About
          </a>
          <a
            href="#"
            className="text-base font-medium hover:text-primary transition-colors"
          >
            Privacy
          </a>
          <a
            href="#"
            className="text-base font-medium hover:text-primary transition-colors"
          >
            Terms
          </a>
          <a
            href="#"
            className="text-base font-medium hover:text-primary transition-colors"
          >
            Contact
          </a>
          <a
            href="/sign-in"
            className="text-base font-medium hover:text-primary transition-colors"
          >
            Login
          </a>
        </div>

        <p className="text-sm text-muted-foreground/60">{copyright}</p>
      </div>

      {/* Decorative Shapes */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-linear-to-tr from-[#FB923C]/20 to-transparent blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-linear-to-tl from-[#34D399]/20 to-transparent blur-3xl -z-10 pointer-events-none"></div>
    </footer>
  );
}
