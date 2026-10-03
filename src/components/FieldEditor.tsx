import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from './ui';
import { theme } from '../theme';
import type { SettingsField } from '../api/types';

interface SelectOption {
  value: string;
  label: string;
}

function Picker({
  visible,
  title,
  options,
  onClose,
  onPick,
}: {
  visible: boolean;
  title: string;
  options: SelectOption[];
  onClose: () => void;
  onPick: (v: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 420 }}>
            {options.map((o) => (
              <Pressable key={o.value || '(empty)'} style={styles.opt} onPress={() => { onPick(o.value); onClose(); }}>
                <Text style={styles.optText}>{o.label || o.value || '(默认)'}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function FieldEditor({
  field,
  value,
  modelIds,
  onChange,
}: {
  field: SettingsField;
  value: any;
  modelIds: string[];
  onChange: (v: any) => void;
}) {
  const [open, setOpen] = useState(false);

  if (field.type === 'bool') {
    return (
      <View style={styles.boolRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{field.label || field.key}</Text>
          {field.description ? <Text style={styles.desc}>{field.description}</Text> : null}
        </View>
        <Switch value={!!value} onValueChange={onChange} trackColor={{ true: theme.colors.primary, false: '#333' }} />
      </View>
    );
  }

  if (field.type === 'select') {
    const options: SelectOption[] = (field.options || []).map((o: any) => ({
      value: typeof o === 'string' ? o : o.value,
      label: typeof o === 'string' ? o : o.label || o.value,
    }));
    const current = options.find((o) => o.value === value);
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{field.label || field.key}</Text>
        {field.description ? <Text style={styles.desc}>{field.description}</Text> : null}
        <Pressable style={styles.select} onPress={() => setOpen(true)}>
          <Text style={styles.selectText}>{current?.label || value || '(默认)'}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textDim} />
        </Pressable>
        <Picker visible={open} title={field.label || field.key} options={options} onClose={() => setOpen(false)} onPick={onChange} />
      </View>
    );
  }

  if (field.type === 'model' || field.type === 'models') {
    const options: SelectOption[] = modelIds.map((m) => ({ value: m, label: m }));
    const current = String(value || '');
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{field.label || field.key}</Text>
        {field.description ? <Text style={styles.desc}>{field.description}</Text> : null}
        <Pressable style={styles.select} onPress={() => setOpen(true)}>
          <Text style={styles.selectText}>{current || field.placeholder || '(选择模型)'}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textDim} />
        </Pressable>
        <Picker visible={open} title={field.label || field.key} options={options} onClose={() => setOpen(false)} onPick={onChange} />
      </View>
    );
  }

  if (field.type === 'number') {
    return (
      <View>
        <Text style={styles.label}>{field.label || field.key}</Text>
        {field.description ? <Text style={styles.desc}>{field.description}</Text> : null}
        <Input
          keyboardType="numeric"
          value={value === undefined || value === null ? '' : String(value)}
          placeholder={field.placeholder}
          onChangeText={(t) => onChange(t === '' ? '' : Number(t))}
        />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>{field.label || field.key}</Text>
      {field.description ? <Text style={styles.desc}>{field.description}</Text> : null}
      <Input
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={field.placeholder}
        onChangeText={onChange}
        multiline={String(value ?? '').length > 60}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boolRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  label: { color: theme.colors.text, fontSize: theme.font.body, marginBottom: 6 },
  desc: { color: theme.colors.textFaint, fontSize: 12, marginBottom: 6, marginTop: -2 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.bgAlt,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  selectText: { color: theme.colors.text, fontSize: theme.font.body, flex: 1 },
  backdrop: { flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  sheetTitle: { color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '700' },
  opt: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  optText: { color: theme.colors.text, fontSize: theme.font.body },
});
