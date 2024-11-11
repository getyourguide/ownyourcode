import globToRegExp from "glob-to-regexp";
import { escapeRegex } from "./utils.ts";

type Rule = [RegExp, string];
export class CodeOwners {
  private ruleset: Rule[];
  private codeownersPath: string;

  constructor(codeowners: string, codeownersPath: string) {
    this.ruleset = codeowners
      .split("\n")
      // split the line using spaces/tabs
      .map(line => line.split(/\s+/).filter(part => part))
      // filter out comments, empty lines, and * rules
      .filter(line => line[0] && line[0] !== "#" && line[0] !== "*")
      // convert glob to regexp
      .map(line => {
        const [glob, owner] = line;
        // Remove the / at the start of the globs
        const globNoSlash = glob.replace(/^\/+/, "");
        const regexp = globToRegExp(globNoSlash, {
          globstar: true,
          extended: true,
          flags: "g",
        });

        return [regexp, owner];
      });

    this.codeownersPath = escapeRegex(codeownersPath);
  }

  isCovered(filePath: string): boolean {
    // skip CODEOWNERS file
    if (filePath.match(this.codeownersPath)) return true;

    return this.ruleset.some(rule => {
      if (!rule?.[0]) return false;

      return filePath.match(rule[0]);
    });
  }

  bulkIsCovered(filePaths: string[]): boolean[] {
    return filePaths.map(filePath => this.isCovered(filePath));
  }
}
