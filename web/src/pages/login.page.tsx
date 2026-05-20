import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { getErrorMessage } from '../api/client';

/**
 * LoginPage — email + password form with client-side validation,
 * loading state, and backend error display.
 */
export default function LoginPage() {
  const { login, selectEmpresa, pendingEmpresaSelection, empresas, error: authError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmpresaSelector, setShowEmpresaSelector] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Formato de email invalido';
    }

    if (!password) {
      errors.password = 'La contrasena es requerida';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const empresasData = await login(email.trim(), password);
      if (empresasData.length > 1) {
        setShowEmpresaSelector(true);
      } else {
        navigate('/inbox', { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectEmpresa(empresaId: string) {
    setLoading(true);
    setError(null);
    try {
      await selectEmpresa(empresaId);
      navigate('/inbox', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (showEmpresaSelector) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Seleccionar Empresa</h1>
          <p className="login-subtitle">Elegi la empresa para continuar</p>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="empresa-list">
            {empresas.map((emp) => (
              <button
                key={emp.id}
                className="btn btn-secondary btn-block empresa-btn"
                onClick={() => handleSelectEmpresa(emp.id)}
                disabled={loading}
              >
                <span className="empresa-nombre">{emp.nombre}</span>
                <span className="empresa-role">{emp.role}</span>
              </button>
            ))}
          </div>
          <p className="login-footer">
            <button className="btn-link" onClick={() => { setShowEmpresaSelector(false); setError(null); }}>
              Volver al login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Mensajeria</h1>
        <p className="login-subtitle">Inicia sesion para continuar</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldErrors.email ? 'input-error' : ''}
              placeholder="usuario@ejemplo.com"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldErrors.password ? 'input-error' : ''}
              placeholder="Tu contrasena"
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="login-footer">
          ¿No tenes cuenta?{' '}
          <Link to="/register">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
