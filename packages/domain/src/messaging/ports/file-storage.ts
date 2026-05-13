import { FileId } from '../../shared/value-objects/file-id';

/**
 * IFileStorage port.
 *
 * Defines the contract for storing and retrieving file attachments.
 * Implementations belong in infrastructure/ (e.g., LocalFileStorage).
 *
 * All methods return Promises — file I/O is inherently asynchronous.
 */
export interface IFileStorage {
  /**
   * Uploads a file buffer to persistent storage.
   * Returns the generated FileId that identifies the stored file.
   */
  upload(filename: string, buffer: Buffer, mimeType: string): Promise<FileId>;

  /**
   * Returns a URL (or path) from which the file can be accessed externally.
   */
  getUrl(fileId: FileId): string;

  /**
   * Deletes a stored file by its FileId.
   * No-op if the file does not exist (idempotent delete).
   */
  delete(fileId: FileId): Promise<void>;

  /**
   * Returns the internal filesystem path for a given FileId.
   * Intended for adapter use only (e.g., creating read streams).
   */
  getPath(fileId: FileId): string;
}
