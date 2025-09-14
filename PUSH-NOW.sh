#!/bin/bash
# Replace 'yourusername' with your actual GitHub username
echo "🚀 Pushing Devorch Suite to GitHub..."

# Add remote (replace yourusername!)
git remote add origin https://github.com/yourusername/devorch-suite.git

# Push to GitHub
git branch -M main
git push -u origin main

echo "✅ Successfully pushed to GitHub!"
echo "🎉 Your hackathon submission is live!"