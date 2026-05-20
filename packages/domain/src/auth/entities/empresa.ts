import { EmpresaId } from '../../shared/value-objects/empresa-id';
import { Timestamp } from '../../shared/value-objects/timestamp';
import { Result, ok, err } from '../../shared/result';

export interface EmpresaProps {
  id: EmpresaId;
  nombre: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Empresa {
  private constructor(
    private readonly id: EmpresaId,
    private nombre: string,
    private readonly createdAt: Timestamp,
    private updatedAt: Timestamp,
  ) {}

  static create(nombre: string): Result<Empresa, Error> {
    if (!nombre || nombre.trim().length === 0) {
      return err(new Error('Empresa name cannot be empty'));
    }
    if (nombre.length > 100) {
      return err(new Error('Empresa name must be 100 characters or less'));
    }

    const id = EmpresaId.reconstruct(crypto.randomUUID());
    const now = Timestamp.now();

    return ok(new Empresa(id, nombre.trim(), now, now));
  }

  static reconstruct(props: EmpresaProps): Empresa {
    return new Empresa(props.id, props.nombre, props.createdAt, props.updatedAt);
  }

  getId(): EmpresaId {
    return this.id;
  }

  getNombre(): string {
    return this.nombre;
  }

  getCreatedAt(): Timestamp {
    return this.createdAt;
  }

  getUpdatedAt(): Timestamp {
    return this.updatedAt;
  }

  rename(nombre: string): Result<void, Error> {
    if (!nombre || nombre.trim().length === 0) {
      return err(new Error('Empresa name cannot be empty'));
    }
    if (nombre.length > 100) {
      return err(new Error('Empresa name must be 100 characters or less'));
    }

    this.nombre = nombre.trim();
    this.updatedAt = Timestamp.now();

    return ok(undefined);
  }

  equals(other: Empresa): boolean {
    return this.id.equals(other.id);
  }
}
