import HeroSection from '../components/landing/HeroSection';
import PdfToolsSection from '../components/landing/PdfToolsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

import { features } from '../assets/data.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import LanguageToggle from '../components/LanguageToggle.jsx';

const Landing = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('signin');

    const openSignIn = () => {
        setAuthMode('signin');
        setIsAuthModalOpen(true);
    };
    const openSignUp = () => {
        setAuthMode('signup');
        setIsAuthModalOpen(true);
    };

    return (
        <div className="landing-page bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="fixed right-4 top-4 z-50">
                <LanguageToggle className="rounded-full bg-white/90 px-3 py-2 shadow-md backdrop-blur" />
            </div>

            {/* Hero + PDF Tools / File Converter share one continuous background */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <HeroSection openSignIn={openSignIn} openSignUp={openSignUp} />
                <PdfToolsSection />
            </div>

            {/* Features Section */}
            <FeaturesSection features={features} />

            {/* CTA Section */}
            <CTASection openSignUp={openSignUp} />

            {/* Footer Section*/}
            <Footer />

            <AuthModal isOpen={isAuthModalOpen} initialMode={authMode} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default Landing;
