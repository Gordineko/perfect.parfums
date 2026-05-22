export function getStarVariant(display, i) {
  const diff = display - i;
  if (diff >= 1) return "full";
  if (diff >= 0.5) return "half";
  return "empty";
}

export function calcStarValue(event, index) {
  const { left, width } = event.currentTarget.getBoundingClientRect();
  const offsetX = event.clientX - left;
  return index + (offsetX <= width / 2 ? 0.5 : 1);
}
