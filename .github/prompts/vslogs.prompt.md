---
mode: agent
---
1. Add detailed debug logging to the console at key execution points to capture internal states and data object values.

2. Add equivalent debug logging through the NLog silentLogging service to provide a centralized record of the same information.

3. Ensure each log entry is clearly tagged as temporary (e.g., with a prefix like [TEMP-DEBUG]) so they can be easily located later.

4. Keep the implementation consistent and minimal so these temporary logs can be safely removed once debugging is complete.