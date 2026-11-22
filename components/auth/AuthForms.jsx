'use client';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertIcon, Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Grid, IconButton, Input, Text, VStack, Center, Spinner } from '@chakra-ui/react';
import Icon from '@/components/ui/Icon';
import AuthShell, { safeNext } from './AuthShell';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { isEmail, isValidPhone, normalizePhone } from '@/lib/format';
import { useNotify } from '@/lib/hooks';

function PasswordInput({ value, onChange, autoComplete, id }) {
  const [show, setShow] = useState(false);
  return (
    <Box position="relative">
      <Input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} sx={{ paddingInlineEnd: '52px !important' }} />
      <Box position="absolute" right="6px" top="0" bottom="0" display="flex" alignItems="center">
        <IconButton aria-label={show ? 'Hide password' : 'Show password'} icon={<Icon name={show ? 'eyeoff' : 'eye'} size={19} />} size="sm" variant="ghost" borderRadius="full" onClick={() => setShow((x) => !x)} />
      </Box>
    </Box>
  );
}

const pwdProblem = (p) => (p.length < 8 ? 'Use at least 8 characters.' : !/[A-Z]/.test(p) ? 'Add at least one capital letter.' : !/[0-9]/.test(p) ? 'Add at least one number.' : '');

export function LoginView() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!isEmail(f.email) || !f.password) return setErr('Enter your email and password.');
    setBusy(true);
    try { await login(f.email, f.password); router.replace(next); } catch (e2) { setErr(e2.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : e2.message); setBusy(false); }
  };
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your orders and saved addresses.">
      <VStack as="form" onSubmit={submit} align="stretch" spacing={4} noValidate>
        <FormControl><FormLabel>Email</FormLabel><Input type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></FormControl>
        <FormControl><FormLabel>Password</FormLabel><PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
          <FormHelperText><Text as={NextLink} href="/forgot-password" color="pine.600" fontWeight={700}>Forgot password?</Text></FormHelperText></FormControl>
        {err && <Alert status="error" borderRadius="xl" role="alert"><AlertIcon />{err}</Alert>}
        <Button type="submit" variant="buy" size="lg" isLoading={busy}>Sign in</Button>
        <Text textAlign="center" color="ink.600">New here? <Text as={NextLink} href={`/register?next=${encodeURIComponent(next)}`} color="pine.600" fontWeight={800}>Create an account</Text></Text>
      </VStack>
    </AuthShell>
  );
}

export function RegisterView() {
  const { register, login } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const next = safeNext(sp.get('next'));
  const notify = useNotify();
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', referral_code: '' });
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const r = sp.get('ref'); if (r) setF((s) => ({ ...s, referral_code: r })); }, [sp]);
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: '' })); };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const v = {};
    if (!f.first_name.trim()) v.first_name = 'Required';
    if (!f.last_name.trim()) v.last_name = 'Required';
    if (!isEmail(f.email)) v.email = 'Enter a valid email.';
    if (!isValidPhone(f.phone)) v.phone = 'Enter a valid phone number.';
    if (pwdProblem(f.password)) v.password = pwdProblem(f.password);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await register({ first_name: f.first_name.trim(), last_name: f.last_name.trim(), email: f.email.trim().toLowerCase(), phone: normalizePhone(f.phone), password: f.password, referral_code: f.referral_code.trim() || null });
      notify.success('Account created', 'Check your email to verify your address.');
      try { await login(f.email, f.password); router.replace(next); } catch { router.replace(`/login?next=${encodeURIComponent(next)}`); }
    } catch (e2) {
      setErrors((x) => ({ ...x, ...(e2.fieldErrors || {}) }));
      setErr(e2.status === 409 ? 'An account with this email already exists. Try signing in.' : e2.message);
      setBusy(false);
    }
  };
  const F = ({ k, label, ...r }) => <FormControl isInvalid={!!errors[k]}><FormLabel>{label}</FormLabel><Input value={f[k]} onChange={set(k)} {...r} /><FormErrorMessage>{errors[k]}</FormErrorMessage></FormControl>;
  return (
    <AuthShell title="Create your account" subtitle="It takes a minute — and makes reordering effortless.">
      <VStack as="form" onSubmit={submit} align="stretch" spacing={4} noValidate>
        <Grid templateColumns="1fr 1fr" gap={3}>{F({ k: 'first_name', label: 'First name', autoComplete: 'given-name' })}{F({ k: 'last_name', label: 'Last name', autoComplete: 'family-name' })}</Grid>
        {F({ k: 'email', label: 'Email', type: 'email', inputMode: 'email', autoComplete: 'email' })}
        {F({ k: 'phone', label: 'Phone number', type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '0803 123 4567' })}
        <FormControl isInvalid={!!errors.password}><FormLabel>Password</FormLabel><PasswordInput value={f.password} onChange={set('password')} autoComplete="new-password" />
          {errors.password ? <FormErrorMessage>{errors.password}</FormErrorMessage> : <FormHelperText>8+ characters with a capital letter and a number.</FormHelperText>}</FormControl>
        {F({ k: 'referral_code', label: 'Referral code (optional)', autoCapitalize: 'characters' })}
        {err && <Alert status="error" borderRadius="xl" role="alert"><AlertIcon />{err}</Alert>}
        <Button type="submit" variant="buy" size="lg" isLoading={busy}>Create account</Button>
        <Text textAlign="center" color="ink.600">Already registered? <Text as={NextLink} href={`/login?next=${encodeURIComponent(next)}`} color="pine.600" fontWeight={800}>Sign in</Text></Text>
      </VStack>
    </AuthShell>
  );
}

