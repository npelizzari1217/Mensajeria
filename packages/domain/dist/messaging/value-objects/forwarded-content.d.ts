/**
 * ForwardedContent Value Object.
 *
 * Encapsulates the original message content being forwarded.
 * Used to quote the original message in the new forwarded message body.
 */
export declare class ForwardedContent {
    private readonly originalMessageId;
    private readonly originalSenderName;
    private readonly originalSubject;
    private readonly originalBody;
    private readonly comment;
    private constructor();
    static create(props: ForwardedContentProps): ForwardedContent;
    getOriginalMessageId(): string;
    getOriginalSenderName(): string;
    getOriginalSubject(): string;
    getOriginalBody(): string;
    getComment(): string | null;
    /**
     * Builds the forwarded message body with quoted original content.
     */
    buildForwardBody(): string;
    equals(other: ForwardedContent): boolean;
}
export interface ForwardedContentProps {
    originalMessageId: string;
    originalSenderName: string;
    originalSubject: string;
    originalBody: string;
    comment?: string | null;
}
//# sourceMappingURL=forwarded-content.d.ts.map