# ClipVault

A cloud-native multimedia distribution platform built on Azure.

## Architecture

- **Azure Blob Storage** — stores video, image, and audio files.
- **Azure Cosmos DB** (NoSQL) — stores clip metadata.
- **Azure Logic Apps** — four workflows providing CRUD REST endpoints.
- **Azure App Service** — hosts the static frontend.
- **Azure Application Insights** — monitoring and telemetry.

## Local development

```bash

python3 -m http.server 8080
```

Open http://localhost:8080.

## Author

Sabbir Ahmed