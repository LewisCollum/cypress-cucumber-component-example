import { IPreprocessorConfiguration } from "@badeball/cypress-cucumber-preprocessor/lib/preprocessor-configuration";
import { startDevServer } from "@cypress/webpack-dev-server";
import webpackPreprocessor from "@cypress/webpack-preprocessor";
import webpack from "webpack";
import fs from "fs";


/*
 * For component testing, a dev server is spawned, allowing us to
 * mount React components in test. For integration testing, we have to
 * start the application first, and then visit the webpage in test.
 */
export default (on: Cypress.PluginEvents, cypressConfig: Cypress.PluginConfigOptions): void => {
    writeCucumberPreprocessorConfigWithCypress(cypressConfig);
    const webpackConfig = makeWebpackConfigWithCypress(cypressConfig);

    if (cypressConfig.testingType === "component") {
        on("dev-server:start", (options) => startDevServer({ options, webpackConfig }));
    } else if (cypressConfig.testingType === "e2e") {
        on("file:preprocessor", webpackPreprocessor({webpackOptions: webpackConfig}));
    }
}

/*
 * Pass the cypress config to the cucumber preprocessor for feature
 * files. Since currently the cucumber preprocessor only uses the
 * integrationFolder (and not the componentFolder) we have a hack to
 * replace the folder with the component folder when component
 * testing.
 */
function makeWebpackConfigWithCypress(cypressConfig: Cypress.PluginConfigOptions): webpack.Configuration {
    if (cypressConfig.testingType === "component") {
        cypressConfig.integrationFolder = cypressConfig.componentFolder as string;
    }
    
    return {
        resolve: {
            extensions: [".ts", ".js", ".tsx", ".jsx"],
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    exclude: [/node_modules/],
                    use: [{ loader: "ts-loader" }],
                },
                {
                    test: /\.feature$/,
                    use: [
                        {
                            loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                            options: cypressConfig,
                        },
                    ],
                },
            ],
        },
    };    
}

/*
 * Write the cypress-cucumber-preprocessor config to set the location
 * of Cucumber step definitions based on whether we are running
 * component or integration tests. This is a hack, as the preprocessor
 * should be responsible for distinguishing between component and
 * integration step definitions.
 */
function writeCucumberPreprocessorConfigWithCypress(cypressConfig: Cypress.PluginConfigOptions): void {
    type TestTypeLookup = {
        [key in Cypress.TestingType]: string;
    }

    const relativeComponentFolder = cypressConfig.componentFolder.toString().replace(cypressConfig.projectRoot, "");
    const relativeIntegrationFolder = cypressConfig.integrationFolder.replace(cypressConfig.projectRoot, "");

    const stepDefinitionDirectoryLookup : TestTypeLookup = {
        component: relativeComponentFolder,
        e2e: relativeIntegrationFolder
    };

    const directory = stepDefinitionDirectoryLookup[cypressConfig.testingType]
    const preprocessorConfig : IPreprocessorConfiguration = {
        stepDefinitions: `${directory}/**/*.{js,ts,tsx,jsx}`
    }
    
    fs.writeFileSync(".cypress-cucumber-preprocessorrc.json", JSON.stringify(preprocessorConfig));
}
