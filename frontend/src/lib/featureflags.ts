const features = {
  // @ts-expect-error - injected by esbuild
  fileexplorer: process.env.FEATURE_FILEEXPLORER,
  // @ts-expect-error - injected by esbuild
  cmdpal: process.env.FEATURE_COMMAND_PALETTE,
  // @ts-expect-error - injected by esbuild
  vscodeext: process.env.FEATURE_VSCODE_EXTENSION,
};

export function checkFeature(feature: keyof typeof features): boolean {
  return features[feature] === "true";
}
