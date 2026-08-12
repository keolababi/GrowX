import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useColorMode } from '@/providers/ColorModeProvider';

type DialogVariant = 'default' | 'danger' | 'info';
type DialogOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
};
type DialogRequest = DialogOptions & { mode: 'confirm' | 'alert' };
type DialogContextValue = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: Omit<DialogOptions, 'cancelLabel'>) => Promise<void>;
};

const AppDialogContext = createContext<DialogContextValue | null>(null);

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const { colors } = useColorMode();
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const resolverRef = useRef<((accepted: boolean) => void) | null>(null);

  const open = useCallback((next: DialogRequest) => {
    resolverRef.current?.(false);
    setRequest(next);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirm = useCallback(
    (options: DialogOptions) => open({ ...options, mode: 'confirm' }),
    [open],
  );
  const alert = useCallback(
    async (options: Omit<DialogOptions, 'cancelLabel'>) => {
      await open({ ...options, mode: 'alert' });
    },
    [open],
  );

  const close = useCallback((accepted: boolean) => {
    setRequest(null);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(accepted);
  }, []);

  const value = useMemo(() => ({ confirm, alert }), [alert, confirm]);
  const variant = request?.variant ?? 'default';
  const accent = variant === 'danger' ? colors.danger : colors.primary;
  const icon =
    variant === 'danger'
      ? ('warning-outline' as const)
      : variant === 'info'
        ? ('information-circle-outline' as const)
        : ('help-circle-outline' as const);

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(request)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => close(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Цонх хаах"
            style={StyleSheet.absoluteFill}
            onPress={() => close(false)}
          />
          {request && (
            <View
              accessibilityRole="alert"
              style={[
                styles.dialog,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSoft }]}>
                <Icon name={icon} size={28} color={accent} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{request.title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {request.message}
              </Text>
              <View style={styles.actions}>
                {request.mode === 'confirm' && (
                  <View
                    style={[
                      styles.buttonShell,
                      styles.cancelButton,
                      { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={request.cancelLabel ?? 'Болих'}
                      onPress={() => close(false)}
                      style={StyleSheet.absoluteFill}
                    />
                    <View pointerEvents="none" style={styles.buttonContent}>
                      <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                        {request.cancelLabel ?? 'Болих'}
                      </Text>
                    </View>
                  </View>
                )}
                <View
                  style={[styles.buttonShell, { backgroundColor: accent, borderColor: accent }]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      request.confirmLabel ?? (request.mode === 'alert' ? 'Ойлголоо' : 'Тийм')
                    }
                    onPress={() => close(true)}
                    style={StyleSheet.absoluteFill}
                  />
                  <View pointerEvents="none" style={styles.buttonContent}>
                    <Text
                      style={[
                        styles.confirmText,
                        { color: variant === 'danger' ? '#FFFFFF' : colors.ink },
                      ]}
                    >
                      {request.confirmLabel ?? (request.mode === 'alert' ? 'Ойлголоо' : 'Тийм')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(AppDialogContext);
  if (!context) throw new Error('useAppDialog must be used inside AppDialogProvider.');
  return context;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 24,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: 15, textAlign: 'center', fontSize: 20, lineHeight: 26, fontWeight: '900' },
  message: { marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  actions: {
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonShell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
  },
  cancelButton: { marginRight: 10 },
  buttonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    includeFontPadding: false,
  },
  confirmText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    includeFontPadding: false,
  },
});
