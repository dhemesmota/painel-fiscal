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
    <div className="auth-shell">
      <div className="auth-card">
        <div className="eyebrow">Painel Fiscal · Simples Nacional</div>
        <h1>Acesse sua conta</h1>
        <p>Enviaremos um link de acesso para o seu e-mail. Sem senha necessária.</p>

        {sent ? (
          <div className="auth-success" role="status">
            <strong>Verifique seu e-mail!</strong><br />
            Enviamos o link de acesso para <strong>{email}</strong>. Clique no link para entrar.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
            {error && <p className="warn" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn" style={{ width: '100%', marginTop: 0 }}>
              {loading ? 'Enviando…' : 'Enviar link de acesso'}
            </button>
          </form>
        )}

        <p className="disclaimer" style={{ marginTop: 24, padding: 0, maxWidth: 'none' }}>
          Ferramenta de apoio e estimativa. Não é um envio oficial à Receita Federal.
        </p>
      </div>
    </div>
  );
}
