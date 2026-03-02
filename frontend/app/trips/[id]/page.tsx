'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import styles from './page.module.css';
import { useLanguage } from '@/context/LanguageContext';

import PlanningTab from '@/components/PlanningTab';
import ActiveTab from '@/components/ActiveTab';
import AdvancedTab from '@/components/AdvancedTab';

// Types simplified for UI
interface City {
    id: string;
    order: number;
    city: { geonameId: number; name: string; countryName: string; };
}

interface TripData {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    currency: string;
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
    cities: City[];
    tripSummary: {
        totalBudgetGoal: number;
        totalSaved: number;
        totalSpent: number;
        totalAvailable: number;
        overallSavingsProgress: number;
    };
    persons: { id: string; name: string }[];
}

interface GeoNamesCity {
    geonameId: number;
    name: string;
    countryName: string;
}

export default function TripDetails({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useLanguage();
    const router = useRouter();
    const resolvedParams = use(params);
    const tripId = resolvedParams.id;

    const [trip, setTrip] = useState<TripData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ROUTE' | 'PLANNING' | 'ACTIVE' | 'ADVANCED'>('ROUTE');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeoNamesCity[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
    const [personInput, setPersonInput] = useState('');

    const fetchTrip = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setTrip(await res.json());
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrip();
    }, [tripId, router]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const delayTimer = setTimeout(async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            setIsSearching(true);
            try {
                const res = await fetch(`http://localhost:3000/api/cities/search?q=${encodeURIComponent(searchQuery)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                } else {
                    console.error('Search failed', await res.text());
                }
            } catch (error) {
                console.error('Search error', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayTimer);
    }, [searchQuery]);

    const handleAddCity = async (city: GeoNamesCity) => {
        const token = localStorage.getItem('token');
        try {
            const order = trip?.cities ? trip.cities.length + 1 : 1;
            const res = await fetch(`http://localhost:3000/api/cities/trips/${tripId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ geonameId: city.geonameId, order })
            });

            if (res.ok) {
                setSearchQuery('');
                setSearchResults([]);
                fetchTrip(); // Refresh to get new city list
            }
        } catch (error) {
            console.error('Failed to add city', error);
        }
    };

    const handleRemoveCity = async (cityId: string) => {
        if (!confirm('Remove this city from the trip?')) return;
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3000/api/cities/trips/${tripId}/${cityId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTrip();
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdatePersons = async () => {
        if (!trip) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ persons: trip.persons.map(p => p.name) })
            });
            if (res.ok) {
                setIsPersonModalOpen(false);
                fetchTrip();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3000/api/trips/${tripId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            fetchTrip();
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: trip?.currency || 'USD' }).format(amount);
    };

    if (loading || !trip) return <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>{t('loading_trip_details') || 'Loading trip details...'}</div>;

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>TravelBudget</div>
                <div className={styles.userMenu}>
                    <Link href="/dashboard" className={styles.linkBtn}>{t('back_to_dashboard')}</Link>
                </div>
            </nav>

            <main className={styles.main}>
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div>
                            <h1 className={styles.title}>{trip.name}</h1>
                            <p className={styles.subtitle}>
                                {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                className={styles.btnSecondary}
                                style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '0.875rem' }}
                                onClick={() => setIsPersonModalOpen(true)}
                            >
                                👥 {trip.persons?.length || 0} {t('travelers_count')}
                            </button>
                            <select
                                className={styles.statusBadge}
                                style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', cursor: 'pointer' }}
                                value={trip.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            >
                                <option value="PLANNING">{t('planning_phase')}</option>
                                <option value="ACTIVE">{t('active_trip')}</option>
                                <option value="COMPLETED">{t('completed')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Financial Summary Snippets */}
                    <div className={styles.summaryGrid}>
                        <div className={`glass ${styles.summaryCard}`}>
                            <span className={styles.summaryTitle}>{t('goal_vs_saved')}</span>
                            <div>
                                <span className={`${styles.summaryValue} ${styles.primary}`}>{formatCurrency(trip.tripSummary.totalSaved)}</span>
                                <span style={{ opacity: 0.6, fontSize: '1.2rem' }}> / {formatCurrency(trip.tripSummary.totalBudgetGoal)}</span>
                            </div>
                        </div>
                        <div className={`glass ${styles.summaryCard}`}>
                            <span className={styles.summaryTitle}>{t('available_budget')}</span>
                            <span className={`${styles.summaryValue} ${styles.success}`}>{formatCurrency(trip.tripSummary.totalAvailable)}</span>
                        </div>
                        <div className={`glass ${styles.summaryCard}`}>
                            <span className={styles.summaryTitle}>{t('total_spent')}</span>
                            <span className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(trip.tripSummary.totalSpent)}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs System */}
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${activeTab === 'ROUTE' ? styles.active : ''}`} onClick={() => setActiveTab('ROUTE')}>{t('route_cities')}</button>
                    <button className={`${styles.tab} ${activeTab === 'PLANNING' ? styles.active : ''}`} onClick={() => setActiveTab('PLANNING')}>{t('budget_savings')}</button>
                    <button className={`${styles.tab} ${activeTab === 'ACTIVE' ? styles.active : ''}`} onClick={() => setActiveTab('ACTIVE')}>{t('expenses')}</button>
                    <button className={`${styles.tab} ${activeTab === 'ADVANCED' ? styles.active : ''}`} onClick={() => setActiveTab('ADVANCED')}>{t('funding_transfers')}</button>
                </div>

                {/* Tab Content: ROUTE */}
                {activeTab === 'ROUTE' && (
                    <div className={styles.routeLayout}>
                        {/* Left: City List */}
                        <div className={styles.cityList}>
                            <h2 style={{ marginBottom: '1rem' }}>{t('itinerary')}</h2>
                            {trip.cities.length === 0 ? (
                                <div className={`glass`} style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
                                    {t('no_cities')}
                                </div>
                            ) : (
                                trip.cities.map((tc, index) => (
                                    <div key={tc.id} className={`glass ${styles.cityCard}`}>
                                        <div className={styles.cityInfo}>
                                            <div className={styles.cityOrder}>{index + 1}</div>
                                            <div>
                                                <div className={styles.cityName}>{tc.city.name}</div>
                                                <div className={styles.cityCountry}>{tc.city.countryName}</div>
                                            </div>
                                        </div>
                                        <div className={styles.cityActions}>
                                            <button className={styles.btnDanger} onClick={() => handleRemoveCity(tc.id)}>{t('remove')}</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Right: Add City Search */}
                        <div className={styles.searchSection}>
                            <div className={`glass`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>{t('add_destination')}</h3>
                                <div className={styles.searchBox}>
                                    <input
                                        type="text"
                                        className="input-base"
                                        placeholder={t('search_city_placeholder')}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                    {isSearching && <div style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none', opacity: 0.6 }}>🔍</div>}

                                    {searchResults && searchResults.length > 0 && (
                                        <ul className={styles.dropdown} style={{ display: 'block', visibility: 'visible' }}>
                                            {searchResults.map((city: GeoNamesCity) => (
                                                <li key={`${city.geonameId}`} className={styles.dropdownItem} onClick={() => {
                                                    setSearchQuery(city.name);
                                                    setSearchResults([]);
                                                    handleAddCity(city);
                                                }}>
                                                    <div style={{ fontWeight: 600 }}>{city.name}</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{city.countryName}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dynamic Tab Contents */}
                {activeTab === 'PLANNING' && <PlanningTab tripId={tripId} initialCategories={(trip as any).categories || []} persons={trip.persons} onUpdate={fetchTrip} />}
                {activeTab === 'ACTIVE' && <ActiveTab tripId={tripId} categories={(trip as any).categories || []} onUpdate={fetchTrip} />}
                {activeTab === 'ADVANCED' && <AdvancedTab tripId={tripId} categories={(trip as any).categories || []} onUpdate={fetchTrip} />}

                {/* Travelers Management Modal */}
                {isPersonModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsPersonModalOpen(false)}>
                        <div className="modal-container" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">{t('manage_travelers')}</h2>
                                <button className="modal-close" onClick={() => setIsPersonModalOpen(false)}>&times;</button>
                            </div>

                            <div className="modal-content">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            className="input-base"
                                            placeholder={t('traveler_name')}
                                            value={personInput}
                                            onChange={e => setPersonInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    if (personInput.trim()) {
                                                        setTrip({ ...trip, persons: [...trip.persons, { id: Date.now().toString(), name: personInput.trim() }] });
                                                        setPersonInput('');
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '0 20px' }}
                                            onClick={() => {
                                                if (personInput.trim()) {
                                                    setTrip({ ...trip, persons: [...trip.persons, { id: Date.now().toString(), name: personInput.trim() }] });
                                                    setPersonInput('');
                                                }
                                            }}
                                        >{t('add')}</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {trip.persons.length === 0 ? (
                                            <p style={{ opacity: 0.5, textAlign: 'center' }}>{t('no_travelers')}</p>
                                        ) : (
                                            trip.persons.map((p, i) => (
                                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.03)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                                                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                                                    <button
                                                        style={{ background: 'transparent', color: 'var(--danger)', fontSize: '1.2rem', cursor: 'pointer' }}
                                                        onClick={() => setTrip({ ...trip, persons: trip.persons.filter((_, idx) => idx !== i) })}
                                                    >×</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setIsPersonModalOpen(false)}>{t('cancel')}</button>
                                <button className="btn-primary" onClick={handleUpdatePersons}>{t('save_changes')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
