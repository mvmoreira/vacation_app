'use client';

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import styles from '../app/trips/[id]/page.module.css';

interface Category {
    id: string;
    name: string;
    summary: {
        available: number;
        totalFunding: number;
        totalTransfersIn: number;
        totalTransfersOut: number;
    };
}

export default function AdvancedTab({ tripId, categories, onUpdate }: { tripId: string, categories: Category[], onUpdate: () => void }) {
    const { t } = useLanguage();
    const [fundModalOpen, setFundModalOpen] = useState(false);
    const [transferModalOpen, setTransferModalOpen] = useState(false);

    // Funding state
    const [fundCategoryId, setFundCategoryId] = useState(categories[0]?.id || '');
    const [fundAmount, setFundAmount] = useState('');
    const [fundMethod, setFundMethod] = useState('cash');
    const [fundDesc, setFundDesc] = useState('');

    // Transfer state
    const [fromCatId, setFromCatId] = useState(categories[0]?.id || '');
    const [toCatId, setToCatId] = useState('');
    const [transferAmount, setTransferAmount] = useState('');

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const handleFunding = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/funding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    categoryId: fundCategoryId,
                    amount: parseFloat(fundAmount),
                    date: new Date().toISOString(),
                    description: fundDesc || t('extra_funding'),
                    method: fundMethod
                })
            });
            if (res.ok) {
                setFundModalOpen(false);
                setFundAmount('');
                setFundDesc('');
                onUpdate();
            }
        } catch (error) { console.error(error); }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fromCatId === toCatId) return alert(t('diff_categories_alert') || 'Categories must be different');

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/transfers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    fromCategoryId: fromCatId,
                    toCategoryId: toCatId,
                    amount: parseFloat(transferAmount),
                    date: new Date().toISOString(),
                    description: t('rebalance') || 'Rebalance'
                })
            });
            if (res.ok) {
                setTransferModalOpen(false);
                setTransferAmount('');
                onUpdate();
            }
        } catch (error) { console.error(error); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t('funding_rebalancing')}</h2>
                    <p style={{ opacity: 0.7 }}>{t('funding_desc')}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.btnSecondary} onClick={() => setTransferModalOpen(true)}>⇄ {t('transfer')}</button>
                    <button className="btn-primary" onClick={() => setFundModalOpen(true)}>+ {t('add_funds')}</button>
                </div>
            </div>

            <div className={styles.grid}>
                {categories.map(cat => (
                    <div key={cat.id} className="glass" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{cat.name}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.7 }}>{t('extra_funding')}:</span>
                                <span className={styles.success}>+{formatCurrency(cat.summary.totalFunding)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.7 }}>Transfers In:</span>
                                <span className={styles.primary}>+{formatCurrency(cat.summary.totalTransfersIn)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ opacity: 0.7 }}>{t('transfers_out')}:</span>
                                <span className={styles.danger}>-{formatCurrency(cat.summary.totalTransfersOut)}</span>
                            </div>
                            <div style={{ width: '100%', height: '1px', background: 'var(--card-border)', margin: '0.5rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                <span>{t('current_available')}:</span>
                                <span>{formatCurrency(cat.summary.available)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals for Funding and Transfer would go here... (Omitted for brevity, using same pattern as PlanningTab) */}
            {fundModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">{t('add_funds')}</h2>
                            <button className="modal-close" onClick={() => setFundModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-content">
                            <form onSubmit={handleFunding} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <select className="input-base" value={fundCategoryId} onChange={e => setFundCategoryId(e.target.value)} required>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">{t('amount')}</label>
                                        <input type="number" step="0.01" className="input-base" value={fundAmount} onChange={e => setFundAmount(e.target.value)} required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">{t('method')}</label>
                                        <select className="input-base" value={fundMethod} onChange={e => setFundMethod(e.target.value)}>
                                            <option value="cash">{t('cash_debit')}</option>
                                            <option value="credit_card">{t('credit_card')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">{t('description')}</label>
                                    <input type="text" className="input-base" value={fundDesc} onChange={e => setFundDesc(e.target.value)} />
                                </div>
                                <div className="modal-footer" style={{ padding: '1.5rem 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setFundModalOpen(false)}>{t('cancel')}</button>
                                    <button type="submit" className="btn-primary">{t('add_funds')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {transferModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">{t('transfer_title')}</h2>
                            <button className="modal-close" onClick={() => setTransferModalOpen(false)}>&times;</button>
                        </div>
                        <div className="modal-content">
                            <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <label className="input-label">From</label>
                                        <select className="input-base" value={fromCatId} onChange={e => setFromCatId(e.target.value)} required>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({formatCurrency(c.summary.available)})</option>)}
                                        </select>
                                    </div>
                                    <span style={{ fontSize: '1.5rem', marginTop: '1.5rem' }}>→</span>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <label className="input-label">{t('to')}</label>
                                        <select className="input-base" value={toCatId} onChange={e => setToCatId(e.target.value)} required>
                                            <option value="">{t('select_target')}</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">{t('amount_to_move')}</label>
                                    <input type="number" step="0.01" className="input-base" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} required />
                                </div>
                                <div className="modal-footer" style={{ padding: '1.5rem 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setTransferModalOpen(false)}>{t('cancel')}</button>
                                    <button type="submit" className="btn-primary">{t('transfer_funds')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
