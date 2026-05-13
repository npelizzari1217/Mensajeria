import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {
  IFileStorage,
  FileId,
  StorageError,
} from '@mensajeria/domain';

/**
 * LocalFileStorage — disk-based implementation of IFileStorage.
 *
 * Stores files on the local filesystem under a configurable base path.
 * Directory structure: {basePath}/{fileId}/
 * File at:             {basePath}/{fileId}/{original-filename}
 *
 * The filename provided by the user is sanitised to prevent path traversal.
 */
export class LocalFileStorage implements IFileStorage {
  constructor(
    private readonly basePath: string = './uploads/',
    private readonly baseUrl: string = '/v1/attachments/',
  ) {}

  /**
   * Stores a file buffer to disk.
   * - Sanitises the user-provided filename (strip path separators)
   * - Creates basePath/fileId/ directory if it doesn't exist
   * - Writes the buffer as {fileId}/{sanitised-filename}
   * - Returns the generated FileId
   */
  async upload(
    filename: string,
    buffer: Buffer,
    _mimeType: string,
  ): Promise<FileId> {
    const safeName = this.sanitiseFilename(filename);
    const fileId = FileId.create();
    const dir = this.resolveDir(fileId);

    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, safeName);
    await fs.writeFile(filePath, buffer);

    return fileId;
  }

  /**
   * Returns the external URL for the given FileId.
   */
  getUrl(fileId: FileId): string {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}${fileId.get()}`;
  }

  /**
   * Deletes the file directory for the given FileId.
   * Idempotent — no-op if the directory doesn't exist.
   */
  async delete(fileId: FileId): Promise<void> {
    const dir = this.resolveDir(fileId);
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch {
      // Idempotent: ignore if the directory doesn't exist
    }
  }

  /**
   * Returns the internal filesystem directory path for a given FileId.
   */
  getPath(fileId: FileId): string {
    return this.resolveDir(fileId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private sanitiseFilename(name: string): string {
    // Remove path separators and drive letters
    let safe = name.replace(/\.\.(\/|\\)/g, '');
    safe = safe.replace(/[\/\\]/g, '');
    safe = safe.replace(/^[a-zA-Z]:/, '');
    // Remove any remaining null bytes
    safe = safe.replace(/\0/g, '');

    return safe || 'untitled';
  }

  private resolveDir(fileId: FileId): string {
    return path.join(this.basePath, fileId.get());
  }
}
