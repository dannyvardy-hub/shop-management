export function fmtMoney(n) {
  return (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtInt(n) {
  return (Number(n) || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}
