import {
  setFailed,
  getInput,
  getBooleanInput,
  setOutput,
  info,
} from "@actions/core";
import { context as ghContext, getOctokit } from "@actions/github";
import { GitHubService } from "./github-service.ts";
import { CodeOwners } from "./codeowners.ts";
import { BranchHandler, PrHandler } from "./handlers/index.ts";

export type Octokit = ReturnType<typeof getOctokit>;

export async function run() {
  try {
    const { githubToken, codeownersPath, prNumber, failOnMissing, branch } =
      loadInputs();

    const { repo, owner } = ghContext.repo;
    const Octokit = getOctokit(githubToken);
    const githubService = new GitHubService(Octokit, owner, repo);

    welcomeMessage(repo, codeownersPath, failOnMissing, branch, prNumber);

    const handler = prNumber
      ? new PrHandler(githubService, prNumber)
      : new BranchHandler(githubService, branch);
    const codeownersFile = await handler.getCodeOwnersFile(codeownersPath);
    const changedFiles = await handler.getChangedFiles();
    const codeowners = new CodeOwners(codeownersFile, codeownersPath);

    const { noOwnerArr, failed } = await checkFilesOwners(
      changedFiles,
      codeowners,
      failOnMissing,
    );

    await handler.createOrUpdatePrComment(noOwnerArr);

    setOutput("total_scanned_files", changedFiles.length);
    setOutput("total_orphan_files", noOwnerArr.length);
    setOutput("failed", failed);
  } catch (error: any) {
    setFailed(`OwnYourCode action failed: ${error.message}`);
  }
}

function loadInputs() {
  const githubToken: string = getInput("GITHUB_TOKEN");
  const codeownersPath: string = getInput("CODEOWNERS_PATH");
  const prNumber: number | undefined = +getInput("PR_NUMBER");
  const branch: string | undefined = getInput("BRANCH");
  const failOnMissing: boolean = getBooleanInput("FAIL_ON_MISSING_CODEOWNERS");

  return { githubToken, codeownersPath, prNumber, failOnMissing, branch };
}

function welcomeMessage(
  repo: string,
  codeownersPath: string,
  failOnMissing: boolean,
  branch?: string,
  prNumber?: number,
) {
  info(`----------- OwnYourCode ----------`);
  info(`Repo: ${repo}`);
  info(`File: ${codeownersPath}`);
  info(`Fail on missing: ${failOnMissing}`);
  info(
    `Mode: ${prNumber ? "Check PR changed files" : "Check all branch files"}`,
  );
  branch && info(`Branch: ${branch}`);
  prNumber && info(`PR: #${prNumber}`);
  info(`----------------------------------\n`);
}

async function checkFilesOwners(
  files: string[],
  codeowners: CodeOwners,
  failOnMissingCodeowners: boolean,
) {
  let failed = false;
  const isCoveredArr: string[] = [];
  const noOwnerArr: string[] = [];

  files.forEach(file => {
    const isCovered = codeowners.isCovered(file);
    isCovered ? isCoveredArr.push(file) : noOwnerArr.push(file);
    failed = failed || !isCovered;
  });

  printResults("List of covered files ✅", isCoveredArr);
  printResults("List of files not covered ❌", noOwnerArr);

  if (failed && failOnMissingCodeowners) {
    setFailed(
      "Some files do not have an owner, please define one in CODEOWNERS file",
    );
  }

  return { noOwnerArr, failed };
}

export function printResults(title: string, files: string[]) {
  if (!files.length) return;

  info(title);
  files.forEach(file => info(file));
}
