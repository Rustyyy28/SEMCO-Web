# Upload SEMCO to GitHub

## Publish from VS Code

1. Extract the updated **SEMCO-Prototype.zip**. Open its inner **semco-portal** folder in VS Code.
2. Open **Source Control**. Select **Initialize Repository** if that button appears. An existing repository does not need to be initialized again.
3. In **Terminal → New Terminal**, configure your own Git identity:

   ```bash
   git config user.name "YOUR OWN NAME"
   git config user.email "YOUR GITHUB EMAIL"
   ```

   Use an email linked to your GitHub account, or your GitHub-provided noreply email. Do not use another group member's identity.
4. Review the files, stage them with **+**, enter **Add SEMCO form controls and documentation**, then choose **Commit**.
5. Open the Command Palette: **Command+Shift+P** on Mac or **Ctrl+Shift+P** on Windows. Choose **Publish to GitHub**, sign in, choose the repository name, and select private or public according to your course requirements.
6. Open the resulting GitHub repository. Verify that `dist/`, `tests/`, `docs/`, `engine.py`, `server.py`, `.gitignore`, and the README are visible. Copy its URL for your submission. Give your instructor access if it is private.

VS Code's [official repository guide](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes) explains publishing and remotes. GitHub's [Git setup guide](https://docs.github.com/en/get-started/git-basics/set-up-git) covers installation, identity and authentication.

## If your group already has a repository

Clone that repository using **Git Clone** in VS Code. Copy the extracted project contents into the clone, keeping its existing `.git` folder. Review the changes, commit to a branch, and push. This keeps the existing group history.

## Make each member's contributions visible

1. The owner opens the repository's **Settings → Collaborators → Add people** and invites the group members. Each member accepts. See [GitHub's collaboration instructions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository).
2. Each member clones the repo, sets their own Git name/email, and creates a branch for their real contribution.
3. Each member makes a meaningful change: improve helper text, fix validation, add a test, refine accessibility, or update documentation that they have verified.
4. They stage their changed files, write a specific commit message, push the branch, and open a pull request.
5. Another member reviews the change. Use **Create a merge commit** when available to retain the individual commits. See [GitHub's merge-method explanation](https://docs.github.com/en/pull-requests/reference/pull-request-merges).
6. Before submitting, open the repository's commit history and check that every group member's author name appears. The [commit-email guidance](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions) explains account attribution.

Example commands for one member's actual change:

```bash
git switch -c member-name/profile-validation
git add dist/supporting-forms.js
git commit -m "Improve profile validation feedback"
git push -u origin member-name/profile-validation
```

Change the filename, branch and message to describe what you actually changed. One person uploading all files does not produce contributions from every member. Keep existing history and synchronize before starting the next change.

## Submission files

- Word documentation: `docs/SEMCO_Form_Controls_Documentation.docx`
- Form and error screenshots: `docs/form_screenshots/`
- Source code: the project repository URL
- Video: record your own 2–4-minute demonstration separately

Run locally with `python3 server.py --port 8000`, then open `http://127.0.0.1:8000`. On Windows, `py server.py --port 8000` may be used. GitHub stores the code; uploading does not start the Python server online.
