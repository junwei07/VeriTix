Base URL (dev):

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Vite proxy: `/api/*` -> `http://localhost:4000/api/*`

## Health

### GET /health

Returns server status.

Response 200:

```json
{ "status": "ok" }
```
