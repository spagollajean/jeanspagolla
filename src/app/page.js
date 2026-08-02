import Header from '@/components/Header';
import Hero from '@/components/Hero';
import VioraShowcase from '@/components/VioraShowcase';
import VioraBanner from '@/components/VioraBanner';
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
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <VioraShowcase />
      <VioraBanner />
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
      
      <Footer />

      {/* Dynamic Floating UI Elements */}
      <SocialProofToast />
      <StickyMobileBar />
    </main>
  );
}
