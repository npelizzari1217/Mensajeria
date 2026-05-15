/**
 * MessageCard — card reutilizable para Inbox, Sent y Search.
 *
 * Muestra: sender/recipients, subject, preview del body, fecha y badge de no-leído.
 * Tap → onPress callback (cada screen maneja la navegación).
 */
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { formatDate } from '../lib/formatters';

export interface MessageCardProps {
  id: string;
  /** Nombre del remitente — para Inbox */
  senderName?: string;
  /** Nombres de destinatarios — para Sent */
  recipientNames?: string[];
  subject: string;
  body: string;
  sentAt: string;
  isUnread?: boolean;
  onPress: () => void;
}

export function MessageCard({
  senderName,
  recipientNames,
  subject,
  body,
  sentAt,
  isUnread = false,
  onPress,
}: MessageCardProps) {
  // La primera línea del body como preview (máx 80 chars)
  const preview = body.length > 80 ? body.slice(0, 80) + '…' : body;
  const from = senderName ?? recipientNames?.join(', ') ?? '';

  return (
    <TouchableOpacity
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text
          style={[styles.from, isUnread && styles.fromBold]}
          numberOfLines={1}
        >
          {from}
        </Text>
        <Text style={styles.date}>{formatDate(sentAt)}</Text>
      </View>

      <Text
        style={[styles.subject, isUnread && styles.subjectBold]}
        numberOfLines={1}
      >
        {subject}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
        {isUnread && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Nuevo</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // Elevation (Android)
    elevation: 2,
  },
  cardUnread: {
    borderLeftColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  from: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
  },
  fromBold: {
    fontWeight: '700',
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  subject: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  subjectBold: {
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});
