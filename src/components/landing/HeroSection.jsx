import { useTranslation } from '../../context/LanguageContext.jsx';

const HeroSection = ({ openSignIn, openSignUp }) => {
    const { t } = useTranslation();
    return (
        <div className="landing-page-content">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-14">
                    <div className="text-center">
                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span className="block">{t('landing.heroLine1')}</span>
                            <span className="block text-purple-500">{t('landing.heroBrand')}</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            {t('landing.heroSubtitle')}
                        </p>
                        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                            <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                                <button
                                    onClick={() => openSignUp()}
                                    className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-500 hover:bg-purple-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    {t('landing.getStarted')}
                                </button>
                                <button
                                    onClick={() => openSignIn()}
                                    className="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    {t('landing.signIn')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
