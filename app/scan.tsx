import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Button } from '../src/components/ui';
import { useServer, normalizeBase } from '../src/store/server';
import { parsePairingPayload } from '../src/util/pairing';
import { auth, system } from '../src/api/endpoints';
import { theme } from '../src/theme';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);

  const onScan = useCallback(
    async ({ data }: { data: string }) => {
      if (locked.current || busy) return;
      locked.current = true;
      setError('');
      const info = parsePairingPayload(data);
      if (!info) {
        setError('无法识别的二维码');
        setTimeout(() => {
          locked.current = false;
        }, 1200);
        return;
      }
      setBusy(true);
      setStatus('正在连接并保存…');
      try {
        await useServer.getState().configure({
          baseUrl: normalizeBase(info.baseUrl),
          token: info.token ?? '',
          pin: info.pin ?? '',
        });
        // Validate against the server before treating the scan as successful.
        await auth.session().catch(() => null);
        await system.health();
        setStatus('连接成功，已记住该服务器');
        router.replace('/');
      } catch (e: any) {
        setError(e?.message || '连接失败，请确认地址/网络');
        setStatus('');
        locked.current = false;
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  if (!permission) {
    return (
      <Screen>
        <Header title="扫码连接" showBack />
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <Header title="扫码连接" showBack />
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={40} color={theme.colors.textFaint} />
          <Text style={styles.hint}>需要相机权限才能扫描连接二维码</Text>
          <Button title="授予相机权限" onPress={requestPermission} icon="camera-outline" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="扫码连接" subtitle="对准电脑 WebUI 设置的「连接」二维码" showBack />
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScan}
        />
        <View style={styles.frame} pointerEvents="none" />
      </View>

      <View style={styles.footer}>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : status ? (
          <Text style={styles.status}>{status}</Text>
        ) : (
          <Text style={styles.hint}>扫描后会自动保存连接信息（下次打开直接使用）</Text>
        )}
        <Pressable onPress={() => router.back()}>
          <Text style={styles.manual}>改为手动输入</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  cameraWrap: { flex: 1, margin: 16, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  frame: {
    position: 'absolute',
    top: '22%',
    left: '18%',
    right: '18%',
    bottom: '22%',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  footer: { paddingHorizontal: 20, paddingBottom: 28, gap: 10, alignItems: 'center' },
  hint: { color: theme.colors.textDim, textAlign: 'center', fontSize: theme.font.small },
  status: { color: theme.colors.success, textAlign: 'center', fontSize: theme.font.small },
  error: { color: theme.colors.danger, textAlign: 'center', fontSize: theme.font.small },
  manual: { color: theme.colors.primary, fontWeight: '600', marginTop: 6 },
});
