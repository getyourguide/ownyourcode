import { describe, expect, it } from "vitest";
import { CodeOwners } from "./codeowners.ts";

const codeownersPath = "./CODEOWNERS";
const CodeOwnersFile = `
* @getyourguide/den

# Make sure all actions are owned by a team
airflow-rest-client            @getyourguide/cdp
build-version                  @getyourguide/den
coverage-guard                 @getyourguide/tp
own-your-code                  @getyourguide/tp
compass-analyzer               @getyourguide/tpna
path/to/file/                  @getyourguide/tp
packages/commons/utils/**tests**/query-params.test.ts @getyourguide/tp
*bundles*                      @getyourguide/ce
`;

describe("CodeOwnersFile.isCovered", () => {
  it.each([
    "/path/to/file/index.ts",
    "own-your-code/index.ts",
    "packages/commons/utils/__tests__/query-params.test.ts",
    "packages/bundles/test.ts",
  ])("should return true for %s", file => {
    const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
    expect(codeowners.isCovered(file)).toBe(true);
  });

  it.each(["docs/api.md", "to/file/index.ts"])(
    "should return false if file does not have owner",
    file => {
      const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
      expect(codeowners.isCovered(file)).toBe(false);
    },
  );

  it.each(["CODEOWNERS", "CUSTOMOWNERS"])(
    "should return true for CODEOWNERS file",
    path => {
      const codeowners = new CodeOwners(CodeOwnersFile, path);
      expect(codeowners.isCovered(path)).toBe(true);
    },
  );
});

it("should handle file using tabs only", () => {
  const CodeOwnersFile = `
    * @getyourguide/den
    airflow-rest-client\t\t\t\t\t@getyourguide/cdp
    */test-file										@getyourguide/cdp
  `;
  const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
  expect(codeowners.isCovered("airflow-rest-client")).toBe(true);
  expect(codeowners.isCovered("path/test-file")).toBe(true);
});

it("should handle files starting with /", () => {
  const CodeOwnersFile = `
    *               @getyourguide/den
    /root-file.ts   @getyourguide/cdp
  `;
  const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
  expect(codeowners.isCovered("root-file.ts")).toBe(true);
  expect(codeowners.isCovered("/root-file.ts")).toBe(true);
});

it("should handle globs correctly", () => {
  const CodeOwnersFile = `
    *               @getyourguide/den
    **/*.ts         @getyourguide/tp
    *.js            @getyourguide/tp
    some-folder/*.css  @getyourguide/tp
  `;
  const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
  expect(codeowners.isCovered("/some-path/file.ts")).toBe(true);
  expect(codeowners.isCovered("/some-path/file.js")).toBe(true);
  expect(codeowners.isCovered("/file.css")).toBe(false);
  expect(codeowners.isCovered("/some-folder/file.css")).toBe(true);
});

it("should allow files without owner", () => {
  const CodeOwnersFile = `
    *               @getyourguide/den
    file-no-owner.ts
  `;
  const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
  expect(codeowners.isCovered("file-no-owner.ts")).toBe(true);
});

describe("CodeOwnersFile.bulkIsCovered", () => {
  it("should return an array of booleans for each file", () => {
    const codeowners = new CodeOwners(CodeOwnersFile, codeownersPath);
    const files = [
      "path/to/file/index.ts",
      "own-your-code/index.ts",
      "docs/api.md",
      "to/file/index.ts",
    ];
    expect(codeowners.bulkIsCovered(files)).toEqual([true, true, false, false]);
  });
});
