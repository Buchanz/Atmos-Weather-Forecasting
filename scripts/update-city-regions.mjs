import { readFileSync, writeFileSync } from "node:fs";
import { scenes } from "../src/data/scenes.js";
const targets = JSON.parse(readFileSync(new URL("./data/coverage-targets.json", import.meta.url)));
const norm = s => String(s).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const regions = Object.fromEntries(scenes.map(scene => {
  const target = targets.find(t => t.country === scene.country && Math.abs(t.lat-scene.lat)<0.4 && Math.abs(t.lon-scene.lon)<0.4 && (scene.aliases.includes(norm(t.name)) || scene.aliases.includes(norm(t.ascii))));
  const region = target?.region || (scene.country === "CA" && ["North Vancouver", "New Westminster", "Richmond", "Burnaby", "Surrey", "Delta", "Kelowna"].includes(scene.name) ? "British Columbia" : "");
  return [scene.id, region];
}));
writeFileSync(new URL("../src/data/cityRegions.js", import.meta.url), "// Regional names from GeoNames, CC BY 4.0. See CITY-COVERAGE.md.\nexport const cityRegions = " + JSON.stringify(regions, null, 2) + ";\n");
