'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { useLanguage } from '../../context/LanguageContext';
import globalStyles from '../trips/[id]/page.module.css'; // For common styles if needed

interface Trip {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    currency: string;
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
    cities: { city: { name: string; countryName: string } }[];
}

interface GeoNamesCity {
    geonameId: number;
    name: string;
    countryName: string;
}

export default function Dashboard() {
    const { t, language, setLanguage } = useLanguage();
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTrip, setNewTrip] = useState<{
        name: string;
        startDate: string;
        endDate: string;
        currency: string;
        selectedCity: GeoNamesCity | null;
        persons: string[];
    }>({ name: '', startDate: '', endDate: '', currency: 'USD', selectedCity: null, persons: [] });
    const [personInput, setPersonInput] = useState('');

    // Autocomplete state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<GeoNamesCity[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const profileRes = await fetch('http://localhost:3000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUser(profileData);
                } else {
                    router.push('/login');
                }

                const tripsRes = await fetch('http://localhost:3000/api/trips', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (tripsRes.ok) {
                    const tripsData = await tripsRes.json();
                    setTrips(tripsData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Debounced City Search
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
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
                    console.error('City search failed', await res.text());
                }
            } catch (error) {
                console.error('City search exception', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        try {
            // 1. Create the Trip
            const res = await fetch('http://localhost:3000/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newTrip.name,
                    startDate: newTrip.startDate,
                    endDate: newTrip.endDate,
                    currency: newTrip.currency,
                    persons: newTrip.persons
                })
            });

            if (res.ok) {
                const createdTrip = await res.json();
                let initialCities: any[] = [];

                if (newTrip.selectedCity) {
                    // 2. Add the selected city to the trip immediately if one was chosen
                    await fetch(`http://localhost:3000/api/cities/trips/${createdTrip.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            geonameId: newTrip.selectedCity.geonameId,
                            order: 1,
                        })
                    });
                    initialCities = [{ city: { name: newTrip.selectedCity.name, countryName: newTrip.selectedCity.countryName } }];
                }

                // Add to local state
                setTrips([{ ...createdTrip, cities: initialCities }, ...trips]);
                setIsModalOpen(false);
                setNewTrip({ name: '', startDate: '', endDate: '', currency: 'USD', selectedCity: null, persons: [] });
                setSearchQuery('');
                setPersonInput('');
            } else {
                const err = await res.json();
                alert(err.message || 'Error creating trip');
            }
        } catch (error) {
            console.error('Failed to create trip:', error);
        }
    };

    const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
        e.preventDefault(); // Prevent navigation to trip details
        e.stopPropagation();

        if (!confirm(t('delete_confirm_msg') || 'Are you sure you want to delete this trip? All related data will be permanently removed.')) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setTrips(trips.filter(t => t.id !== tripId));
            } else {
                alert('Failed to delete trip');
            }
        } catch (error) {
            console.error('Error deleting trip:', error);
        }
    };

    if (loading) return <div className={styles.container} style={{ alignItems: 'center' }}>{t('loading') || 'Loading...'}</div>;

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <div className={styles.logo}>TravelBudget</div>
                <div className={styles.navLinks}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                        <button onClick={() => setLanguage('pt')} style={{ opacity: language === 'pt' ? 1 : 0.4, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>PT</button>
                        <button onClick={() => setLanguage('en')} style={{ opacity: language === 'en' ? 1 : 0.4, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>EN</button>
                        <button onClick={() => setLanguage('es')} style={{ opacity: language === 'es' ? 1 : 0.4, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>ES</button>
                    </div>
                </div>
                <div className={styles.userMenu}>
                    <Link href="/teams/settings" style={{ fontWeight: 600, opacity: 0.8, marginRight: '1rem', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
                        ⚙️ {t('team_settings')}
                    </Link>
                    <span>{t('hello') || 'Hello'}, {user?.name.split(' ')[0]}</span>
                    <button onClick={handleLogout} className={styles.logoutBtn}>{t('logout')}</button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>{t('my_trips')}</h1>
                    <button className="btn-action btn-pulse" onClick={() => setIsModalOpen(true)}>
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>+</span> {t('create_trip')}
                    </button>
                </div>

                <div className={styles.grid}>
                    {trips.length > 0 ? (
                        trips.map(trip => (
                            <Link href={`/trips/${trip.id}`} key={trip.id} className={`glass ${styles.tripCard}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 className={styles.tripTitle}>{trip.name}</h3>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => handleDeleteTrip(e, trip.id)}
                                        title={t('delete_trip')}
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div className={styles.tripMeta}>
                                    <span>📍 {trip.cities?.length > 0 ? trip.cities[0].city.name : t('no_cities_yet')}</span>
                                    <span className={`${styles.tripStatus} ${styles[`status${trip.status.charAt(0) + trip.status.slice(1).toLowerCase()}`]}`}>
                                        {t(trip.status.toLowerCase()) || trip.status}
                                    </span>
                                </div>
                                <div className={styles.tripMeta}>
                                    <span>🗓 {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <h3>{t('no_trips_yet')}</h3>
                            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>{t('start_planning')}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Trip Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-container" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{t('plan_new_trip')}</h2>
                            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <div className="modal-content">
                            <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label className="input-label" htmlFor="name">{t('trip_name')}</label>
                                    <input
                                        id="name" type="text" className="input-base"
                                        placeholder={t('trip_name_placeholder')}
                                        value={newTrip.name}
                                        onChange={e => setNewTrip({ ...newTrip, name: e.target.value })}
                                        required
                                    />
                                </div>

                                {/* City Autocomplete */}
                                <div style={{ position: 'relative' }}>
                                    <label className="input-label" htmlFor="destination">{t('primary_destination')}</label>
                                    <div className={styles.searchBox || ''}>
                                        <input
                                            id="destination" type="text" className="input-base"
                                            placeholder={t('primary_dest_placeholder')}
                                            value={searchQuery}
                                            onChange={e => {
                                                setSearchQuery(e.target.value);
                                                setNewTrip({ ...newTrip, selectedCity: null });
                                            }}
                                            autoComplete="off"
                                        />
                                        {isSearching && <div style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none', opacity: 0.6 }}>🔍</div>}

                                        {/* Dropdown Results */}
                                        {searchResults && searchResults.length > 0 && (
                                            <ul className={styles.dropdown} style={{ display: 'block', visibility: 'visible' }}>
                                                {searchResults.map((city: GeoNamesCity) => (
                                                    <li key={`${city.geonameId}`}
                                                        className={styles.dropdownItem}
                                                        onClick={() => {
                                                            setNewTrip({ ...newTrip, selectedCity: city });
                                                            setSearchQuery(city.name);
                                                            setSearchResults([]);
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600 }}>{city.name}</div>
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{city.countryName}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label" htmlFor="startDate">{t('start_date')}</label>
                                        <input id="startDate" type="date" className="input-base"
                                            value={newTrip.startDate} onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })} required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label" htmlFor="endDate">{t('end_date')}</label>
                                        <input id="endDate" type="date" className="input-base"
                                            value={newTrip.endDate} onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })} required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="input-label" htmlFor="currency">{t('currency')}</label>
                                    <select id="currency" className="input-base" value={newTrip.currency} onChange={e => setNewTrip({ ...newTrip, currency: e.target.value })} required style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="BRL">BRL (R$)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="input-label">{t('travelers_count')} ({t('optional') || 'Optional'})</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <input
                                            type="text"
                                            className="input-base"
                                            placeholder={t('traveler_name')}
                                            value={personInput}
                                            onChange={e => setPersonInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (personInput.trim()) {
                                                        setNewTrip({ ...newTrip, persons: [...newTrip.persons, personInput.trim()] });
                                                        setPersonInput('');
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            style={{ padding: '0 20px' }}
                                            onClick={() => {
                                                if (personInput.trim()) {
                                                    setNewTrip({ ...newTrip, persons: [...newTrip.persons, personInput.trim()] });
                                                    setPersonInput('');
                                                }
                                            }}
                                        >+</button>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {newTrip.persons.map((p, i) => (
                                            <div key={i} style={{ background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#000000' }}>
                                                <span>{p}</span>
                                                <button
                                                    type="button"
                                                    style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--danger)', background: 'transparent' }}
                                                    onClick={() => setNewTrip({ ...newTrip, persons: newTrip.persons.filter((_, idx) => idx !== i) })}
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ padding: '1.5rem 0 0' }}>
                                    <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                                    <button type="submit" className="btn-primary">{t('create_trip')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
