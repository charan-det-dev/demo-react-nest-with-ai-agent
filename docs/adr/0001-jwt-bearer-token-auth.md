# JWT via Authorization header (Bearer token)

The frontend and backend are separate services communicating over HTTP. We considered three options: JWT in an httpOnly cookie, JWT as a Bearer token in the `Authorization` header (stored client-side in `localStorage`), and server-side sessions. We chose the Bearer token approach: the frontend stores the JWT itself and attaches it to every API request.

This trades XSS resistance (an httpOnly cookie can't be read by injected scripts; `localStorage` can) for simplicity — no CSRF protection is needed, and the backend stays stateless without needing a session store like Redis. This choice matters if the frontend ever renders untrusted content, since a successful XSS there would expose the token.
