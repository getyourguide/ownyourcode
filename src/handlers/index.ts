export { PrHandler } from "./pr-handler";
export { BranchHandler } from "./branch-handler";

export interface Handler {
  getCodeOwnersFile(filePath: string): Promise<string>;
  getChangedFiles(): Promise<string[]>;
  createOrUpdatePrComment(noOwnerArr: string[]): Promise<void>;
}
