import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient, { getErrorMessage } from '../api/client';

/**
 * RegisterPage — name + email + password form with client-side validation,
 * loading state, and backend error display. Redirects to /login on success.
 */
export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function validate(): boolean {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Formato de email invalido';
    }

    if (!password) {
      errors.password = 'La contrasena es requerida';
    } else if (password.length < 8) {
      errors.password = 'Debe tener al menos 8 caracteres';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmar la contrasena es requerido';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contrasenas no coinciden';
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
      await apiClient.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Mensajeria</h1>
        <p className="login-subtitle">Crear una cuenta nueva</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldErrors.name ? 'input-error' : ''}
              placeholder="Tu nombre"
              autoComplete="name"
            />
            {fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
          </div>

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
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contrasena</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldErrors.confirmPassword ? 'input-error' : ''}
              placeholder="Repeti la contrasena"
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="login-footer">
          ¿Ya tenes cuenta?{' '}
          <Link to="/login">Inicia sesion</Link>
        </p>
      </div>
    </div>
  );
}
