import { describe, it, expect } from 'vitest';
import { Empresa } from '../auth/entities/empresa';
import { EmpresaId } from '../shared/value-objects/empresa-id';
import { Timestamp } from '../shared/value-objects/timestamp';

describe('Empresa', () => {
  describe('create()', () => {
    it('creates empresa with valid nombre', () => {
      const result = Empresa.create('Mi Empresa');
      expect(result.isOk()).toBe(true);
      const empresa = result.unwrap();
      expect(empresa.getNombre()).toBe('Mi Empresa');
      expect(empresa.getId()).toBeDefined();
      expect(empresa.getCreatedAt()).toBeDefined();
      expect(empresa.getUpdatedAt()).toBeDefined();
    });

    it('trims whitespace on nombre', () => {
      const empresa = Empresa.create('  Mi Empresa  ').unwrap();
      expect(empresa.getNombre()).toBe('Mi Empresa');
    });

    it('fails with empty string', () => {
      const result = Empresa.create('');
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('cannot be empty');
    });

    it('fails with whitespace-only string', () => {
      const result = Empresa.create('   ');
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('cannot be empty');
    });

    it('fails with nombre longer than 100 chars', () => {
      const result = Empresa.create('A'.repeat(101));
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('100 characters');
    });

    it('accepts nombre of exactly 100 chars', () => {
      const nombre = 'A'.repeat(100);
      const result = Empresa.create(nombre);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().getNombre()).toBe(nombre);
    });
  });

  describe('rename()', () => {
    it('updates nombre and updatedAt', async () => {
      const empresa = Empresa.create('Original').unwrap();
      const oldUpdatedAt = empresa.getUpdatedAt();

      // Ensure timestamp changes between create and rename
      await new Promise((resolve) => setTimeout(resolve, 1));

      const result = empresa.rename('Nuevo Nombre');
      expect(result.isOk()).toBe(true);
      expect(empresa.getNombre()).toBe('Nuevo Nombre');
      expect(empresa.getUpdatedAt().isAfter(oldUpdatedAt)).toBe(true);
    });

    it('trims whitespace on rename', () => {
      const empresa = Empresa.create('Original').unwrap();
      const result = empresa.rename('  Trimmed  ');
      expect(result.isOk()).toBe(true);
      expect(empresa.getNombre()).toBe('Trimmed');
    });

    it('fails with empty string and does not mutate the empresa', () => {
      const empresa = Empresa.create('Original').unwrap();
      const result = empresa.rename('');
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('cannot be empty');
      expect(empresa.getNombre()).toBe('Original');
    });

    it('fails with nombre longer than 100 chars and does not mutate the empresa', () => {
      const empresa = Empresa.create('Original').unwrap();
      const result = empresa.rename('A'.repeat(101));
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('100 characters');
      expect(empresa.getNombre()).toBe('Original');
    });
  });

  describe('reconstruct()', () => {
    it('reconstructs an empresa from persistence data', () => {
      const empresa = Empresa.reconstruct({
        id: EmpresaId.reconstruct('550e8400-e29b-41d4-a716-446655440001'),
        nombre: 'Reconstructed',
        createdAt: Timestamp.reconstruct('2025-01-01T00:00:00.000Z'),
        updatedAt: Timestamp.reconstruct('2025-01-01T00:00:00.000Z'),
      });

      expect(empresa.getNombre()).toBe('Reconstructed');
      expect(empresa.getId().get()).toBe('550e8400-e29b-41d4-a716-446655440001');
    });
  });
});
