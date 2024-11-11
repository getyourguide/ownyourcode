import { describe, it, vi, expect, beforeAll, afterEach } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { run } from "./main.ts";
import { BranchHandler, PrHandler } from "./handlers/index.ts";

vi.mock("./handlers/index.ts");
vi.mock("@actions/core");

const mockLog = vi.spyOn(core, "info");
const parseOutput = (input: string) =>
  input.trim().replace(/^\s+/gm, match => match.replace(/ /g, ""));
const mockSetOutput = vi.spyOn(core, "setOutput").mockImplementation(() => {});
// Mock github context
vi.spyOn(github.context, "repo", "get").mockImplementation(() => {
  return {
    owner: "getyourguide",
    repo: "actions",
  };
});

describe("OwnYourCode - PR Mode", () => {
  const inputs: Record<string, string> = {
    GITHUB_TOKEN: "token-123",
    CODEOWNERS_PATH: "./CODEOWNERS.md",
    FAIL_ON_MISSING_CODEOWNERS: "true",
    PR_NUMBER: "23",
  };

  beforeAll(() => {
    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      return inputs[name];
    });
    vi.spyOn(core, "getBooleanInput").mockImplementation((name: string) => {
      return inputs[name] === "true";
    });
    mockSetOutput.mockClear();
  });
  afterEach(() => {
    mockLog.mockClear();
  });

  it("should log files missing codeowners", async () => {
    vi.spyOn(PrHandler.prototype, "getCodeOwnersFile").mockResolvedValueOnce(
      "__FILE-CONTENT__",
    );
    vi.spyOn(PrHandler.prototype, "getChangedFiles").mockResolvedValueOnce([
      "README.md",
      "docs/api.md",
      "src/index.ts",
    ]);

    await run();

    const output = mockLog.mock.calls
      .map(call => call[0])
      .join("\n")
      .trim();

    expect(output).toEqual(
      parseOutput(`
       ----------- OwnYourCode ----------
        Repo: actions
        File: ./CODEOWNERS.md
        Fail on missing: true
        Mode: Check PR changed files
        PR: #23
       ----------------------------------

       List of files not covered ❌
       README.md
       docs/api.md
       src/index.ts
    `),
    );
  });

  it("should log files with valid codeowners", async () => {
    vi.spyOn(PrHandler.prototype, "getCodeOwnersFile").mockResolvedValueOnce(
      "README.md @getyourguide/tp",
    );
    vi.spyOn(PrHandler.prototype, "getChangedFiles").mockResolvedValueOnce([
      "README.md",
    ]);

    await run();

    const output = mockLog.mock.calls
      .map(call => call[0])
      .join("\n")
      .trim();

    expect(output).toEqual(
      parseOutput(`
       ----------- OwnYourCode ----------
        Repo: actions
        File: ./CODEOWNERS.md
        Fail on missing: true
        Mode: Check PR changed files
        PR: #23
       ----------------------------------

       List of covered files ✅
       README.md
    `),
    );
  });

  it("should fail if files have no owners", async () => {
    vi.spyOn(PrHandler.prototype, "getCodeOwnersFile").mockResolvedValueOnce(
      "README.md @getyourguide/tp",
    );
    vi.spyOn(PrHandler.prototype, "getChangedFiles").mockResolvedValueOnce([
      "docs/api.md",
      "src/index.ts",
    ]);
    const mockSetFailed = vi.spyOn(core, "setFailed");

    await run();
    expect(mockSetFailed).toHaveBeenCalledWith(
      "Some files do not have an owner, please define one in CODEOWNERS file",
    );
  });

  it("should fail if CODEOWNERS file is not present", async () => {
    const mockGetCodeOwnersFile = vi
      .spyOn(PrHandler.prototype, "getCodeOwnersFile")
      .mockRejectedValueOnce(new Error("CODEOWNERS file not present"));
    const mockSetFailed = vi.spyOn(core, "setFailed");

    await run();
    expect(mockGetCodeOwnersFile).toHaveBeenCalledWith("./CODEOWNERS.md");
    expect(mockSetFailed).toHaveBeenCalledWith(
      "OwnYourCode action failed: CODEOWNERS file not present",
    );
  });

  it("should not fail if files have no owners but fail-on-missing-codeowners input is false", async () => {
    inputs.FAIL_ON_MISSING_CODEOWNERS = "false";
    vi.spyOn(PrHandler.prototype, "getCodeOwnersFile").mockResolvedValueOnce(
      "__FILE-CONTENT__",
    );
    vi.spyOn(PrHandler.prototype, "getChangedFiles").mockResolvedValueOnce([
      "README.md",
      "docs/api.md",
      "src/index.ts",
    ]);
    const mockSetFailed = vi.spyOn(core, "setFailed");

    await run();
    expect(mockSetFailed).not.toHaveBeenCalled();

    // Reset input
    inputs.FAIL_ON_MISSING_CODEOWNERS = "true";
  });
});

describe("OwnYourCode - Branch Mode", () => {
  const inputs: Record<string, string> = {
    GITHUB_TOKEN: "token-123",
    CODEOWNERS_PATH: "./CODEOWNERS.md",
    FAIL_ON_MISSING_CODEOWNERS: "true",
    BRANCH: "main",
  };

  beforeAll(() => {
    vi.spyOn(core, "getInput").mockImplementation((name: string) => {
      return inputs[name];
    });
    vi.spyOn(core, "getBooleanInput").mockImplementation((name: string) => {
      return inputs[name] === "true";
    });
    mockSetOutput.mockClear();
  });
  afterEach(() => {
    mockLog.mockClear();
  });

  it("should log files missing codeowners", async () => {
    vi.spyOn(
      BranchHandler.prototype,
      "getCodeOwnersFile",
    ).mockResolvedValueOnce("__FILE-CONTENT__");
    vi.spyOn(BranchHandler.prototype, "getChangedFiles").mockResolvedValueOnce([
      "README.md",
      "docs/api.md",
      "src/index.ts",
    ]);

    await run();

    const output = mockLog.mock.calls
      .map(call => call[0])
      .join("\n")
      .trim();

    expect(output).toEqual(
      parseOutput(`
       ----------- OwnYourCode ----------
        Repo: actions
        File: ./CODEOWNERS.md
        Fail on missing: true
        Mode: Check all branch files
        Branch: main
       ----------------------------------

       List of files not covered ❌
       README.md
       docs/api.md
       src/index.ts
    `),
    );
  });

  it("should log files with valid codeowners", async () => {
    vi.spyOn(
      BranchHandler.prototype,
      "getCodeOwnersFile",
    ).mockResolvedValueOnce("README.md @getyourguide/tp");
    vi.spyOn(BranchHandler.prototype, "getChangedFiles").mockResolvedValueOnce([
      "README.md",
    ]);

    await run();

    const output = mockLog.mock.calls
      .map(call => call[0])
      .join("\n")
      .trim();

    expect(output).toEqual(
      parseOutput(`
       ----------- OwnYourCode ----------
        Repo: actions
        File: ./CODEOWNERS.md
        Fail on missing: true
        Mode: Check all branch files
        Branch: main
       ----------------------------------

       List of covered files ✅
       README.md
    `),
    );
  });
});
