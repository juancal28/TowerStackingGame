# Tower Stacking Game

A challenging puzzle game where you rearrange colored blocks on towers to match a target configuration. Similar to the Towers of Hanoi, this game tests your strategic thinking and planning skills.

## How to Play

1. Look at the target configuration at the top of the screen
2. Rearrange your towers to match the target by clicking on towers
3. Click a tower to select it (highlighted with a blue outline)
4. Click another tower to move the top block from the selected tower
5. Complete the puzzle in as few moves as possible!

## Features

- Random puzzle generation with 5-12 blocks
- Move counter and optimal move calculation
- Reset button to restart the same puzzle
- New game button for a fresh challenge
- Beautiful, modern UI with smooth interactions

## Hosting on GitHub Pages

This game can be easily hosted on GitHub Pages for free. Follow these steps:

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., `tower-stacking-game`)
4. Choose "Public" (required for free GitHub Pages)
5. **Don't** initialize with README, .gitignore, or license (we'll add these)
6. Click "Create repository"

### Step 2: Push Your Code to GitHub

Open a terminal in this project directory and run:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Tower Stacking Game"

# Add your GitHub repository as remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Click "Save"
7. Wait a few minutes for GitHub to build your site
8. Your game will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Initialize and commit
git init
git add .
git commit -m "Initial commit: Tower Stacking Game"

# Create repository and push (replace REPO_NAME)
gh repo create REPO_NAME --public --source=. --remote=origin --push

# Enable GitHub Pages
gh api repos/YOUR_USERNAME/REPO_NAME/pages -X POST -f source[branch]=main -f source[path]=/
```

## Local Development

To run the game locally, simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (with http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
TowerStacking/
├── index.html      # Main HTML file
├── styles.css      # Stylesheet
├── game.js         # Game logic
└── README.md       # This file
```

## License

Feel free to use this project for learning, personal use, or modify it as needed!

## Credits

Inspired by the Towers of Hanoi puzzle, commonly used in cognitive assessments.

