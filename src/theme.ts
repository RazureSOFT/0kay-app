export const theme = {
  colors: {
    bg: '#0b1020',
    bgAlt: '#0e1530',
    card: '#141b36',
    cardAlt: '#1a2344',
    border: '#243056',
    text: '#e8ecff',
    textDim: '#9aa4c7',
    textFaint: '#6b76a0',
    primary: '#5b8cff',
    primaryDim: '#3a5fd0',
    success: '#3ddc84',
    warn: '#ffb454',
    danger: '#ff5c5c',
    user: '#24406f',
    assistant: '#141b36',
    accent: '#a78bfa',
  },
  radius: { sm: 8, md: 12, lg: 18, pill: 999 },
  space: (n: number) => n * 4,
  font: {
    h1: 26,
    h2: 20,
    h3: 17,
    body: 15,
    small: 13,
    tiny: 11,
  },
};

export type Theme = typeof theme;
