// Find all symbols in document
export async function retry<T>(
  asyncFn: () => Promise<T>,
  options: {
    maxRetries: number;
    delay: number;
  } = { maxRetries: 2, delay: 100 }
): Promise<T | undefined> {
  const { maxRetries, delay } = options;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const symbols = await asyncFn();
      if (symbols !== undefined) {
        return symbols;
      }
    } catch (err) {}
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return undefined;
}
