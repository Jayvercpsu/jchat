import AuthForm from '@/components/AuthForm';

export const metadata = {
  title: 'Sign Up - JChat',
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}