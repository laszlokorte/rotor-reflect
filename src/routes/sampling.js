export const jitteredGrid = (n = 20, jitter = 0.3) => {
  const step = 30 / (n - 1);

  return Array.from({ length: n * n }, (_, i) => {
    const x = i % n;
    const y = Math.floor(i / n);

    return {
      x: -15 + x * step + (Math.random() * 2 - 1) * step * jitter,
      y: -15 + y * step + (Math.random() * 2 - 1) * step * jitter,
    };
  });
};
