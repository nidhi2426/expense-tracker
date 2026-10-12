# expense-tracker
# Ledger

A personal expense tracker that runs entirely in the browser. Log what you spend, filter it by category and month, and see where the money went. Your data is saved on your own device and never sent anywhere.


## Features

- Add and delete expenses with a description, amount, category and date
- Filter by category and by month
- Doughnut chart showing spending by category (updates with the filters)
- Bar chart showing spending over the last six months
- Data saved in `localStorage`, so it survives refreshes and restarts
- Responsive layout: the list comes first on phones
- Keyboard-friendly, with labelled inputs and visible focus outlines

## Built with

- HTML, CSS and vanilla JavaScript (no framework, no build step)
- [Chart.js](https://www.chartjs.org/) 4.4.1 for the charts

## Run it locally

1. Clone the repo or download it as a ZIP
2. Open `index.html` in your browser

There is nothing to install. An internet connection is needed because Chart.js loads from a CDN.

## How it works

The app keeps one array of expenses as its single source of truth. Every change (add, delete, filter) follows the same loop: update the array, save it to `localStorage`, then call `render()`, which redraws the list and both charts from that array.

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and form |
| `style.css` | Design tokens (colours, fonts) and layout |
| `app.js` | State, filtering, rendering and Chart.js setup |

## Decisions and challenges

- **Charts that respond to filters, except one.** The doughnut follows both filters, but the monthly bar chart ignores the month filter. Otherwise picking a month would leave it with a single bar. `getFiltered()` takes a flag to handle this.
- **Dates and time zones.** Using `toISOString()` for "today" can give yesterday's date in India because it uses UTC. I build the date from the local time zone offset instead.
- **Safe rendering.** Descriptions are inserted with `textContent` rather than `innerHTML`, so anything a user types is treated as plain text and cannot run as code.
- **Versioned storage key.** The key is `ledger.expenses.v1`, so the data format can change later without breaking saved data.

## Possible next steps

- Edit existing expenses
- Export to CSV
- Monthly budget limit with a warning
- Light and dark theme toggle

## Author

Built by NIDHI. [GitHub](https://github.com/nidhi2426) · [LinkedIn](www.linkedin.com/in/nidhi-thota)
