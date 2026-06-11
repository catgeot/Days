import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FLIGHT_BOOKING_OVERRIDES } from './data/flight-booking-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotFlightBookings.json');

function main() {
  const spots = { ...FLIGHT_BOOKING_OVERRIDES };
  const payload = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      spotCount: Object.keys(spots).length,
    },
    spots,
  };

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} (${payload.meta.spotCount} spots)`);
}

main();
