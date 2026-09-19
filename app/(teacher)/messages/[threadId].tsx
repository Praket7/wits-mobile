import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ThreadDetailBody } from '@/components/ThreadView';

/** Teacher thread detail — the sent-announcement conversation. */
export default function TeacherMessageThreadDetail() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  return <ThreadDetailBody threadId={threadId ?? ''} />;
}
