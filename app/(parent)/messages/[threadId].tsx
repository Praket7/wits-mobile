import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ThreadDetailBody } from '@/components/ThreadView';

/** Parent thread detail — the selected child's mailbox (plan item 14). */
export default function ParentMessageThreadDetail() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  return <ThreadDetailBody threadId={threadId ?? ''} />;
}
