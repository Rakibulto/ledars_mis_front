import colors from 'src/theme/core/colors.json';

export function getRandomBgColor() {
  const colorKeys = Object.keys(colors).filter(
    (key) => typeof colors[key] === 'object' && colors[key].main
  );
  const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  return colors[randomKey].main;
}

export function getRandomColor() {
  const colorKeys = Object.keys(colors).filter((key) =>
    [
      'primary',
      'primaryAlt',
      'secondary',
      'info',
      'success',
      'warning',
      'error',
      'blue',
      'pink',
      'orange',
      'tertiary',
    ].includes(key)
  );
  const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  return randomKey;
}
