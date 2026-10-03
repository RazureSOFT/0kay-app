import React from 'react';
import { StyleSheet, Text, View, Linking } from 'react-native';
import { theme } from '../theme';

interface Props {
  text: string;
  color?: string;
}

// Minimal markdown: fenced code blocks, headings, lists, quotes, bold/italic/inline code/links.
function inline(text: string, baseColor: string, key: string) {
  const nodes: React.ReactNode[] = [];
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}_${i++}`;
    if (tok.startsWith('`')) {
      nodes.push(
        <Text key={k} style={[styles.code, { color: theme.colors.accent }]}>
          {tok.slice(1, -1)}
        </Text>,
      );
    } else if (tok.startsWith('**')) {
      nodes.push(
        <Text key={k} style={[styles.bold, { color: baseColor }]}>
          {tok.slice(2, -2)}
        </Text>,
      );
    } else if (tok.startsWith('*')) {
      nodes.push(
        <Text key={k} style={[styles.italic, { color: baseColor }]}>
          {tok.slice(1, -1)}
        </Text>,
      );
    } else {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (mm) {
        nodes.push(
          <Text key={k} style={{ color: theme.colors.primary, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(mm[2]).catch(() => {})}>
            {mm[1]}
          </Text>,
        );
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text, color = theme.colors.text }: Props) {
  const lines = (text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let code: string[] | null = null;
  let buf: string[] = [];

  const flush = (key: string) => {
    if (!buf.length) return;
    blocks.push(
      <Text key={`p_${key}`} style={[styles.p, { color }]}>
        {inline(buf.join('\n'), color, `i_${key}`)}
      </Text>,
    );
    buf = [];
  };

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('```')) {
      if (code) {
        blocks.push(
          <View key={`c_${idx}`} style={styles.codeBlock}>
            <Text style={styles.codeText}>{code.join('\n')}</Text>
          </View>,
        );
        code = null;
      } else {
        flush(String(idx));
        code = [];
      }
      return;
    }
    if (code) {
      code.push(line);
      return;
    }
    if (/^#{1,6}\s/.test(line)) {
      flush(String(idx));
      const level = line.match(/^#+/)?.[0].length || 1;
      blocks.push(
        <Text key={`h_${idx}`} style={[styles.h, { fontSize: level <= 2 ? 19 : 16, color }]}>
          {line.replace(/^#+\s/, '')}
        </Text>,
      );
      return;
    }
    if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      flush(String(idx));
      blocks.push(
        <View key={`l_${idx}`} style={styles.li}>
          <Text style={{ color }}>· </Text>
          <Text style={[styles.liText, { color }]}>{inline(line.replace(/^\s*([-*]|\d+\.)\s/, ''), color, `li_${idx}`)}</Text>
        </View>,
      );
      return;
    }
    if (line.startsWith('>')) {
      flush(String(idx));
      blocks.push(
        <View key={`q_${idx}`} style={styles.quote}>
          <Text style={[styles.quoteText, { color }]}>{inline(line.replace(/^>\s?/, ''), color, `q_${idx}`)}</Text>
        </View>,
      );
      return;
    }
    if (!line.trim()) {
      flush(String(idx));
      return;
    }
    buf.push(line);
  });
  flush('end');
  if (code) {
    blocks.push(
      <View key="c_end" style={styles.codeBlock}>
        <Text style={styles.codeText}>{(code as string[]).join('\n')}</Text>
      </View>,
    );
  }

  return <View style={{ gap: 6 }}>{blocks}</View>;
}

const styles = StyleSheet.create({
  p: { fontSize: theme.font.body, lineHeight: 22 },
  h: { fontWeight: '700', marginTop: 4 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: 'monospace', backgroundColor: '#00000033' },
  codeBlock: {
    backgroundColor: '#05070f',
    borderRadius: theme.radius.sm,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  codeText: { fontFamily: 'monospace', fontSize: 12.5, color: '#c9d4ff' },
  li: { flexDirection: 'row', paddingLeft: 4 },
  liText: { flex: 1, fontSize: theme.font.body, lineHeight: 22 },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    paddingLeft: 10,
  },
  quoteText: { fontStyle: 'italic', color: theme.colors.textDim },
});
