import type { Octokit } from "./main.ts";

export class GitHubService {
  constructor(
    private octokit: Octokit,
    private owner: string,
    private repo: string,
  ) {}

  async getCodeOwnersFile(ref: string, filePath: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        ref,
        path: filePath,
      });
      if (Array.isArray(data) || data.type !== "file") {
        throw new Error(`File not found or is not a regular file: ${filePath}`);
      }
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      return content;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      throw new Error(
        `Error reading the CODEOWNERS file ${this.owner}/${this.repo}/${filePath}\nMake sure the file exists and the github token has access to the repo`,
      );
    }
  }

  async getChangedFiles(prNumber: number): Promise<string[]> {
    const filesList = [];
    const iterator = this.octokit.paginate.iterator(
      this.octokit.rest.pulls.listFiles,
      {
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        per_page: 100,
      },
    );

    for await (const { data: files } of iterator) {
      for (const file of files) {
        if (file.status !== "removed") filesList.push(file.filename);
      }
    }

    return filesList;
  }

  async getAllFiles(branch: string): Promise<string[]> {
    const { data } = await this.octokit.rest.git.getTree({
      recursive: "true",
      owner: this.owner,
      repo: this.repo,
      tree_sha: `refs/heads/${branch}`,
    });

    const files: string[] = [];

    data.tree.forEach(node => {
      if (node.type === "blob" && node.path) {
        files.push(node.path);
      }
    });

    return files;
  }

  async createComment(prNumber: number, body: string): Promise<void> {
    const payload = {
      repo: this.repo,
      owner: this.owner,
      issue_number: prNumber,
      body,
    };
    await this.octokit.rest.issues.createComment(payload);
  }

  async updateComment(commentId: number, body: string): Promise<void> {
    const payload = {
      repo: this.repo,
      owner: this.owner,
      comment_id: commentId,
      body,
    };
    await this.octokit.rest.issues.updateComment(payload);
  }

  async findPreviousComment(prNumber: number, commentHeader: string) {
    const { data } = await this.octokit.rest.issues.listComments({
      repo: this.repo,
      owner: this.owner,
      per_page: 100,
      issue_number: prNumber,
    });
    const comment = data.find(comment =>
      comment.body?.startsWith(commentHeader),
    );
    return comment ? { id: comment.id, content: comment.body } : undefined;
  }
}
