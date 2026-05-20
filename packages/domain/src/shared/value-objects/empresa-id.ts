import { Result, ok, err } from '../result';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class EmpresaId {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static create(raw: string): Result<EmpresaId, Error> {
    if (!raw || raw.trim().length === 0) {
      return err(new Error('EmpresaId cannot be empty'));
    }
    if (!UUID_REGEX.test(raw.trim())) {
      return err(new Error(`Invalid EmpresaId format: '${raw}' is not a valid UUID`));
    }
    return ok(new EmpresaId(raw.trim()));
  }

  static reconstruct(raw: string): EmpresaId {
    return new EmpresaId(raw);
  }

  get(): string {
    return this.value;
  }

  equals(other: EmpresaId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
