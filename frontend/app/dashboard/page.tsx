'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

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
    }>({ name: '', startDate: '', endDate: '', currency: 'USD', selectedCity: null });

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
                setNewTrip({ name: '', startDate: '', endDate: '', currency: 'USD', selectedCity: null });
                setSearchQuery('');
            } else {
                const err = await res.json();
                alert(err.message || 'Error creating trip');
            }
        } catch (error) {
            console.error('Failed to create trip:', error);
        }
    };

    if (loading) return <div className={styles.container} style={{ alignItems: 'center' }}>Loading...</div>;

    return (
        <div className={styles.container}>
            <nav className={styles.navbar}>
                <div className={styles.logo}>TravelBudget</div>
                <div className={styles.userMenu}>
                    <Link href="/teams/settings" style={{ fontWeight: 600, opacity: 0.8, marginRight: '1rem', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}>
                        ⚙️ Team Settings
                    </Link>
                    <span>Hello, {user?.name.split(' ')[0]}</span>
                    <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Your Trips</h1>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        + New Trip
                    </button>
                </div>

                <div className={styles.grid}>
                    {trips.length > 0 ? (
                        trips.map(trip => (
                            <Link href={`/trips/${trip.id}`} key={trip.id} className={`glass ${styles.tripCard}`}>
                                <h3 className={styles.tripTitle}>{trip.name}</h3>
                                <div className={styles.tripMeta}>
                                    <span>📍 {trip.cities?.length > 0 ? trip.cities[0].city.name : 'No cities yet'}</span>
                                    <span className={`${styles.tripStatus} ${styles[`status${trip.status.charAt(0) + trip.status.slice(1).toLowerCase()}`]}`}>
                                        {trip.status}
                                    </span>
                                </div>
                                <div className={styles.tripMeta}>
                                    <span>🗓 {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            <h3>No trips yet!</h3>
                            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Start planning your next adventure.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Trip Modal */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`glass ${styles.modal}`}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Plan a New Trip</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateTrip} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="input-label" htmlFor="name">Trip Name</label>
                                <input
                                    id="name" type="text" className="input-base"
                                    placeholder="Eurotrip 2026"
                                    value={newTrip.name}
                                    onChange={e => setNewTrip({ ...newTrip, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* City Autocomplete */}
                            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <label className="input-label" htmlFor="destination">Primary Destination</label>
                                <input
                                    id="destination" type="text" className="input-base"
                                    placeholder="Type city name (e.g. Orland)..."
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
                                    <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', marginTop: '4px', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 100, backdropFilter: 'blur(12px)', display: 'block', visibility: 'visible' }}>
                                        {searchResults.map((city: GeoNamesCity) => (
                                            <li key={`${city.geonameId}`}
                                                onClick={() => {
                                                    setNewTrip({ ...newTrip, selectedCity: city });
                                                    setSearchQuery(city.name);
                                                    setSearchResults([]);
                                                }}
                                                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ fontWeight: 600 }}>{city.name}</div>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{city.countryName}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <label className="input-label" htmlFor="startDate">Start Date</label>
                                    <input id="startDate" type="date" className="input-base"
                                        value={newTrip.startDate} onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })} required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <label className="input-label" htmlFor="endDate">End Date</label>
                                    <input id="endDate" type="date" className="input-base"
                                        value={newTrip.endDate} onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })} required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="input-label" htmlFor="currency">Currency</label>
                                <select id="currency" className="input-base" value={newTrip.currency} onChange={e => setNewTrip({ ...newTrip, currency: e.target.value })} required style={{ appearance: 'none' }}>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="BRL">BRL (R$)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Create Trip</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
