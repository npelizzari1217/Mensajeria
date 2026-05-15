/**
 * RegisterScreen — Fase 6, T6.2
 *
 * Form: nombre + email + contraseña
 * Acción: useAuth().register(name, email, password)
 * Estados: loading, validación de campos, error de backend
 * Navegación: link a Login
 *
 * En éxito, register() guarda tokens y setea user → RootNavigator
 * cambia automáticamente a AppTabs (mismo flujo que login).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../auth/auth.context';
import { getErrorMessage } from '../../api/client';
import type { AuthStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/ScreenContainer';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const { register } = useAuth();
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  function validate(): boolean {
    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (!email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Formato de email inválido';
    }

    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      errors.password = 'Debe tener al menos 8 caracteres';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      await register(name.trim(), email.trim(), password);
      // RootNavigator redirige automáticamente a AppTabs
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Mensajería</Text>
        <Text style={styles.subtitle}>Crear una cuenta nueva</Text>

        {/* Error de backend */}
        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {/* Nombre */}
        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, fieldErrors.name ? styles.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            autoComplete="name"
            autoCapitalize="words"
            editable={!loading}
          />
          {fieldErrors.name ? (
            <Text style={styles.fieldError}>{fieldErrors.name}</Text>
          ) : null}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, fieldErrors.email ? styles.inputError : null]}
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!loading}
          />
          {fieldErrors.email ? (
            <Text style={styles.fieldError}>{fieldErrors.email}</Text>
          ) : null}
        </View>

        {/* Contraseña */}
        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, fieldErrors.password ? styles.inputError : null]}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            autoComplete="new-password"
            editable={!loading}
          />
          {fieldErrors.password ? (
            <Text style={styles.fieldError}>{fieldErrors.password}</Text>
          ) : null}
        </View>

        {/* Botón principal */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.btnText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        {/* Link a Login */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Iniciá sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  alert: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  btn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  link: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});
