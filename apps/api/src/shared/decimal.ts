const SCALE = 10_000n;

const parse = (value: string): bigint => {
  if (!/^\d+(\.\d{1,4})?$/.test(value)) {
    throw new Error('Invalid decimal value');
  }
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole ?? '0') * SCALE + BigInt(fraction.padEnd(4, '0'));
};

const format = (value: bigint): string => {
  if (value < 0n) {
    throw new Error('Decimal cannot be negative');
  }
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(4, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
};

export const addDecimal = (left: string, right: string): string => format(parse(left) + parse(right));

export const subtractDecimal = (left: string, right: string): string => format(parse(left) - parse(right));

export const isGreaterThan = (left: string, right: string): boolean => parse(left) > parse(right);

export const areEqual = (left: string, right: string): boolean => parse(left) === parse(right);
