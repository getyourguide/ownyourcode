# 📂 OwnYourCode

> A GitHub Action to scan your repository for orphan files. It can be used to
> scan files modified in a PR or globally checking all files in a branch.

## Table of Contents

- [What is OwnYourCode?](#what-is-ownyourcode)
- [How does it work?](#how-does-it-work)
- [Features](#features)
  - [Example comment](#example-comment)
- [API](#api)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
- [Usage](#usage)
  - [Using on a branch](#using-on-a-branch)
  - [Printing the output](#printing-the-output)
- [CODEOWNERS file](#codeowners-file)

## What is OwnYourCode?

OwnYourCode is a GitHub Action that scans your repository for orphan files,
i.e., files that do not have a CODEOWNER assigned to them.

## How does it work?

OwnYourCode uses the CODEOWNERS file in your repository to check if the files
modified in a PR have an owner assigned to them. If a file does not have an
owner, a comment is added to the PR with the list of orphan files.

## Features

- Scan files modified in a PR and post a comment with orphan files
- Update the comment in each PR synchronization
- Scan all files in a branch
- Fail the CI if orphan files are found

### Example comment

<img width="907" alt="image" src="https://github.com/user-attachments/assets/e4047670-685e-4bd1-b474-5dffae590669">

## API

### Inputs

- `github_token`: String - Github Token (required)
- `fail-on-missing-codeowners`: Boolean - Fail CI if there are files without
  owners (default: true)
- `codeowners_path`: String - Path to the codeowners file (default: CODEOWNERS)
- `pr_number`: Number - Scan only the files modified in the PR (optional if
  `branch` is set)
- `branch`: String - Scan all files in the specified branch (optional if
  `pr_number` is set)

### Outputs

- `total_orphan_files`: Number - Total number of orphaned files
- `total_scanned_files`: Number - Total files scanned
- `failed`: Boolean - If the action failed

## Usage

Create a new workflow file in your repository

```sh
touch .github/workflows/own-your-code.yml
```

Add the following content to the file

```yaml
name: Check CODEOWNERS

on:
  # To check the files modified in a PR
  pull_request:
    types: [opened, synchronize]

permissions:
  id-token: write
  contents: read
  pull-requests: write # needed to write comments in PRs

jobs:
  check-codeowners:
    runs-on: ubuntu-latest
    steps:
      - name: Check CODEOWNERS
        id: ownyourcode
        uses: getyourguide/ownyourcode@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          pr_number: ${{ github.event.number }}

      - name: Print Output
        run: |
          echo "${{ steps.ownyourcode.outputs.total_orphan_files }}"
          echo "${{ steps.ownyourcode.outputs.total_scanned_files }}"
          echo "${{ steps.ownyourcode.outputs.failed }}"
```

### Using on a branch

```yaml
name: Check CODEOWNERS

on:
  push:
    branches:
      - main

permissions:
  id-token: write
  contents: read
  pull-requests: write # we need this to write comments in PRs
jobs:
  check-codeowners:
    runs-on: ubuntu-latest
    steps:
      - name: Check CODEOWNERS
        id: ownyourcode
        uses: getyourguide/ownyourcode@checkout-action-repo
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.ref_name }}
```

### Printing the output

```yaml
---
jobs:
  check-codeowners:
    runs-on: ubuntu-latest
    steps:
      - name: Check CODEOWNERS
        id: ownyourcode
        uses: getyourguide/ownyourcode@checkout-action-repo
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.ref_name }}
          fail-on-missing-codeowners: false # important for next step to work

      - name: Print Output
        run: |
          echo "Total orphan files: ${{ steps.ownyourcode.outputs.total_orphan_files }}"
          echo "Total scanned files: ${{ steps.ownyourcode.outputs.total_scanned_files }}"
          echo "Failed: ${{ steps.ownyourcode.outputs.failed }}"
```

## CODEOWNERS file

The CODEOWNERS file should be in the root of your repository and should have the
following format:

```sh
path/to/file @optional-owner @another-optional-owner
```

Root wildcard owners are ignored:

```sh
*              @owner    # this line will be ignored
path/to/*/file @owner    # this line will be considered
```

Files with no owner will **NOT** be considered orphan files.

```sh
path/to/file/without/owner # this is not an orphan file, it has no owner
```
