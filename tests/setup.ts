// Hands are stamped in Pacific time (pacificTimestamp) but date filters parse
// them in the machine's local zone, so the suite only behaves on Pacific
// clocks — pin it for UTC machines like CI containers.
process.env.TZ = 'America/Los_Angeles';

import '@testing-library/jest-dom/vitest';
