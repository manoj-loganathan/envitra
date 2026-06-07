export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(' ');
}

export function formatPrice(amountInPaise: number): string {
  return (amountInPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

// Check solid color brightness for contrast text selection
// returns true for dark colors (which require white text) and false for bright colors (require dark text)
export function isDarkColor(hex: string): boolean {
  if (!hex || hex === '') return true;
  const c = hex.startsWith('#') ? hex.substring(1) : hex; // strip #
  if (c.length !== 3 && c.length !== 6) return true;
  
  let r = 0, g = 0, b = 0;
  if (c.length === 3) {
    r = parseInt(c[0] + c[0], 16);
    g = parseInt(c[1] + c[1], 16);
    b = parseInt(c[2] + c[2], 16);
  } else {
    const rgb = parseInt(c, 16);
    r = (rgb >> 16) & 0xff;
    g = (rgb >> 8) & 0xff;
    b = (rgb >> 0) & 0xff;
  }
  
  // standard luminance formula
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128; // lower means darker
}
