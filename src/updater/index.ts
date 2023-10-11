import chalk from 'chalk';
import { execSync } from 'node:child_process';

/**
 * Utility class to get information from Git.
 */
class GitInfo {
    private readonly _repoPath: string;
    constructor(repoPath: string) {
        this._repoPath = repoPath;
    }

    public getCurrentCommit() {
        return this.executeGitCommand('rev-parse HEAD');
    }

    public getRemoteLastCommit() {
        return this.executeGitCommand('ls-remote --quiet --heads origin');
    }

    public getCommitCountBetween(currentCommit: string, remoteLastCommit: string) {
        return this.executeGitCommand(`rev-list ${ currentCommit }..${ remoteLastCommit } --count`);
    }

    public getCommitDate(commit: string) {
        return this.executeGitCommand(`log -n 1 --format=%ct ${ commit }`);
    }

    private executeGitCommand(command: string): string | null {
        try {
            const result = execSync(`git --git-dir=${ this._repoPath }/.git --work-tree=${ this._repoPath } ${ command }`, {
                encoding: 'utf8',
                cwd: this._repoPath,
            });
            return result.trim();
        }
        catch(error) {
            console.error('Error executing Git command:', (error as Error).message);
            return null;
        }
    }
}

export default class Updater {
    // @ts-expect-error If we are not warning, we don't care; so we can disregard the warning.
    private readonly _path: string;
    // @ts-expect-error If we are not warning, we don't care; so we can disregard the warning.
    private readonly _gitInfo: GitInfo;

    public constructor(path: string, warn: boolean) {
        if(!warn) {
            return;
        }

        this._path = path;
        this._gitInfo = new GitInfo(this._path);
        this.warn(this.getMessage());
    }

    private getMessage(): string {
        // const current = this._gitInfo.getCurrentCommit()!;
        const current = '428977dc829188af75530900600b29c54eb18060'; // TODO: replace with normal statement once testing is done
        const last = this._gitInfo.getRemoteLastCommit()!;
        const lastData = this._gitInfo.getCommitDate(last)!;
        const lastDate = new Date(Number(lastData) * 1000);
        const difference = this._gitInfo.getCommitCountBetween(current, last);

        // holy aids.
        const message =
            `
${ chalk.bgRed(chalk.white(`You are ${ difference } commits behind! Please consider updating.`)) }
${ chalk.bgRed(chalk.white(`The last commit was on ${ lastDate.toLocaleDateString() } at ${ lastDate.toLocaleTimeString() }`)) }
`;

        return message;
    }

    private warn(message: string): void {
        const terminalWidth = process.stdout.columns;
        const line = chalk.gray('-'.repeat(terminalWidth ? terminalWidth - 1 : 16));

        console.warn(`${ line }\n\n${ message }\n\n${ line }`);
    }
}