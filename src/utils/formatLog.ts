const pad = (str: string, len = 9) =>
  str.length < len ? str + ' '.repeat(len - str.length) : str.slice(0, len);

//formatear fecha para colombia
const timeStamp = () => {
  const now = new Date();
  return `${now.toLocaleTimeString('es-CO', {
    hour12: true,
    timeZone: 'America/Bogota',
  })}.${String(now.getMilliseconds()).padStart(3, '0')}`;
};

export const log = {
  success: (msg: string) =>
    console.log(
      `\x1b[1m\x1b[42m\x1b[30m ${pad(
        '✓ SUCCESS',
      )} \x1b[0m \x1b[2m[${timeStamp()}]\x1b[0m \x1b[1m\x1b[32m${msg}\x1b[0m`,
    ),
  info: (msg: string) =>
    console.log(
      `\x1b[1m\x1b[44m\x1b[37m ${pad(
        'ℹ INFO',
      )} \x1b[0m  \x1b[2m[${timeStamp()}]\x1b[0m \x1b[1m\x1b[36m${msg}\x1b[0m`,
    ),
  warn: (msg: string) =>
    console.log(
      `\x1b[1m\x1b[43m\x1b[30m ${pad(
        '! WARNING',
      )} \x1b[0m \x1b[2m[${timeStamp()}]\x1b[0m \x1b[1m\x1b[33m${msg}\x1b[0m`,
    ),
  error: (msg: string, p0: any) =>
    console.error(
      `\x1b[1m\x1b[41m\x1b[37m ${pad(
        '✗ ERROR',
      )} \x1b[0m  \x1b[2m[${timeStamp()}]\x1b[0m \x1b[1m\x1b[31m${msg}\x1b[0m`,
    ),
  separator: (char = '===', len = 30) =>
    console.log(`\x1b[90m${char.repeat(len)}\x1b[0m`),
};
