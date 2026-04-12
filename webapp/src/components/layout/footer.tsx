import {
  Avatar,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Container } from "@/components/container";

const footerLinkRows = [
  [
    { label: "About Bargainly Deals", href: "/about-bargainly-deals" },
    { label: "About our ads", href: "/about-our-ads" },
    { label: "FAQ", href: "/faq" },
    { label: "Support", href: "/support" },
  ],
  [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Advertise", href: "/advertise" },
  ],
];

const shopperAvatars = [
  {
    name: "Alex",
    initials: "A",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop",
  },
  {
    name: "Jamie",
    initials: "J",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop",
  },
  {
    name: "Taylor",
    initials: "T",
    image: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop",
  },
  {
    name: "Morgan",
    initials: "M",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&fit=crop",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-gray-900">
      <Container className="py-12">
        <div className="flex flex-col gap-8 border-b border-border/70 pb-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <img
                  src="/secondary-logo.png"
                  alt="Bargainly Deals"
                  className="h-10 w-auto"
                />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-white/65">Made for savvy shoppers</div>
            </div>
            <p className="max-w-lg text-lg text-white">
              Trusted by over{" "}
              <span className="people-reached-number font-semibold text-brand-primary-900">100K+</span>{" "}
              shoppers, Bargainly Deals helps you discover verified deals, tips and advice, and shop with confidence.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <AvatarGroup>
                {shopperAvatars.map((shopper, index) => (
                  <Avatar key={shopper.name} className="border border-background">
                    <AvatarImage src={shopper.image} alt={`${shopper.name} avatar`} />
                    {index === 0 ? <AvatarBadge aria-hidden="true" /> : null}
                  </Avatar>
                ))}
                <AvatarGroupCount>+96K</AvatarGroupCount>
              </AvatarGroup>
            </div>
          </div>

          <div className="min-w-45">
            <p className="text-lg font-semibold text-white">Follow us</p>
            <div className="mt-3 flex items-center gap-3 text-base text-white/70">
              <a href="https://www.facebook.com" target="_blank" rel="noreferrer" className="hover:text-primary">Facebook</a>
              <span aria-hidden="true">|</span>
              <a href="https://www.pinterest.com" target="_blank" rel="noreferrer" className="hover:text-primary">Pinterest</a>
              <span aria-hidden="true">|</span>
              <a href="https://www.x.com" target="_blank" rel="noreferrer" className="hover:text-primary">X</a>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <div className="space-y-3 text-sm text-white/70">
            {footerLinkRows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {row.map((item) => (
                  <a key={item.label} href={item.href} className="hover:text-primary">
                    {item.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
