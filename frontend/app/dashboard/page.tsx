'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface Trip {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
}

export default function Dashboard() {
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTrip, setNewTrip] = useState({ name: '', destination: '', startDate: '', endDate: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Profile
                const profileRes = await fetch('http://localhost:3000/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setUser(profileData);
                } else {
                    router.push('/login');
                }

                // Fetch Trips
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const handleCreateTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:3000/api/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newTrip)
            });

            if (res.ok) {
                const createdTrip = await res.json();
                setTrips([...trips, createdTrip]);
                setIsModalOpen(false);
                setNewTrip({ name: '', destination: '', startDate: '', endDate: '' });
            }
        } catch (error) {
            console.error('Failed to create trip:', error);
        }
    };

    if (loading) return <div className={styles.container} style={{ alignItems: 'center' }}>Loading...</div>;

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo}>TravelBudget</div>
                <div className={styles.userMenu}>
                    <span>Hello, {user?.name.split(' ')[0]}</span>
                    <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
                </div>
            </nav>

            {/* Main Content */}
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
                                    <span>📍 {trip.destination}</span>
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
                                    id="name"
                                    type="text"
                                    className="input-base"
                                    placeholder="Eurotrip 2026"
                                    value={newTrip.name}
                                    onChange={e => setNewTrip({ ...newTrip, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label className="input-label" htmlFor="destination">Primary Destination</label>
                                <input
                                    id="destination"
                                    type="text"
                                    className="input-base"
                                    placeholder="Europe"
                                    value={newTrip.destination}
                                    onChange={e => setNewTrip({ ...newTrip, destination: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <label className="input-label" htmlFor="startDate">Start Date</label>
                                    <input
                                        id="startDate"
                                        type="date"
                                        className="input-base"
                                        value={newTrip.startDate}
                                        onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <label className="input-label" htmlFor="endDate">End Date</label>
                                    <input
                                        id="endDate"
                                        type="date"
                                        className="input-base"
                                        value={newTrip.endDate}
                                        onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
                                        required
                                    />
                                </div>
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
