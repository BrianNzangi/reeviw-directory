import Link from "next/link";
import { Container } from "@/components/container";

export default function LoginPage() {
  return (
    <section className="min-h-[65vh] bg-brand-secondary-50">
      <Container className="flex min-h-[65vh] items-center">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-brand-secondary-900">
            Under Construction
          </h1>

          <p className="text-lg text-brand-secondary-800">
            Login is under construction. Please check back soon.
          </p>

          <p className="text-lg text-brand-secondary-800">
            For account updates, contact{" "}
            <a
              href="mailto:support@bargainlydeals.com"
              className="font-semibold text-brand-primary-900 underline underline-offset-2"
            >
              support@bargainlydeals.com
            </a>
            .
          </p>

          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-brand-secondary-900 px-5 py-3 text-base font-semibold text-white transition hover:opacity-90"
            >
              Go home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

