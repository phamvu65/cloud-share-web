import { Features } from "tailwindcss";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PricingSection from "../components/landing/PricingSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

import { features, pricingPlans, testimonials } from "../assets/data.js";
import { useClerk, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Landing = () => {
  const { openSignIn, openSignUp } = useClerk();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();

  return (
    <div className="landing-page bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <HeroSection openSignIn={openSignIn} openSignUp={openSignUp} />

      {/* Features Section */}
      <FeaturesSection features={features} />

      {/* Pricing Section */}
      <PricingSection pricingPlans={pricingPlans} openSignUp={openSignUp} />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* CTA Section */}
      <CTASection openSignUp={openSignUp} />

      {/* Footer Section*/}
      <Footer />
    </div>
  )
}

export default Landing;