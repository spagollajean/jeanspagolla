import Header from '@/components/Header';
import Hero from '@/components/Hero';
import VioraShowcase from '@/components/VioraShowcase';
import InflationQuiz from '@/components/InflationQuiz';
import VioraCalculator from '@/components/VioraCalculator';
import VillainSection from '@/components/VillainSection';
import StorySection from '@/components/StorySection';
import PillarsSection from '@/components/PillarsSection';
import TimelineSection from '@/components/TimelineSection';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import Testimonials from '@/components/Testimonials';
import ReceiptSection from '@/components/ReceiptSection';
import PricingPlans from '@/components/PricingPlans';
import GuaranteeSection from '@/components/GuaranteeSection';
import FaqAccordion from '@/components/FaqAccordion';
import SocialProofToast from '@/components/SocialProofToast';
import StickyMobileBar from '@/components/StickyMobileBar';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <VioraShowcase />
      <InflationQuiz />
      <VioraCalculator />
      <VillainSection />
      <StorySection />
      <PillarsSection />
      <TimelineSection />
      <BeforeAfterSlider />
      <Testimonials />
      <ReceiptSection />
      <PricingPlans />
      <GuaranteeSection />
      <FaqAccordion />
      
      {/* Site Footer */}
      <footer className="site-footer">
        <div className="wrap">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            Ren<em>ascer</em> <span className="viora-badge-logo">Viora AI</span>
          </div>
          <p>© 2026 Protocolo Renascer & Viora Health Technologies. Todos os direitos reservados.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--bone-faint)' }}>
            Este produto não substitui o parecer médico profissional. Sempre consulte um médico para questões de saúde.
          </p>
        </div>
      </footer>

      {/* Dynamic Floating UI Elements */}
      <SocialProofToast />
      <StickyMobileBar />
    </main>
  );
}
