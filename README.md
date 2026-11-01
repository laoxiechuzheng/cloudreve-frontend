Requirements ledger: [REQUIREMENTS.md](REQUIREMENTS.md), maintained privately and excluded from public Git.

# Cloudreve Custom Frontend (3.8.3)

This fork starts from `5d4d01a797a1ba2d6866799684bf05de20006e31`, the frontend pinned by Cloudreve 3.8.3. It preserves existing APIs, permissions and URL formats while sharing a coherent visual system across the file manager, authentication, settings and administration.

- `public/share-ui/`: accepted download-focused share page, loaded only for `/s/:id`; `?classic=1` and preview routes keep the application UI.
- `src/index.js`: small route entry; `src/application.js`: the original application initialization.
- `src/theme.js`: shared light/dark theme and existing preference compatibility.
- `src/component/FileManager/`: file workflows and directory filtering.
- `public/service-worker.js`: retires legacy Workbox caches without caching private pages.

Use the backend fork's **Custom build** GitHub Actions workflow to build and package this exact submodule revision. Application dependency versions remain locked in `yarn.lock`.

```sh
corepack prepare yarn@1.22.22 --activate
yarn install --frozen-lockfile --ignore-engines
node --test scripts/*.test.cjs
yarn test --watchAll=false --runInBand
CI=false GENERATE_SOURCEMAP=false NODE_OPTIONS=--openssl-legacy-provider yarn build
```

The legacy build toolchain can emit upstream deprecation/lint warnings. Tests and build errors must still be resolved. No production data, private settings or credentials belong in this repository.

## Upstream Development Notes

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
