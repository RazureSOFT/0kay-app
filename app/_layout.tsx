import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useServer } from '../src/store/server';
import { useLife } from '../src/store/life';
import { useChat } from '../src/store/chat';
import { theme } from '../src/theme';

function AuthGate() {
  const { ready, baseUrl, authRequired } = useServer();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuthArea = segments[0] === 'login' || segments[0] === 'pairing';
    if ((!baseUrl || authRequired) && !inAuthArea) {
      router.replace('/login');
    }
  }, [ready, baseUrl, authRequired, segments]);

  return null;
}

function PinGate() {
  const { pinRequired, setPin, markPinRequired } = useServer();
  const [value, setValue] = useState('');
  if (!pinRequired) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.pinBox}>
        <Text style={styles.pinTitle}>需要访问 PIN</Text>
        <Text style={styles.pinSub}>此操作需要敏感操作 PIN</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.pinInput}
          autoFocus
        />
        <Pressable
          style={styles.pinBtn}
          onPress={async () => {
            if (value.length < 4) return;
            await setPin(value.trim());
            setValue('');
          }}
        >
          <Text style={styles.pinBtnText}>确认</Text>
        </Pressable>
        <Pressable onPress={() => markPinRequired(false)} hitSlop={8}>
          <Text style={styles.cancel}>取消</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const hydrate = useServer((s) => s.hydrate);
  const ready = useServer((s) => s.ready);
  const baseUrl = useServer((s) => s.baseUrl);
  const connect = useLife((s) => s.connect);
  const disconnect = useLife((s) => s.disconnect);
  const initChat = useChat((s) => s.init);

  useEffect(() => {
    hydrate();
    initChat();
  }, []);

  useEffect(() => {
    if (baseUrl) connect();
    else disconnect();
  }, [baseUrl]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="session/[id]" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="settings/[id]" />
        <Stack.Screen name="providers/index" />
        <Stack.Screen name="providers/[id]" />
        <Stack.Screen name="plugins" />
        <Stack.Screen name="usage" />
        <Stack.Screen name="memory" />
        <Stack.Screen name="skills" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="companion" />
        <Stack.Screen name="inbox" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="about" />
      </Stack>
      {ready ? <AuthGate /> : null}
      <PinGate />
      {!ready ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#05070fee',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pinBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: 8,
  },
  pinTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  pinSub: { color: theme.colors.textDim, fontSize: theme.font.small },
  pinInput: {
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
    marginTop: 6,
  },
  pinBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 11,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  pinBtnText: { color: '#fff', fontWeight: '700' },
  cancel: { color: theme.colors.textDim, marginTop: 8 },
});
