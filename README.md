# Atmos — Weather Forecast

**[Open Atmos Weather →](https://buchanz.github.io/Atmos-Weather-Forecasting/)**

Explore live weather with city photography, current conditions, and a five-day forecast. Atmos runs directly in your browser—no downloads, installation, account, or API key required.

## Using Atmos

1. Open the live website above.
2. Search for a city and select a result. Country names appear beneath each city to help identify the right place.
3. Explore the forecast and weather details, or switch between Celsius and Fahrenheit.

You can also allow location access to find the closest supported city. If you prefer not to share your location, use city search instead. On the dashboard, suggested-city distances are measured from the selected city.

## Features

- Live temperature, weather conditions, humidity, wind, sunrise, and sunset.
- Three-hour forecast intervals and five-day summaries.
- Celsius and Fahrenheit, with corresponding wind-speed units.
- Search suggestions with country labels and keyboard navigation.
- City photographs with photographer and license credits.
- Responsive layouts for desktop and mobile.
- Clear loading and error messages.

## About the project

Atmos is a weather forecasting class project built with React, JavaScript, CSS, and Vite. React components separate search, forecasts, weather details, and backgrounds; custom hooks manage data requests and location state. A Node.js backend retrieves live data from OpenWeather. GitHub Pages hosts the interface, and Render hosts the backend.

The source is organized into `src/components` for interface elements, `src/hooks` for state and requests, `src/services` for weather utilities, `src/data` and `shared` for city information, and `server` for the weather API. Automated checks cover weather conversions, forecasts, request validation, error handling, and credential protection.

## Availability and coverage

The weather service may take a little longer to respond when waking after inactivity. If a request times out, wait briefly and retry.

Search supports the cities in the photo catalog; coverage is not worldwide. See [City coverage](CITY-COVERAGE.md) for the published catalog. Photos show the city, not live weather. Five-day summaries use the available three-hour forecast intervals, and incomplete days are marked.

## Libraries and credits

React and React DOM power the interface; Vite builds the app. Lucide React provides interface icons, Meteocons provides weather icons, and Google Fonts supplies DM Sans and Manrope. CSS handles styling and transitions. Prettier formats the source, and Node’s test runner runs the automated tests.

Weather data is provided by [OpenWeather](https://openweathermap.org/). Photograph sources and licenses are listed in [Photo credits](PHOTO-CREDITS.md). Meteocons licensing is included in [METEOCONS-LICENSE.txt](METEOCONS-LICENSE.txt).

## Project links

- [Live website](https://buchanz.github.io/Atmos-Weather-Forecasting/)
- [GitHub repository](https://github.com/Buchanz/Atmos-Weather-Forecasting)
