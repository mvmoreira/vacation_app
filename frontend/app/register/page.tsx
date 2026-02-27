'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/page.module.css'; // Reusing auth styles

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            localStorage.setItem('token', data.accessToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={styles.container}>
            <div className={`glass ${styles.authCard}`}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Start planning your next adventure</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className="input-label" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            className="input-base"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input-base"
                            placeholder="hello@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className="input-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input-base"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Already have an account?{' '}
                    <Link href="/login" className={styles.link}>
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
