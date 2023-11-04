import chalk from 'chalk';
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

export default class Updater {
    private readonly octokit: Octokit;
    private readonly owner: string;
    private readonly repo: string;
    private readonly pwd: string;

    constructor(owner: string, repo: string, pwd: string) {
        this.octokit = new Octokit();
        this.owner = owner;
        this.repo = repo;
        this.pwd = pwd;
    }

    getCurrentLocalBranch(): string {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: this.pwd }).trim();
        }
        catch(error) {
            console.error('Failed to determine the current branch:', (error as Error).message);
            process.exit(1);
        }
    }
    async getCurrentLocalCommit(branch: string): Promise<string> {
        const response = await this.octokit.git.getRef({
            owner: this.owner,
            repo: this.repo,
            ref: `heads/${ branch }`,
        });

        return response.data.object.sha;
    }

    async getRemoteCommit(branch: string): Promise<string> {
        const response = await this.octokit.repos.getBranch({
            owner: this.owner,
            repo: this.repo,
            branch
        });

        return response.data.commit.sha;
    }

    async checkForUpdates(): Promise<void> {
        const branch = this.getCurrentLocalBranch();
        const localCommit = await this.getCurrentLocalCommit(branch);
        const remoteCommit = await this.getRemoteCommit(branch);

        if(localCommit === remoteCommit) {
            console.log(chalk.green(`Your branch '${ branch }' is up to date.`));
        } 
        else {
            console.warn(chalk.yellow(`Please update the repository, as you are out of date!`));
        }
    }
}