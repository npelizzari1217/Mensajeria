import { DomainError } from '../../shared/errors/domain-error';

/**
 * Error when an empresa is not found by ID.
 */
export class EmpresaNotFoundError extends DomainError {
  readonly code = 'EMPRESA_NOT_FOUND';

  constructor(id: string) {
    super(`Empresa '${id}' not found`);
  }
}

/**
 * Error when attempting to create an empresa with an already-used name.
 */
export class EmpresaNameAlreadyExistsError extends DomainError {
  readonly code = 'EMPRESA_NAME_ALREADY_EXISTS';

  constructor(nombre: string) {
    super(`Empresa name '${nombre}' is already taken`);
  }
}

/**
 * Error when an operation is denied due to insufficient permissions.
 */
export class ForbiddenDomainError extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor(message = 'Access denied') {
    super(message);
  }
}
