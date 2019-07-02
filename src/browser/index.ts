import {
  BrowserBuilderOutput,
  executeBrowserBuilder,
  ExecutionTransformer,
  BrowserBuilderOptions
} from "@angular-devkit/build-angular";
import { JsonObject } from "@angular-devkit/core";
import { createBuilder, BuilderContext } from "@angular-devkit/architect";
import * as fs from "fs";
import { Configuration } from 'webpack';
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";

import { CustomWebpackSchema } from '../custom-webpack-schema';

import { getTransforms } from '../common';
import { CustomWebpackBuilder } from "../custom-webpack-builder";

export type CustomWebpackBrowserSchema = BrowserBuilderOptions & CustomWebpackSchema;

let entryPointPath: string;

function buildPlugin(
  options   : CustomWebpackBrowserSchema,
  context   : BuilderContext,
  transforms: {
    webpackConfiguration?: ExecutionTransformer<Configuration>;
  } = {}
): Observable<BrowserBuilderOutput> {
  options.deleteOutputPath = false;

  validateOptions(options);

  const originalWebpackConfigurationFn  = getTransforms( options, context ).webpackConfiguration;
    transforms.webpackConfiguration = (config: Configuration) => {
      entryPointPath = config.entry['main'][0];

    return originalWebpackConfigurationFn
      ? originalWebpackConfigurationFn(config)
      :  config;
    };

  const result = executeBrowserBuilder(options as any, context, transforms);

  return result.pipe(
    tap(() => {
      patchEntryPoint(""); // clear entry point so our main.ts is always empty
    })
  );
}

function patchEntryPoint(contents: string) {
  fs.writeFileSync(entryPointPath, contents);
}

function validateOptions(options: CustomWebpackBrowserSchema) {
  const { pluginName, modulePath } = options;

  if (!modulePath) {
    throw Error("Please define modulePath!");
  }

  if (!pluginName) {
    throw Error("Please provide pluginName!");
  }
}

function patchWebpackConfig(config: Configuration, options: CustomWebpackBrowserSchema) {
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

export default createBuilder<JsonObject & CustomWebpackBrowserSchema>(buildPlugin);
