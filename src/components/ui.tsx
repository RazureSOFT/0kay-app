import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top', 'left', 'right']}>
      {children}
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  right,
  showBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  showBack?: boolean;
}) {
  const nav = useNavigation();
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable onPress={() => nav.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({
  label,
  value,
  right,
  onPress,
  style,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const content = (
    <View style={[styles.row, style]}>
      <View style={{ flex: 1 }}>
        {typeof label === 'string' ? <Text style={styles.rowLabel}>{label}</Text> : label}
      </View>
      {value !== undefined ? (
        typeof value === 'string' || typeof value === 'number' ? (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        ) : (
          value
        )
      ) : null}
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} style={{ marginLeft: 6 }} /> : null}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} android_ripple={{ color: theme.colors.cardAlt }}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.danger
        : variant === 'subtle'
          ? theme.colors.cardAlt
          : 'transparent';
  const fg = variant === 'ghost' ? theme.colors.text : '#fff';
  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[styles.button, { backgroundColor: bg, borderColor: theme.colors.border, opacity: disabled ? 0.5 : 1 }, style]}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={17} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  size = 22,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.iconBtn}>
      <Ionicons name={name} size={size} color={color || theme.colors.text} />
    </Pressable>
  );
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textFaint}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

export function Badge({ text, color }: { text: string; color?: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: (color || theme.colors.primary) + '33', borderColor: color || theme.colors.primary }]}>
      <Text style={[styles.badgeText, { color: color || theme.colors.primary }]}>{text}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.colors.primary} />
      {label ? <Text style={styles.dim}>{label}</Text> : null}
    </View>
  );
}

export function Empty({ text, icon = 'sparkles-outline' }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={34} color={theme.colors.textFaint} />
      <Text style={[styles.dim, { marginTop: 8 }]}>{text}</Text>
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
      <Text style={styles.errorText} numberOfLines={3}>
        {message}
      </Text>
      {onRetry ? <Button title="重试" variant="ghost" onPress={onRetry} style={{ paddingVertical: 4, paddingHorizontal: 8 }} /> : null}
    </View>
  );
}

export function Scroll({ children, ...rest }: React.ComponentProps<typeof ScrollView>) {
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  backBtn: { marginRight: 2 },
  headerTitle: { color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '700' },
  headerSub: { color: theme.colors.textDim, fontSize: theme.font.small, marginTop: 1 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: 8,
  },
  rowLabel: { color: theme.colors.text, fontSize: theme.font.body },
  rowValue: { color: theme.colors.textDim, fontSize: theme.font.small, maxWidth: '55%' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonText: { fontSize: theme.font.body, fontWeight: '600' },
  iconBtn: { padding: 6 },
  input: {
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: theme.font.body,
  },
  inputLabel: { color: theme.colors.textDim, fontSize: theme.font.small, marginBottom: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: theme.font.tiny, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  dim: { color: theme.colors.textDim, fontSize: theme.font.small },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3a1220',
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.danger,
  },
  errorText: { color: theme.colors.text, flex: 1, fontSize: theme.font.small },
});
