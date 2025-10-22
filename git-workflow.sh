#!/bin/bash

# Git Workflow Script with Permission Prompts
# This script enforces asking for permission before git add, commit, and push operations.

set -e  # Exit on any error

echo "=== Git Workflow Permission Check ==="

# Step 1: Ask permission for git add
echo "Step 1: Do you want to stage changes with 'git add .'? (y/n)"
read -r add_answer
if [[ "$add_answer" != "y" && "$add_answer" != "Y" ]]; then
    echo "Aborting workflow."
    exit 1
fi

# Perform git add
git add .
echo "Changes staged."

# Step 2: Ask permission for commit message
echo "Step 2: Enter commit message:"
read -r commit_message
if [[ -z "$commit_message" ]]; then
    echo "Commit message cannot be empty. Aborting."
    exit 1
fi

echo "Do you approve this commit message: '$commit_message'? (y/n)"
read -r commit_answer
if [[ "$commit_answer" != "y" && "$commit_answer" != "Y" ]]; then
    echo "Aborting workflow."
    exit 1
fi

# Perform git commit
git commit -m "$commit_message"
echo "Committed successfully."

# Step 3: Ask permission for git push
echo "Step 3: Do you want to push changes? (y/n)"
read -r push_answer
if [[ "$push_answer" != "y" && "$push_answer" != "Y" ]]; then
    echo "Push skipped. Workflow complete."
    exit 0
fi

# Perform git push
echo "Pushing to origin..."
git push
echo "Pushed successfully."

echo "Workflow complete."
