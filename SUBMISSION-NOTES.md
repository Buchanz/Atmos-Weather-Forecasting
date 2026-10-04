# Submission notes

Live website: https://buchanz.github.io/Atmos-Weather-Forecasting/

Repository: https://github.com/Buchanz/Atmos-Weather-Forecasting

## Included features

React components and hooks; live OpenWeatherMap current conditions and five-day forecast; city search and location access; Celsius/Fahrenheit and wind-unit conversion; loading/error handling; responsive CSS and transitions; Node backend; setup instructions and photo credits.

## Validation

20 automated tests pass. Formatting and production build pass. Interactive testing on the student's phone and desktop is still recommended; automated checks do not guarantee a grade.

## Coverage and limitations

This submission contains 243 selectable cities across 91 countries and territories, including all 13 Canadian provincial and territorial capitals. The larger worldwide expansion target is not completed. Location permission chooses the nearest supported city, which may be some distance away. On the dashboard, suggested distances are from the currently selected city; before a city is selected, location-based suggestions use the user's device location. Photos are city views, not live weather images.

Render's free backend can take longer to respond after inactivity. Five-day summaries are aggregated from three-hour forecast intervals; partial days are labelled.

See README.md to run the source. The ZIP deliberately excludes personal environment files, Git history, dependencies, and generated builds.
