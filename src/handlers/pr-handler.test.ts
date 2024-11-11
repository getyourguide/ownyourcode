import { describe, expect, it, vi, Mocked, afterEach } from "vitest";
import { PrHandler } from "./pr-handler.ts";
import { GitHubService } from "../github-service.ts";

describe("PrHandler", () => {
  const githubService = {
    getCodeOwnersFile: vi.fn(),
    getChangedFiles: vi.fn(),
    findPreviousComment: vi.fn(),
    createComment: vi.fn(),
    updateComment: vi.fn(),
  } as unknown as Mocked<GitHubService>;

  afterEach(() => {
    githubService.createComment.mockClear();
  });

  it("should call getChangedFiles with prNumber", async () => {
    const handler = new PrHandler(githubService, 25);
    await handler.getChangedFiles();
    expect(githubService.getChangedFiles).toHaveBeenCalledWith(25);
  });

  it("should call getCodeOwnersFile with correct ref", async () => {
    const handler = new PrHandler(githubService, 25);
    await handler.getCodeOwnersFile("file/path");
    expect(githubService.getCodeOwnersFile).toHaveBeenCalledWith(
      "pull/25/head",
      "file/path",
    );
  });

  it("createOrUpdatePrComment should comment on missing codeowners", async () => {
    githubService.findPreviousComment.mockResolvedValueOnce(undefined);

    const handler = new PrHandler(githubService, 25);
    await handler.createOrUpdatePrComment(["Readme.md"]);
    expect(githubService.createComment).toHaveBeenCalledWith(
      25,
      expect.any(String),
    );
  });

  it("createOrUpdatePrComment should not comment on valid codeowners", async () => {
    githubService.findPreviousComment.mockResolvedValueOnce(undefined);

    const handler = new PrHandler(githubService, 25);
    await handler.createOrUpdatePrComment([]);
    expect(githubService.createComment).not.toHaveBeenCalled();
  });

  it("createOrUpdatePrComment should update previous comment", async () => {
    githubService.findPreviousComment.mockResolvedValueOnce({
      id: 20,
      content: "some old comment",
    });

    const handler = new PrHandler(githubService, 25);
    await handler.createOrUpdatePrComment(["Readme.md"]);
    expect(githubService.updateComment).toHaveBeenCalledWith(
      20,
      expect.any(String),
    );
  });

  it("createOrUpdatePrComment should update comment on valid codeowners", async () => {
    githubService.findPreviousComment.mockResolvedValueOnce({
      id: 20,
      content: "some old comment",
    });

    const handler = new PrHandler(githubService, 25);
    await handler.createOrUpdatePrComment([]);
    expect(githubService.updateComment).toHaveBeenCalledWith(
      20,
      expect.any(String),
    );
  });
});
