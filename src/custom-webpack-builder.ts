import {CustomWebpackBuilderConfig} from "./custom-webpack-builder-config";
import {Configuration} from "webpack";
import {getSystemPath, Path} from '@angular-devkit/core';
import * as fs from "fs";

export const defaultWebpackConfigPath = 'webpack.externals.js';
let entryPointPath: string;
export class CustomWebpackBuilder {
    static buildWebpackConfig(root: Path,
      config: CustomWebpackBuilderConfig,
      baseWebpackConfig: Configuration,
      buildOptions: any): Configuration {
        if (!config) {
            return baseWebpackConfig;
        }
        const webpackConfigPath = config.path || defaultWebpackConfigPath;
        const customWebpackConfig = require(`${getSystemPath(root)}/${webpackConfigPath}`);
        baseWebpackConfig.externals = customWebpackConfig;
        patchWebpackConfig( baseWebpackConfig, buildOptions );
        return baseWebpackConfig;
    }
}

function patchWebpackConfig(config: Configuration, options: any) {
    const { pluginName, sharedLibs } = options;
  
    // Make sure we are producing a single bundle
    delete config.entry['polyfills'];
    delete config.entry['polyfills-es5'];
    delete config.optimization.runtimeChunk;
    delete config.optimization.splitChunks;
    delete config.entry['styles'];
  
    if (sharedLibs) {
      const externals: any[] = [config.externals];
      const sharedLibsArr    = sharedLibs.split(",");
      sharedLibsArr.forEach(sharedLibName => {
        const            factoryRegexp     = new RegExp(`${sharedLibName}.ngfactory$`);
        externals[0][sharedLibName] = sharedLibName;                            // define external for code
        externals.push((context:any, request:string, callback:any) => {
          if (factoryRegexp.test(request)) {
            return callback(null, sharedLibName); // define external for factory
          }
          callback();
        });
      });
    }
  
    const ngCompilerPluginInstance = config.plugins.find(
      x => x.constructor && x.constructor.name === "AngularCompilerPlugin"
    );
    if (ngCompilerPluginInstance) {
      ngCompilerPluginInstance[ '_entryModule' ] = options.modulePath;
    }
  
    // preserve path to entry point
    // so that we can clear use it within `run` method to clear that file
    entryPointPath = config.entry['main'][0];
  
    const [modulePath, moduleName] = options.modulePath.split("#");
  
    const factoryPath = `${
      modulePath.includes(".") ? modulePath: `${modulePath}/${modulePath}`
    }.ngfactory`;
    const entryPointContents = `
         export * from '${modulePath}';
         export * from '${factoryPath}';
         import { ${moduleName}NgFactory } from '${factoryPath}';
         export default ${moduleName}NgFactory;
      `;
    patchEntryPoint(entryPointContents);
  
    config.output.filename      = `${pluginName}.js`;
    config.output.library       = pluginName;
    config.output.libraryTarget = "umd";
    // workaround to support bundle on nodejs
    config.output.globalObject = `(typeof self !== 'undefined' ? self : this)`;
  }

  function patchEntryPoint(contents: string) {
    fs.writeFileSync(entryPointPath, contents);
  }