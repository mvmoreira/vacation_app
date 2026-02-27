'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // In real app, persist token securely in cookies. Storing in localStorage for simple demo.
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
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Enter your details to access your trips</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
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
                        />
                    </div>

                    {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Don't have an account?{' '}
                    <Link href="/register" className={styles.link}>
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
}
