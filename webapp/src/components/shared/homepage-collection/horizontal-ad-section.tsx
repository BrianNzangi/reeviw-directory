import { Container } from "@/components/container";
import { Horizontal1AdSlot } from "@/components/ads/horizontal1-ad-slot";

export function HorizontalAdSection() {
  return (
    <section className="py-6 sm:py-8">
      <Container>
        <div data-ad-weight="2">
          <Horizontal1AdSlot className="w-full" />
        </div>
      </Container>
    </section>
  );
}
