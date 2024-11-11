import type { GitHubService } from "../github-service";
import type { Handler } from "./index";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createOrUpdatePrComment(_noOwnerArr: string[]) {
    return Promise.resolve();
  }
}
