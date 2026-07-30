'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ink)', padding: '24px' }}>
      <div style={{ background: 'var(--paper)', color: 'var(--text)', borderRadius: 12, padding: '40px 36px', maxWidth: 400, width: '100%', boxShadow: '0 22px 48px rgba(0,0,0,0.38)' }}>
        <div className="eyebrow" style={{ color: 'var(--gold-ink)', marginBottom: 8 }}>Painel Fiscal · Simples Nacional</div>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 600, margin: '0 0 6px', color: 'var(--text)' }}>
          Acesse sua conta
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
          Enviaremos um link de acesso para o seu e-mail. Sem senha necessária.
        </p>

        {sent ? (
          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 8, padding: '16px 18px', color: 'var(--green)', fontSize: 14, lineHeight: 1.5 }}>
            <strong>Verifique seu e-mail!</strong><br />
            Enviamos o link de acesso para <strong>{email}</strong>. Clique no link para entrar.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{ fontFamily: 'Inter', fontSize: 14, padding: '10px 12px', border: '1px solid var(--paper-edge)', borderRadius: 6, background: '#fff', color: 'var(--text)' }}
              />
            </div>
            {error && <p style={{ color: 'var(--rust)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{ width: '100%', marginTop: 0 }}
            >
              {loading ? 'Enviando…' : 'Enviar link de acesso'}
            </button>
          </form>
        )}

        <p className="disclaimer" style={{ marginTop: 24 }}>
          Ferramenta de apoio e estimativa. Não é um envio oficial à Receita Federal.
        </p>
      </div>
    </div>
  );
}
