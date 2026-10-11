# Web

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

## Development server

To start a local development server, run:

```bash
npm start
```

The npm scripts inject `API_URL` through Angular CLI's `--define` option. A supplied environment variable always takes precedence. Development commands (`npm start`, `npm run watch`, or `npm run build -- --configuration development`) use the tracked `.env` value, `http://127.0.0.1:8000`, only when `API_URL` is unset. To use another backend:

```bash
API_URL=https://api.example.com npm start
```

Running `ng serve` or `ng build` directly bypasses this configuration; use the npm scripts.

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

Supply the deployment backend URL at build time:

```bash
API_URL=https://api.example.com npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

Production builds never read `.env` and fail if `API_URL` is missing or blank. Use an absolute HTTP(S) backend base URL without a trailing slash; services append `/api/stops`, `/api/search/...`, and `/api/seats`. Relative URLs are not supported by this setup. For a same-origin deployment, supply the public site origin and configure the web server to proxy `/api/*` to the backend. For a separate API origin, configure backend CORS for the frontend origin.

`API_URL` is public and embedded in JavaScript bundles, not read at runtime. Configure it in the CI/build environment and rebuild when it changes.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

Run the dependency-free build configuration regression checks with:

```bash
npm run test:config
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
