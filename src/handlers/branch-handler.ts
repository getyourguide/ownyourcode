import type { GitHubService } from "../github-service.ts";
import type { Handler } from "./index.ts";

export class BranchHandler implements Handler {
  constructor(
    private githubService: GitHubService,
    private branch: string,
  ) {}

  async getCodeOwnersFile(filePath: string) {
    const ref = `refs/heads/${this.branch}`;
    return await this.githubService.getCodeOwnersFile(ref, filePath);
  }

  async getChangedFiles() {
    return await this.githubService.getAllFiles(this.branch);
  }

  async createOrUpdatePrComment(noOwnerArr: string[]) {
    return Promise.resolve();
  }
}
