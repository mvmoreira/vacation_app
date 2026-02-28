'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    name: string;
    email: string;
}

interface TeamMember {
    id: string;
    role: string;
    user: User;
}

interface Team {
    id: string;
    name: string;
    inviteCode: string;
    members: TeamMember[];
}

export default function TeamSettings() {
    const router = useRouter();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Join team state
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            // Get current user profile first (contains activeTeamId)
            const profileRes = await fetch('http://localhost:3000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!profileRes.ok) throw new Error('Not authenticated');
            const profile = await profileRes.json();
            setCurrentUser(profile);

            // Fetch the active team details directly
            const teamRes = await fetch(`http://localhost:3000/api/teams/${profile.activeTeamId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (teamRes.ok) {
                setTeam(await teamRes.json());
            }
        } catch (error) {
            console.error(error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [router]);

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError('');
        setIsJoining(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:3000/api/teams/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ inviteCode: joinCode })
            });

            if (res.ok) {
                // Force token refresh or switch by re-logging in or we can just fetch data
                // For simplicity in this demo, let's just alert and re-fetch (backend switch logic handles setting active schema)
                alert('Successfully joined team! You will now see their data.');
                setJoinCode('');
                fetchData();
            } else {
                const errorData = await res.json();
                setJoinError(errorData.message || 'Invalid invite code.');
            }
        } catch (error) {
            setJoinError('Failed to join team.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        const token = localStorage.getItem('token');
        try {
            await fetch(`http://localhost:3000/api/teams/${team?.id}/members/${memberId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Failed to remove', error);
        }
    };

    const copyInviteCode = () => {
        if (team?.inviteCode) {
            navigator.clipboard.writeText(team.inviteCode);
            alert('Invite code copied to clipboard!');
        }
    };

    if (loading) return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading team settings...</div>;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <nav style={{ padding: '1rem 2rem', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    TravelBudget
                </div>
                <Link href="/dashboard" style={{ fontWeight: 600, opacity: 0.8 }}>← Back to Dashboard</Link>
            </nav>

            <main style={{ flex: 1, padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Team Settings</h1>
                    <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>Manage your workspace ({team?.name}) and trip collaborators.</p>
                </div>

                {/* Invite Code Section */}
                <section className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Invite Collaborators</h2>
                        <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Share this code with your friends/family so they can join your trips and add expenses.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--primary)', borderRadius: '8px', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '2px', textAlign: 'center', fontFamily: 'monospace' }}>
                            {team?.inviteCode}
                        </div>
                        <button className="btn-primary" onClick={copyInviteCode}>Copy Code</button>
                    </div>
                </section>

                {/* Join Other Team Section */}
                <section className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--secondary)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Join a Team</h2>
                        <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Received an invite code? Enter it below to join another workspace.</p>
                    </div>

                    <form onSubmit={handleJoinTeam} style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="input-base"
                                placeholder="Paste code here..."
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                required
                            />
                            {joinError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{joinError}</p>}
                        </div>
                        <button type="submit" className="btn-primary" style={{ background: 'var(--secondary)', boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)' }} disabled={isJoining || !joinCode}>
                            {isJoining ? 'Joining...' : 'Join Team'}
                        </button>
                    </form>
                </section>

                {/* Team Members List */}
                <section className="glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Members ({team?.members?.length || 0})</h2>
                        <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>People who have access to your planned trips.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {team?.members.map(member => (
                            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                        {member.user.name} {currentUser?.id === member.user.id ? '(You)' : ''}
                                    </span>
                                    <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>{member.user.email}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ padding: '4px 12px', background: member.role === 'owner' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: member.role === 'owner' ? 'var(--secondary)' : 'var(--primary)', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                                        {member.role}
                                    </span>

                                    {/* Only allow removing if current user is owner and not removing themselves */}
                                    {team.members.find(m => m.user.id === currentUser?.id)?.role === 'owner' && member.role !== 'owner' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            style={{ background: 'transparent', color: 'var(--danger)', fontWeight: 600, padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
}
