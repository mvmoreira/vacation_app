'use client';

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import styles from '../app/trips/[id]/page.module.css';

interface Expense {
    id: string;
    amount: number;
    date: string;
    description: string;
}

interface Category {
    id: string;
    name: string;
    summary: {
        available: number;
        dailyGoal: number;
        remainingDays: number;
        totalExpenses: number;
    };
    expenses: Expense[];
}

export default function ActiveTab({ tripId, categories, onUpdate }: { tripId: string, categories: Category[], onUpdate: () => void }) {
    const { t } = useLanguage();
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [expenseDesc, setExpenseDesc] = useState('');

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    tripId,
                    categoryId: activeCategoryId,
                    amount: parseFloat(expenseAmount),
                    date: new Date(expenseDate).toISOString(),
                    description: expenseDesc
                })
            });

            if (res.ok) {
                setExpenseModalOpen(false);
                setExpenseAmount('');
                setExpenseDesc('');
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t('expense_tracker_title')}</h2>
                <p style={{ opacity: 0.7 }}>{t('expense_tracker_desc')}</p>
            </div>

            <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {categories.length === 0 ? (
                    <div className={`glass ${styles.emptyState}`} style={{ gridColumn: '1 / -1' }}>
                        {t('active_tab_empty')}
                    </div>
                ) : (
                    categories.map(cat => (
                        <div key={cat.id} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{cat.name}</h3>
                                <span className={cat.summary.available < 0 ? styles.danger : ''} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                                    {formatCurrency(cat.summary.available)} {t('left')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>{t('daily_goal')} ({cat.summary.remainingDays} {t('days')})</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(cat.summary.dailyGoal)} / {t('day')}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase' }}>{t('spent_so_far')}</span>
                                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(cat.summary.totalExpenses)}</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.75rem' }}
                                    onClick={() => {
                                        setActiveCategoryId(cat.id);
                                        setExpenseModalOpen(true);
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>−</span> {t('record_expense')}
                                </button>
                            </div>

                            {/* Show last 3 expenses if any */}
                            {cat.expenses && cat.expenses.length > 0 && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('recent_expenses')}:</span>
                                    {cat.expenses.slice(0, 3).map(exp => (
                                        <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.25rem' }}>
                                            <span style={{ opacity: 0.8 }}>{exp.description || t('expense')}</span>
                                            <span style={{ color: 'var(--danger)', fontWeight: 500 }}>-{formatCurrency(Number(exp.amount))}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {expenseModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">{t('record_expense')}</h2>
                            <button className="modal-close" onClick={() => setExpenseModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-content">
                            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="input-label">{t('amount_spent')}</label>
                                    <input type="number" step="0.01" className="input-base" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="input-label">{t('date')}</label>
                                    <input type="date" className="input-base" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="input-label">{t('description_place')}</label>
                                    <input type="text" className="input-base" placeholder={t('desc_placeholder')} value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} required />
                                </div>
                                <div className="modal-footer" style={{ padding: '1.5rem 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setExpenseModalOpen(false)}>{t('cancel')}</button>
                                    <button type="submit" className="btn-primary" style={{ background: 'var(--danger)', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}>{t('save_expense')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
