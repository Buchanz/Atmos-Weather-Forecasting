import { searchCities } from "../shared/cities.js";
export function createSuggestionHandler() {
  return async (req, res) => {
    const query = (
      new URL(req.url, "http://localhost").searchParams.get("q") || ""
    ).trim();
    const valid = query.length >= 2 && query.length <= 100;
    res.writeHead(valid ? 200 : 400, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify(
        valid
          ? searchCities(query)
          : { message: "Enter between 2 and 100 characters." },
      ),
    );
  };
}
