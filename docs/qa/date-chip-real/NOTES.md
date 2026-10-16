# date-chip-real captures

- Capture base: http://127.0.0.1:5194
- Seoul calendar day: 20261016
- seoul custom range 20261017–20261018
- gangneung custom range 20261017–20261018
- jeju custom range 20261017–20261018
- Root cause (Gangneung/Jeju custom-range QA): CSS `transition-all` on filter chips — class/aria updated immediately but painted fill lagged ~150ms; capture script now waits on computed background. Chips use `transition-none` for instant active fill.
- Recaptured gangneung-custom-range.png, jeju-custom-range.png after fix (WebKit 390).
