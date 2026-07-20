# Architecture

The repository uses Bun workspaces. The API is organized by HTTP boundaries (routes,
controllers, middleware) with reusable domain logic in `services`. The mobile app uses
Expo Router for navigation, colocated screens, and small Zustand stores for client state.

Production deployments should run migrations before starting the API and set all secrets
through the hosting platform's environment configuration.
