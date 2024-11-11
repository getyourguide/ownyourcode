import { GitHubService } from "./github-service";
import { describe, vi, it, expect, beforeEach } from "vitest";
import type { Octokit } from "./main";

// Mock Octokit methods
vi.mock("@actions/github");
vi.mock("@octokit/rest");

describe("GitHubService", () => {
  let githubService: GitHubService;
  let mockOctokit: Octokit;

  // Mock owner, and repo for testing
  const owner = "getyourguide";
  const repo = "actions";

  beforeEach(() => {
    mockOctokit = {
      rest: {
        repos: {
          getContent: vi.fn().mockResolvedValue({
            data: {
              type: "file",
              content: Buffer.from("__FILE-CONTENTS__", "utf-8").toString(
                "base64",
              ),
            },
          }),
        },
      },
    } as unknown as Octokit;
    githubService = new GitHubService(mockOctokit, owner, repo);
  });

  it("getCodeOwnersFile finds the support", async () => {
    const supportName = await githubService.getCodeOwnersFile(
      "refs/main",
      "./CODEOWNERS.md",
    );
    expect(supportName).toEqual("__FILE-CONTENTS__");
  });

  it("getCodeOwnersFile should throw in case wrong path", async () => {
    const mockGetMethod = vi.spyOn(mockOctokit.rest.repos, "getContent");
    mockGetMethod.mockRejectedValueOnce("some error");
    await expect(
      githubService.getCodeOwnersFile("refs/pr/25", "./WRONG-PATH"),
    ).rejects.toThrowError(
      `Error reading the CODEOWNERS file getyourguide/actions/./WRONG-PATH\nMake sure the file exists and the github token has access to the repo`,
    );
  });
});
