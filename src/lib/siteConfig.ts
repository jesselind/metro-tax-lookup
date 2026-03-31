import { safeGithubRepoUrl } from "@/lib/safeGithubRepoUrl";

export const SITE_CONFIG = {
  githubRepoUrl:
    safeGithubRepoUrl(process.env.NEXT_PUBLIC_GITHUB_REPO_URL) ?? "",
} as const;

