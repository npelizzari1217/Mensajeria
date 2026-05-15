/**
 * ForwardedContent Value Object.
 *
 * Encapsulates the original message content being forwarded.
 * Used to quote the original message in the new forwarded message body.
 */
export class ForwardedContent {
  private constructor(
    private readonly originalMessageId: string,
    private readonly originalSenderName: string,
    private readonly originalSubject: string,
    private readonly originalBody: string,
    private readonly comment: string | null,
  ) {}

  static create(props: ForwardedContentProps): ForwardedContent {
    return new ForwardedContent(
      props.originalMessageId,
      props.originalSenderName,
      props.originalSubject,
      props.originalBody,
      props.comment ?? null,
    );
  }

  getOriginalMessageId(): string {
    return this.originalMessageId;
  }

  getOriginalSenderName(): string {
    return this.originalSenderName;
  }

  getOriginalSubject(): string {
    return this.originalSubject;
  }

  getOriginalBody(): string {
    return this.originalBody;
  }

  getComment(): string | null {
    return this.comment;
  }

  /**
   * Builds the forwarded message body with quoted original content.
   */
  buildForwardBody(): string {
    const parts: string[] = [];

    if (this.comment) {
      parts.push(this.comment);
      parts.push('');
    }

    parts.push(`---------- Mensaje reenviado ----------`);
    parts.push(`De: ${this.originalSenderName}`);
    parts.push(`Asunto: ${this.originalSubject}`);
    parts.push('');
    parts.push(this.originalBody);

    return parts.join('\n');
  }

  equals(other: ForwardedContent): boolean {
    return this.originalMessageId === other.originalMessageId;
  }
}

export interface ForwardedContentProps {
  originalMessageId: string;
  originalSenderName: string;
  originalSubject: string;
  originalBody: string;
  comment?: string | null;
}
