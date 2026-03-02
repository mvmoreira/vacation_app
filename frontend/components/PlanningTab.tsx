'use client';

import { useState } from 'react';
import PageStyles from '../app/trips/[id]/page.module.css';
import styles from './PlanningTab.module.css';
import { useLanguage } from '@/context/LanguageContext';

interface Category {
    id: string;
    name: string;
    budgetType: 'GLOBAL' | 'PER_PERSON';
    budgetGoal: number;
    budgetDetails?: Record<string, number>;
    summary: {
        budgetGoal: number;
        totalSavings: number;
        totalAvailable: number;
        savingsProgress: number;
    };
}

interface Person {
    id: string;
    name: string;
}

export default function PlanningTab({ tripId, initialCategories, persons, onUpdate }: { tripId: string, initialCategories: Category[], persons: Person[], onUpdate: () => void }) {
    const { t } = useLanguage();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatGoal, setNewCatGoal] = useState('');
    const [budgetType, setBudgetType] = useState<'GLOBAL' | 'PER_PERSON'>('GLOBAL');
    const [personGoals, setPersonGoals] = useState<Record<string, string>>({});

    // Saving entry modal state
    const [savingModalOpen, setSavingModalOpen] = useState(false);
    const [activeCategoryId, setActiveCategoryId] = useState('');
    const [savingAmount, setSavingAmount] = useState('');
    const [savingDate, setSavingDate] = useState(new Date().toISOString().split('T')[0]);
    const [savingDesc, setSavingDesc] = useState('');

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        let finalGoal = parseFloat(newCatGoal);
        let finalDetails = null;

        if (budgetType === 'PER_PERSON') {
            finalDetails = Object.entries(personGoals).reduce((acc, [id, val]) => ({
                ...acc, [id]: parseFloat(val) || 0
            }), {});
            finalGoal = Object.values(finalDetails as Record<string, number>).reduce((sum: number, val: number) => sum + val, 0);
        }

        try {
            const res = await fetch(`http://localhost:3000/api/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    tripId,
                    name: newCatName,
                    budgetType,
                    budgetGoal: finalGoal,
                    budgetDetails: finalDetails
                })
            });
            if (res.ok) {
                setIsModalOpen(false);
                setNewCatName('');
                setNewCatGoal('');
                setBudgetType('GLOBAL');
                setPersonGoals({});
                onUpdate();
            } else {
                alert('Failed to create category');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddSaving = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/savings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    categoryId: activeCategoryId,
                    amount: parseFloat(savingAmount),
                    date: new Date(savingDate).toISOString(),
                    description: savingDesc,
                    source: 'cash'
                })
            });

            if (res.ok) {
                setSavingModalOpen(false);
                setSavingAmount('');
                setSavingDesc('');
                onUpdate();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('budget_savings')}</h2>
                    <p style={{ opacity: 0.6, fontSize: '1rem' }}>{t('define_goals')}</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <span style={{ marginRight: '0.5rem' }}>+</span>
                    {t('add_category')}
                </button>
            </div>

            <div className={PageStyles.summaryGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                {categories.length === 0 ? (
                    <div className={`glass ${PageStyles.emptyState}`} style={{ gridColumn: '1 / -1', padding: '4rem', opacity: 0.8 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                        <h3>{t('no_categories_yet') || 'No budget categories yet'}</h3>
                        <p>{t('no_categories')}</p>
                    </div>
                ) : (
                    categories.map(cat => (
                        <div key={cat.id} className="glass" style={{
                            padding: '1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            background: 'rgba(30, 41, 59, 0.4)',
                            transition: 'transform 0.3s ease, border-color 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.25rem' }}>{cat.name}</h3>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, fontWeight: 600 }}>
                                        {cat.budgetType === 'GLOBAL' ? `🏷️ ${t('general_exp')}` : `👥 ${t('per_person')}`}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>{formatCurrency(cat.summary.budgetGoal)}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{t('budget_goal') || 'Goal'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <span style={{ opacity: 0.7 }}>Pre-trip Saved</span>
                                    <span style={{ color: cat.summary.savingsProgress >= 100 ? 'var(--success)' : 'inherit' }}>
                                        {formatCurrency(cat.summary.totalSavings)} ({cat.summary.savingsProgress.toFixed(0)}%)
                                    </span>
                                </div>

                                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', padding: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{
                                        height: '100%',
                                        borderRadius: '10px',
                                        background: cat.summary.savingsProgress >= 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--secondary))',
                                        width: `${Math.min(cat.summary.savingsProgress, 100)}%`,
                                        transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: cat.summary.savingsProgress > 0 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                                    }} />
                                </div>
                            </div>

                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button
                                    style={{
                                        flex: 1,
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: 'var(--primary)',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => {
                                        setActiveCategoryId(cat.id);
                                        setSavingModalOpen(true);
                                    }}
                                >
                                    💰 {t('deposit')}
                                </button>
                                <button style={{ opacity: 0.4, background: 'transparent', padding: '0.5rem' }}>⚙️</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* NEW MODERN MODAL: Create Category */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>New Category</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <div className={styles.modalContent}>
                            <form onSubmit={handleCreateCategory}>
                                <div className={styles.formGroup}>
                                    <label className="input-label">{t('category_name')}</label>
                                    <input
                                        type="text"
                                        className="input-base"
                                        placeholder="e.g. Flight Tickets, Luxury Hotel..."
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className="input-label">{t('how_to_budget')}</label>
                                    <div className={styles.typeSelector}>
                                        <label className={styles.typeOption}>
                                            <input
                                                type="radio"
                                                name="budgetType"
                                                checked={budgetType === 'GLOBAL'}
                                                onChange={() => setBudgetType('GLOBAL')}
                                            />
                                            <div className={styles.typeCard}>
                                                <div className={styles.typeIcon}>🏷️</div>
                                                <div className={styles.typeTitle}>{t('general_exp')}</div>
                                                <div className={styles.typeDesc}>{t('one_total_goal')}</div>
                                            </div>
                                        </label>
                                        <label className={styles.typeOption}>
                                            <input
                                                type="radio"
                                                name="budgetType"
                                                checked={budgetType === 'PER_PERSON'}
                                                onChange={() => setBudgetType('PER_PERSON')}
                                            />
                                            <div className={styles.typeCard}>
                                                <div className={styles.typeIcon}>👥</div>
                                                <div className={styles.typeTitle}>{t('per_person')}</div>
                                                <div className={styles.typeDesc}>{t('set_indiv_goals')}</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {budgetType === 'GLOBAL' ? (
                                    <div className={styles.formGroup} style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <label className="input-label">{t('total_budget_goal')}</label>
                                        <div className={styles.inputWrapper} style={{ width: '100%' }}>
                                            <span className={styles.currencySymbol}>$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input-base"
                                                style={{ paddingLeft: '32px' }}
                                                placeholder="0.00"
                                                value={newCatGoal}
                                                onChange={e => setNewCatGoal(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.formGroup} style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <label className="input-label">{t('traveler_list_goals')}</label>
                                        <div className={styles.personList}>
                                            {persons.map(p => (
                                                <div key={p.id} className={styles.personRow}>
                                                    <div className={styles.personInfo}>
                                                        <div className={styles.avatar}>{getInitials(p.name)}</div>
                                                        <div className={styles.personName}>{p.name}</div>
                                                    </div>
                                                    <div className={styles.inputWrapper}>
                                                        <span className={styles.currencySymbol}>$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            className={`${PageStyles.inputBase} ${styles.smallInput}`}
                                                            placeholder="0.00"
                                                            value={personGoals[p.id] || ''}
                                                            onChange={e => setPersonGoals({ ...personGoals, [p.id]: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.modalFooter}>
                                    <button type="button" className="btn-secondary" style={{ background: 'transparent', color: '#fff', opacity: 0.6 }} onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                                    <button type="submit" className="btn-primary" style={{ padding: '12px 40px' }}>{t('create_category')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Modal (Also updated slightly) */}
            {savingModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setSavingModalOpen(false)}>
                    <div className={styles.modal} style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle} style={{ fontSize: '1.5rem' }}>{t('deposit_savings')}</h2>
                            <button className={styles.closeBtn} onClick={() => setSavingModalOpen(false)}>&times;</button>
                        </div>
                        <div className={styles.modalContent}>
                            <form onSubmit={handleAddSaving} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label className="input-label">{t('amount_to_save')}</label>
                                    <div className={styles.inputWrapper} style={{ width: '100%' }}>
                                        <span className={styles.currencySymbol}>$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input-base"
                                            style={{ paddingLeft: '32px' }}
                                            value={savingAmount}
                                            onChange={e => setSavingAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">{t('date')}</label>
                                    <input type="date" className="input-base" value={savingDate} onChange={e => setSavingDate(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="input-label">{t('note')} ({t('optional') || 'Optional'})</label>
                                    <input type="text" className="input-base" placeholder="Where did this money come from?" value={savingDesc} onChange={e => setSavingDesc(e.target.value)} />
                                </div>
                                <div className={styles.modalFooter} style={{ padding: '1rem 0 0' }}>
                                    <button type="button" onClick={() => setSavingModalOpen(false)} style={{ background: 'transparent', color: '#fff', opacity: 0.6 }}>{t('cancel')}</button>
                                    <button type="submit" className="btn-primary">{t('confirm_deposit')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
