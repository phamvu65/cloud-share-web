import DashboardLayout from '../layout/DashboardLayout.jsx';
import { useContext, useEffect, useState } from 'react';
import { UserCreditsContext } from '../context/UserCreditsContext.jsx';
import axios from 'axios';
import { apiEndpoints } from '../util/apiEndpoints.js';
import { AlertCircle, Check, CreditCard, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from '../context/LanguageContext.jsx';

const Subscription = () => {
    const [processingPayment, setProcessingPayment] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [searchParams] = useSearchParams(); // Không cần lấy setSearchParams nữa

    const { token, isLoading: isAuthLoading } = useAuth();
    const { credits, setCredits } = useContext(UserCreditsContext);
    const { t } = useTranslation();

    const plans = [
        {
            id: 'premium',
            name: t('subscription.premiumName'),
            credits: 500,
            price: 25,
            features: [t('subscription.premiumFeature1'), t('subscription.premiumFeature2'), t('subscription.premiumFeature3')],
            recommended: false,
        },
        {
            id: 'ultimate',
            name: t('subscription.ultimateName'),
            credits: 5000,
            price: 50,
            features: [
                t('subscription.ultimateFeature1'),
                t('subscription.ultimateFeature2'),
                t('subscription.ultimateFeature3'),
                t('subscription.ultimateFeature4'),
            ],
            recommended: true,
        },
    ];

    // Fetch credits on mount
    useEffect(() => {
        const loadCredits = async () => {
            if (!token) return;
            try {
                const response = await axios.get(apiEndpoints.GET_CREDITS, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCredits(response.data.credits);
            } catch (error) {
                console.error('Error fetching credits:', error);
            }
        };
        loadCredits();
    }, [token, setCredits]);

    // Xử lý payment return - chỉ chạy 1 lần
    useEffect(() => {
        const status = searchParams.get('status');

        // Kiểm tra sessionStorage để tránh re-process
        if (status && !sessionStorage.getItem('payment_processed')) {
            sessionStorage.setItem('payment_processed', 'true');

            (async () => {
                if (!token) return;
                try {
                    if (status === 'success') {
                        setMessage(t('subscription.paymentSuccess'));
                        setMessageType('success');

                        const response = await axios.get(apiEndpoints.GET_CREDITS, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        setCredits(response.data.credits);
                    } else if (status === 'cancel') {
                        setMessage(t('subscription.paymentCancelled'));
                        setMessageType('error');
                    }
                    setTimeout(() => {
                        const currentUrl = new URL(window.location.href);
                        currentUrl.searchParams.delete('status');
                        window.history.replaceState({}, document.title, currentUrl.toString());
                    }, 2000);
                } catch (error) {
                    console.error('Error processing payment:', error);
                }
            })();
        }
    }, [searchParams, token, setCredits, t]);

    const handlePurchase = async (plan) => {
        setProcessingPayment(true);
        setMessage('');

        try {
            const response = await axios.post(
                apiEndpoints.CREATE_ORDER,
                {
                    planId: plan.id,
                    amount: plan.price,
                    credits: plan.credits,
                    currency: 'usd',
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (response.data.success) {
                window.location.href = response.data.checkoutUrl;
            } else {
                setMessage(response.data.message || t('subscription.createOrderError'));
                setMessageType('error');
            }
        } catch (error) {
            console.error('Payment initiation error:', error);
            setMessage(t('subscription.createOrderFailed'));
            setMessageType('error');
        } finally {
            setProcessingPayment(false);
        }
    };

    if (isAuthLoading) {
        return (
            <DashboardLayout activeMenu="subscription">
                <div className="p-6">{t('common.loading')}</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout activeMenu="subscription">
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">{t('subscription.title')}</h1>
                <p className="text-gray-600 mb-6">{t('subscription.subtitle')}</p>

                {message && (
                    <div
                        className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                            messageType === 'error'
                                ? 'bg-red-50 text-red-700'
                                : messageType === 'success'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-blue-50 text-blue-700'
                        }`}
                    >
                        {messageType === 'error' && <AlertCircle size={20} />}
                        {messageType === 'success' && <Check size={20} />}
                        {message}
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="text-purple-500" />
                            <h2 className="text-lg font-medium">
                                {t('subscription.currentCredits')} <span className="font-bold text-purple-500">{credits}</span>
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{t('subscription.uploadsRemaining', { count: credits })}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`border rounded-xl p-6 ${plan.recommended ? 'border-purple-200 bg-purple-50 shadow-md' : 'border-gray-200 bg-white'}`}
                        >
                            {plan.recommended && (
                                <div className="inline-block bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
                                    {t('subscription.recommended')}
                                </div>
                            )}
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <div className="mt-2 mb-4">
                                <span className="text-3xl font-bold">${plan.price}</span>
                                <span className="text-gray-500"> {t('subscription.forCredits', { count: plan.credits })}</span>
                            </div>
                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handlePurchase(plan)}
                                disabled={processingPayment}
                                className={`w-full py-2 rounded-md font-medium transition-colors ${plan.recommended ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white border border-purple-500 text-purple-500 hover:bg-purple-50'} disabled:opacity-50 flex items-center justify-center gap-2`}
                            >
                                {processingPayment ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>{t('subscription.processing')}</span>
                                    </>
                                ) : (
                                    <span>{t('subscription.purchasePlan')}</span>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium mb-2">{t('subscription.howCreditsWorkTitle')}</h3>
                    <p className="text-sm text-gray-600">{t('subscription.howCreditsWork')}</p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Subscription;
