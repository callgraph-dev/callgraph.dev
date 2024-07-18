import * as childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";

export function countFilesRecursively(folder: string): number {
  return getFilesRecursively(folder).length;
}

export function getFilesRecursively(folder: string): string[] {
  // if git exists, use `git ls-files` to get all files
  if (isInGitRepository(folder)) {
    return listFilesWithGit(folder);
  } else {
    return listFilesWithNodeFs(folder);
  }
}

function isInGitRepository(folder: string): boolean {
  try {
    const command = childProcess.execSync(
      "git rev-parse --is-inside-work-tree",
      { cwd: folder }
    );
    return command.toString().trim() === "true";
  } catch (err) {
    return false;
  }
}

function listFilesWithGit(folder: string): string[] {
  // --others + --exclude-standard includes untracked files that exist on disk
  const command = childProcess.execSync(
    "git ls-files --cached --others --exclude-standard",
    { cwd: folder }
  );
  return command.toString().split("\n");
}

function listFilesWithNodeFs(folder: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folder, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesWithNodeFs(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}
