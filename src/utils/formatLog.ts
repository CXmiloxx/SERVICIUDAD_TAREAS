const pad = (str: string, len = 11) =>
  str.length < len ? str + ' '.repeat(len - str.length) : str.slice(0, len);

// Formatea la fecha y hora para Colombia, incluye día de la semana
const timeStamp = () => {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Bogota',
  };
  return `${now.toLocaleString('es-CO', options)}`;
};

const formatLineInline = (
  tag: string,
  colorBg: string,
  colorFg: string,
  msgColor: string,
  msg: string
) => {
  return (
    `${colorBg}${colorFg} ${pad(tag)} \x1b[0m` +
    ` \x1b[2m${timeStamp()}\x1b[0m` +
    `  ${msgColor}${msg}\x1b[0m`
  );
};

export const log = {
  success: (msg: string) =>
    console.log(
      formatLineInline('✓ ÉXITO', '\x1b[1m\x1b[42m', '\x1b[30m', '\x1b[1m\x1b[32m', msg),
    ),
  info: (msg: string) =>
    console.log(
      formatLineInline('ℹ INFO', '\x1b[1m\x1b[44m', '\x1b[37m', '\x1b[1m\x1b[36m', msg),
    ),
  warn: (msg: string) =>
    console.log(
      formatLineInline('! ADVERT', '\x1b[1m\x1b[43m', '\x1b[30m', '\x1b[1m\x1b[33m', msg),
    ),
  error: (msg: string, err?: any) => {
    let line = formatLineInline('✗ ERROR', '\x1b[1m\x1b[41m', '\x1b[37m', '\x1b[1m\x1b[31m', msg);
    if (err) {
      line += `  \x1b[31m| Detalles: ${typeof err === 'string' ? err : (err?.message || JSON.stringify(err))}\x1b[0m`;
    }
    return console.error(line);
  },
  separator: (char = '===', len = 30) =>
    console.log(`\x1b[90m${char.repeat(len)}\x1b[0m`),
};
