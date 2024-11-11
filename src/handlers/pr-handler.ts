import type { GitHubService } from "../github-service";
import type { Handler } from "./index";

const COMMENT_HEADER = "## OwnYourCode\n";

export class PrHandler implements Handler {
  constructor(
    private githubService: GitHubService,
    private prNumber: number,
  ) {}

  async getCodeOwnersFile(filePath: string) {
    const ref = `pull/${this.prNumber}/head`;
    return await this.githubService.getCodeOwnersFile(ref, filePath);
  }

  async getChangedFiles() {
    return await this.githubService.getChangedFiles(this.prNumber);
  }

  async createOrUpdatePrComment(noOwnerArr: string[]) {
    const prevComment = await this.githubService.findPreviousComment(
      this.prNumber,
      COMMENT_HEADER,
    );

    if (prevComment) {
      await this.githubService.updateComment(
        prevComment.id,
        this.buildCommentBody(noOwnerArr),
      );
    }
    if (noOwnerArr.length && !prevComment) {
      await this.githubService.createComment(
        this.prNumber,
        this.buildCommentBody(noOwnerArr),
      );
    }
  }

  buildCommentBody(files: string[]) {
    if (!files.length) {
      return `${COMMENT_HEADER}✅ All files have an owner in the CODEOWNERS file. Good job!`;
    }

    return `${COMMENT_HEADER}❌ The following files do not have an owner in the CODEOWNERS file:\n* ${files.join(
      "\n* ",
    )}\n\n**Please assign an owner to these files.**`;
  }
}
