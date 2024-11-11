import { describe, expect, it, vi } from "vitest";
import { BranchHandler } from "./branch-handler";
import { GitHubService } from "../github-service";

describe("PrHandler", () => {
  const githubService = {
    getCodeOwnersFile: vi.fn(),
    getChangedFiles: vi.fn(),
    getAllFiles: vi.fn(),
  } as unknown as GitHubService;

  it("should call getAllFiles with branch", async () => {
    const handler = new BranchHandler(githubService, "main");
    await handler.getChangedFiles();
    expect(githubService.getAllFiles).toHaveBeenCalledWith("main");
  });

  it("should call getCodeOwnersFile with correct ref", async () => {
    const handler = new BranchHandler(githubService, "main");
    await handler.getCodeOwnersFile("file/path");
    expect(githubService.getCodeOwnersFile).toHaveBeenCalledWith(
      "refs/heads/main",
      "file/path",
    );
  });
});
