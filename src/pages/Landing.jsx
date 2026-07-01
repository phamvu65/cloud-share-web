import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PricingSection from "../components/landing/PricingSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import CTASection from "../components/landing/CTASection";
import Footer from "../components/landing/Footer";

import { features, pricingPlans, testimonials } from "../assets/data.js";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import LoginModal from "../components/LoginModal.jsx";

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Mở modal đăng nhập thay vì điều hướng
    const openSignIn = () => setIsLoginModalOpen(true);
    const openSignUp = () => navigate('/register');

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
      <Footer  />

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  )
}

export default Landing;