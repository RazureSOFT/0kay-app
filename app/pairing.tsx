import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Input, Button, Scroll, Card } from '../src/components/ui';
import { useServer, normalizeBase } from '../src/store/server';
import { pairing } from '../src/api/endpoints';
import { theme } from '../src/theme';

export default function Pairing() {
  const router = useRouter();
  const configure = useServer((s) => s.configure);
  const [url, setUrl] = useState(useServer.getState().baseUrl || 'http://192.168.1.10:8080');
  const [name, setName] = useState('0KAY Android');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const poll = useRef<any>(null);

  useEffect(() => () => poll.current && clearInterval(poll.current), []);

  const start = async () => {
    setError('');
    setStatus('正在向主机发送配对请求…');
    const base = normalizeBase(url);
    await configure({ baseUrl: base });
    try {
      const req = await pairing.request(name);
      setCode(req.code);
      setStatus('请在主机 WebUI 的「配对」页批准此设备。');
      poll.current = setInterval(async () => {
        try {
          const res = await pairing.status(req.id, req.secret);
          if (res.approved && res.token) {
            clearInterval(poll.current);
            await configure({ baseUrl: normalizeBase(res.server_name ? `https://${res.server_name}` : base), token: res.token });
            setStatus('配对成功！');
            router.replace('/');
          }
        } catch {}
      }, 2500);
    } catch (e: any) {
      setStatus('');
      setError(e?.message || '配对请求失败');
    }
  };

  return (
    <Screen>
      <Header title="设备配对" subtitle="使用主机批准的一次性代码" showBack />
      <Scroll>
        <Card>
          <Input label="服务器地址" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} />
          <Input label="设备名称" value={name} onChangeText={setName} />
          <Button title="请求配对" onPress={start} icon="qr-code-outline" />
        </Card>
        {code ? (
          <Card style={{ alignItems: 'center' }}>
            <Text style={styles.codeLabel}>配对码</Text>
            <Text style={styles.code}>{code}</Text>
            <Text style={styles.status}>{status}</Text>
          </Card>
        ) : null}
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  codeLabel: { color: theme.colors.textDim, fontSize: theme.font.small },
  code: { color: theme.colors.primary, fontSize: 44, fontWeight: '900', letterSpacing: 10, marginVertical: 8 },
  status: { color: theme.colors.textDim, fontSize: theme.font.small, textAlign: 'center' },
  err: { color: theme.colors.danger, textAlign: 'center' },
});
