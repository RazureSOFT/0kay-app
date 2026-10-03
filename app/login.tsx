import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Input, Button, Scroll, Card } from '../src/components/ui';
import { useServer, normalizeBase } from '../src/store/server';
import { auth, system } from '../src/api/endpoints';
import { theme } from '../src/theme';

export default function Login() {
  const router = useRouter();
  const configure = useServer((s) => s.configure);
  const [url, setUrl] = useState(useServer.getState().baseUrl || 'http://192.168.1.10:8080');
  const [token, setToken] = useState(useServer.getState().token || '');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const base = normalizeBase(url);
    if (!base) {
      setError('请输入服务器地址');
      return;
    }
    setBusy(true);
    try {
      await configure({ baseUrl: base, token: token.trim(), pin: pin.trim() });
      // Validate: session endpoint works even when auth is required.
      const session = await auth.session().catch(() => null);
      if (session && session.requires_auth && !session.authenticated && !token.trim() && !pin.trim()) {
        setError('该服务器需要凭证，请填写 API Token 或 PIN。');
        setBusy(false);
        return;
      }
      await system.health();
      router.replace('/');
    } catch (e: any) {
      setError(e?.message || '无法连接，请检查地址与网络');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Scroll>
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>0K</Text>
            </View>
            <Text style={styles.title}>0KAY</Text>
            <Text style={styles.sub}>连接你自托管的 AI 伙伴</Text>
          </View>

          <Card>
            <Input
              label="服务器地址"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.1.10:8080"
            />
            <Input
              label="API Token（可选）"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="CORE_API_TOKEN / 配对 token"
            />
            <Input
              label="访问 PIN（可选）"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="敏感操作 PIN"
            />
            {error ? (
              <View style={styles.err}>
                <Ionicons name="alert-circle" size={15} color={theme.colors.danger} />
                <Text style={styles.errText}>{error}</Text>
              </View>
            ) : null}
            <Button title="连接" onPress={submit} loading={busy} icon="link-outline" />
          </Card>

          <Pressable style={styles.pair} onPress={() => router.push('/pairing')}>
            <Ionicons name="qr-code-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.pairText}>通过主机配对连接</Text>
          </Pressable>

          <Text style={styles.hint}>
            提示：Core 默认只监听 127.0.0.1。手机连接需设置 CORE_BIND_HOST=0.0.0.0
            并将手机所在网段加入 CORE_TRUSTED_NETWORKS 或提供 Token。
          </Text>
        </Scroll>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginVertical: 28 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: theme.colors.primary, fontSize: 40, fontWeight: '900' },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  sub: { color: theme.colors.textDim, marginTop: 4 },
  err: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 10 },
  errText: { color: theme.colors.danger, fontSize: theme.font.small, flex: 1 },
  pair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 },
  pairText: { color: theme.colors.primary, fontWeight: '600' },
  hint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 20, lineHeight: 18, textAlign: 'center' },
});
