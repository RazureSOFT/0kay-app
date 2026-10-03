import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, IconButton } from '../../src/components/ui';
import { ChatBubble } from '../../src/components/ChatBubble';
import { useChat } from '../../src/store/chat';
import { useLife } from '../../src/store/life';
import { theme } from '../../src/theme';
import { PickedFile } from '../../src/api/http';

export default function ChatScreen() {
  const { messages, isTyping, send, stop, clear, compact, voiceEnabled, setVoice, sessionId, markRead } = useChat();
  const isConnected = useLife((s) => s.isConnected);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PickedFile[]>([]);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    markRead();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length, messages[messages.length - 1]?.content]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ['images'] });
    if (res.canceled) return;
    const a = res.assets[0];
    setAttachments((prev) => [
      ...prev,
      { uri: a.uri, name: a.fileName || `image_${Date.now()}.jpg`, mime: a.mimeType || 'image/jpeg' },
    ]);
  }, []);

  const pickFile = useCallback(async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled) return;
    const a = res.assets[0];
    setAttachments((prev) => [...prev, { uri: a.uri, name: a.name, mime: a.mimeType || 'application/octet-stream' }]);
  }, []);

  const onSend = () => {
    const content = text.trim();
    if (!content && !attachments.length) return;
    send(content, attachments);
    setText('');
    setAttachments([]);
  };

  const openMenu = () => {
    Alert.alert('会话操作', sessionId, [
      { text: voiceEnabled ? '关闭语音朗读' : '开启语音朗读', onPress: () => setVoice(!voiceEnabled) },
      { text: '压缩上下文', onPress: () => compact().catch(() => {}) },
      { text: '清空消息', style: 'destructive', onPress: () => clear() },
      { text: '取消', style: 'cancel' },
    ]);
  };

  return (
    <Screen>
      <Header
        title="聊天"
        subtitle={isConnected ? sessionId : '未连接'}
        right={
          <View style={{ flexDirection: 'row' }}>
            <IconButton name="options-outline" onPress={openMenu} />
            <View style={[styles.dot, { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }]} />
          </View>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => m.id || String(i)}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={theme.colors.textFaint} />
              <Text style={styles.emptyText}>和她打个招呼吧</Text>
            </View>
          }
        />

        {attachments.length ? (
          <View style={styles.attachBar}>
            {attachments.map((a, i) => (
              <Pressable key={i} style={styles.chip} onPress={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                <Ionicons name="document-outline" size={12} color={theme.colors.textDim} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {a.name}
                </Text>
                <Ionicons name="close" size={12} color={theme.colors.textFaint} />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <IconButton name="image-outline" onPress={pickImage} color={theme.colors.textDim} />
          <IconButton name="attach-outline" onPress={pickFile} color={theme.colors.textDim} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="发消息…"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            multiline
          />
          {isTyping ? (
            <Pressable style={[styles.send, { backgroundColor: theme.colors.danger }]} onPress={stop}>
              <Ionicons name="stop" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable style={styles.send} onPress={onSend}>
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, paddingBottom: 20 },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyText: { color: theme.colors.textFaint, marginTop: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, alignSelf: 'center', marginLeft: 4 },
  attachBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.cardAlt,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 200,
  },
  chipText: { color: theme.colors.textDim, fontSize: 11, flexShrink: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bgAlt,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxHeight: 120,
    fontSize: theme.font.body,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