export function ForgotView() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!isEmail(email)) return setErr('Enter the email you registered with.');
    setBusy(true);
    try { await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() }, { auth: false }); setSent(true); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a link to choose a new one.">
      {sent ? <Alert status="success" borderRadius="xl" alignItems="start"><AlertIcon mt={1} />If that email is registered, a reset link is on its way. Check your inbox and spam folder.</Alert> : (
        <VStack as="form" onSubmit={submit} align="stretch" spacing={4} noValidate>
          <FormControl><FormLabel>Email</FormLabel><Input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></FormControl>
          {err && <Alert status="error" borderRadius="xl" role="alert"><AlertIcon />{err}</Alert>}
          <Button type="submit" variant="buy" size="lg" isLoading={busy}>Send reset link</Button>
        </VStack>
      )}
      <Text textAlign="center"><Text as={NextLink} href="/login" color="pine.600" fontWeight={800}>Back to sign in</Text></Text>
    </AuthShell>
  );
}

export function ResetView() {
  const token = useSearchParams().get('token') || '';
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const p = pwdProblem(pwd); if (p) return setErr(p);
    setBusy(true);
    try { await api.post('/auth/reset-password', { token, new_password: pwd }, { auth: false }); setOk(true); } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Choose a new password">
      {!token ? <Alert status="error" borderRadius="xl"><AlertIcon />This reset link is incomplete. Request a new one.</Alert>
        : ok ? <Alert status="success" borderRadius="xl"><AlertIcon />Password updated. You can sign in now.</Alert> : (
        <VStack as="form" onSubmit={submit} align="stretch" spacing={4} noValidate>
          <FormControl><FormLabel>New password</FormLabel><PasswordInput value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" /><FormHelperText>8+ characters with a capital letter and a number.</FormHelperText></FormControl>
          {err && <Alert status="error" borderRadius="xl" role="alert"><AlertIcon />{err}</Alert>}
          <Button type="submit" variant="buy" size="lg" isLoading={busy}>Update password</Button>
        </VStack>
      )}
      <Button as={NextLink} href={ok ? '/login' : '/forgot-password'} variant="outline">{ok ? 'Go to sign in' : 'Request a new link'}</Button>
    </AuthShell>
  );
}

export function VerifyEmailView() {
  const token = useSearchParams().get('token') || '';
  const { reload, isAuthed } = useAuth();
  const [s, setS] = useState({ phase: token ? 'loading' : 'error', msg: token ? '' : 'This verification link is incomplete.' });
  const started = useRef(false);
  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api.post('/auth/verify-email', { token }, { auth: false, guest: false })
      .then(() => { setS({ phase: 'ok', msg: '' }); if (isAuthed) reload(); })
      .catch((e) => setS({ phase: 'error', msg: e.message }));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AuthShell title="Email verification">
      {s.phase === 'loading' && <Center py={6}><Spinner color="pine.500" size="lg" /></Center>}
      {s.phase === 'ok' && <Alert status="success" borderRadius="xl"><AlertIcon />Your email is verified. Thank you!</Alert>}
      {s.phase === 'error' && <Alert status="error" borderRadius="xl"><AlertIcon />{s.msg || 'This link is invalid or has expired.'}</Alert>}
      <Button as={NextLink} href="/shop" variant="buy">Continue shopping</Button>
    </AuthShell>
  );
}
