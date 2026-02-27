import { redirect } from 'next/navigation';

export default function Home() {
  // Simple redirect to login for now. 
  // In a real app we would check a token in cookies and redirect to dashboard if authenticated.
  redirect('/login');
}
