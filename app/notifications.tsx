import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, Header, Scroll, Card, Button, Empty } from '../src/components/ui';
import { useLife } from '../src/store/life';
import { useChat } from '../src/store/chat';
import { theme } from '../src/theme';

export default function NotificationsScreen() {
  const { notifications, loadNotifications, ack } = useLife();
  const sessionId = useChat((s) => s.sessionId);

  useEffect(() => {
    loadNotifications(sessionId);
  }, []);

  return (
    <Screen>
      <Header
        title="通知"
        showBack
        right={
          notifications.length ? (
            <Button title="全部已读" variant="ghost" onPress={() => ack(notifications.map((n) => n.id))} />
          ) : undefined
        }
      />
      <Scroll>
        {notifications.length ? (
          notifications.map((n) => (
            <Card key={n.id}>
              <Text style={styles.text}>{n.text}</Text>
              <View style={styles.meta}>
                <Text style={styles.dim}>{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</Text>
                <Button title="已读" variant="ghost" onPress={() => ack([n.id])} />
              </View>
            </Card>
          ))
        ) : (
          <Empty text="暂无通知" icon="notifications-outline" />
        )}
      </Scroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { color: theme.colors.text, fontSize: theme.font.body, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dim: { color: theme.colors.textFaint, fontSize: 12 },
});
