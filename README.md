# Budget Planner

A beginner-friendly personal budget planner built with HTML, CSS and JavaScript.

## Features

- Add income and expenses
- Categorize expenses
- Filter dashboard by month
- Calculate income, expenses, balance and savings rate
- Set a savings goal with progress bar
- Expense category doughnut chart
- Six-month income vs expense chart
- Overspending alerts
- Monthly summary
- Delete transactions
- Export selected-month transactions to CSV
- Responsive design for desktop and mobile
- Uses browser localStorage, so no backend/database is required

## Project structure

```text
budget-planner/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Run locally

Open `index.html` in a modern browser.

For a local development server, VS Code users can use a Live Server extension, or run a simple local server if Python is installed:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

1. Create a public GitHub repository, for example `budget-planner`.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md`.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Click **Save**.
7. Wait for the deployment to finish, then open the Pages URL shown by GitHub.

## Important data note

This demo stores transactions in the browser's `localStorage`. The transactions are not stored in the GitHub repository.

Do not put passwords, bank account numbers, card numbers, API keys, or other private information into a public repository.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js loaded from jsDelivr CDN
- Browser localStorage
