export { PrHandler } from "./pr-handler.ts";
export { BranchHandler } from "./branch-handler.ts";

export interface Handler {
  getCodeOwnersFile(filePath: string): Promise<string>;
  getChangedFiles(): Promise<string[]>;
  createOrUpdatePrComment(noOwnerArr: string[]): Promise<void>;
}
