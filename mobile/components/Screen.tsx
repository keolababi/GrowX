import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView } from 'react-native';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView className="flex-1 px-5" contentContainerClassName="py-8">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
