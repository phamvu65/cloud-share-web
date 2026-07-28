import DashboardLayout from '../layout/DashboardLayout.jsx';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiEndpoints } from '../util/apiEndpoints.js';
import { AlertCircle, Loader2, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTranslation } from '../context/LanguageContext.jsx';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const response = await axios.get(apiEndpoints.TRANSACTIONS, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setTransactions(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setError(t('transactions.fetchError'));
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [token, t]);

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format amount from paise to USD
    const formatAmount = (amountInPaise) => {
        return `$${amountInPaise.toFixed(2)}`;
    };

    return (
        <DashboardLayout activeMenu="transactions">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Receipt className="text-blue-600" />
                    <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin mr-2" size={24} />
                        <span>{t('transactions.loading')}</span>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <Receipt size={48} className="mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">{t('transactions.emptyTitle')}</h3>
                        <p className="text-gray-500">{t('transactions.emptyHint')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('transactions.date')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('transactions.plan')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('transactions.amount')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('transactions.creditsAdded')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {t('transactions.paymentId')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(transaction.transactionDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {transaction.planId === 'premium'
                                                ? t('transactions.premiumPlan')
                                                : transaction.planId === 'ultimate'
                                                  ? t('transactions.ultimatePlan')
                                                  : t('transactions.basicPlan')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatAmount(transaction.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.creditsAdded}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                            {transaction.paymentId ? transaction.paymentId.substring(0, 12) + '...' : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Transactions;
