'use client';

import { useState } from 'react';
import styles from '../app/trips/[id]/page.module.css';

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

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        let finalGoal = parseFloat(newCatGoal);
        let finalDetails = null;

        if (budgetType === 'PER_PERSON') {
            finalDetails = Object.entries(personGoals).reduce((acc, [id, val]) => ({
                ...acc, [id]: parseFloat(val) || 0
            }), {});
            finalGoal = Object.values(finalDetails).reduce((sum, val) => sum + (val as number), 0);
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Budget & Savings Pipeline</h2>
                    <p style={{ opacity: 0.7 }}>Define your goals and save money before the trip starts.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Category</button>
            </div>

            <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {categories.length === 0 ? (
                    <div className={`glass ${styles.emptyState}`} style={{ gridColumn: '1 / -1' }}>
                        No categories defined yet. Add accommodation, flights, food, etc.
                    </div>
                ) : (
                    categories.map(cat => (
                        <div key={cat.id} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{cat.name}</h3>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(cat.summary.budgetGoal)}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                    <span>Saved: {formatCurrency(cat.summary.totalSavings)}</span>
                                    <span>{cat.summary.savingsProgress.toFixed(0)}%</span>
                                </div>
                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        background: cat.summary.savingsProgress >= 100 ? 'var(--success)' : 'var(--primary)',
                                        width: `${Math.min(cat.summary.savingsProgress, 100)}%`,
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                                <button
                                    style={{ width: '100%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '4px', fontWeight: 600, transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                                    onClick={() => {
                                        setActiveCategoryId(cat.id);
                                        setSavingModalOpen(true);
                                    }}
                                >
                                    + Deposit towards goal
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Category Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass ${styles.modal}`} style={{ maxWidth: '600px', width: '90%' }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>New Category</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label className="input-label">Name (e.g. Flights, Food)</label>
                                <input type="text" className="input-base" placeholder="Category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                            </div>

                            <div>
                                <label className="input-label">Budget Type</label>
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                                        <input type="radio" checked={budgetType === 'GLOBAL'} onChange={() => setBudgetType('GLOBAL')} style={{ width: '18px', height: '18px' }} /> General Expense
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                                        <input type="radio" checked={budgetType === 'PER_PERSON'} onChange={() => setBudgetType('PER_PERSON')} style={{ width: '18px', height: '18px' }} /> Per Person
                                    </label>
                                </div>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {budgetType === 'GLOBAL' ? (
                                    <div>
                                        <label className="input-label">Total Budget Goal</label>
                                        <input type="number" step="0.01" className="input-base" placeholder="0.00" value={newCatGoal} onChange={e => setNewCatGoal(e.target.value)} required />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                                        <label className="input-label" style={{ marginBottom: '0.5rem' }}>Budget per Person</label>
                                        {persons.map(p => (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '8px' }}>
                                                <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="input-base"
                                                        style={{ width: '130px', paddingLeft: '24px' }}
                                                        placeholder="0.00"
                                                        value={personGoals[p.id] || ''}
                                                        onChange={e => setPersonGoals({ ...personGoals, [p.id]: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.formActions} style={{ marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Saving Modal */}
            {savingModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass ${styles.modal}`}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Deposit Savings</h2>
                            <button className={styles.closeBtn} onClick={() => setSavingModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleAddSaving} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="input-label">Amount Saved</label>
                                <input type="number" step="0.01" className="input-base" value={savingAmount} onChange={e => setSavingAmount(e.target.value)} required />
                            </div>
                            <div>
                                <label className="input-label">Date</label>
                                <input type="date" className="input-base" value={savingDate} onChange={e => setSavingDate(e.target.value)} required />
                            </div>
                            <div>
                                <label className="input-label">Description (Optional)</label>
                                <input type="text" className="input-base" placeholder="e.g. Part of June Salary" value={savingDesc} onChange={e => setSavingDesc(e.target.value)} />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setSavingModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Savings</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
