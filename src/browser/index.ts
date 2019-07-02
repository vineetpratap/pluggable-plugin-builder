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

type CustomWebpackBrowserSchema = BrowserBuilderOptions & CustomWebpackSchema;

let entryPointPath: string;

function buildPlugin(
  options   : CustomWebpackBrowserSchema,
  context   : BuilderContext,
  transforms: {
    webpackConfiguration?: ExecutionTransformer<Configuration>;
  } = {}
): Observable<BrowserBuilderOutput> {
  options.deleteOutputPath = false;

  validateOptions( options );

  const originalWebpackConfigurationFn  = getTransforms( options, context ).webpackConfiguration;
  transforms.webpackConfiguration = ( config: Configuration ) => {
    entryPointPath = config.entry[ 'main' ][ 0 ];
    return originalWebpackConfigurationFn ? originalWebpackConfigurationFn( config ) : config;
  };

  return executeBrowserBuilder( options as any, context, transforms ).pipe(
    tap( () => {
      patchEntryPoint( "" ); // clear entry point so our main.ts is always empty
    } )
  );
}

function patchEntryPoint( contents: string ) {
  fs.writeFileSync( entryPointPath, contents );
}

function validateOptions( options: CustomWebpackBrowserSchema ) {
  const { pluginName, modulePath } = options;

  if ( !modulePath ) {
    throw Error( "Please define modulePath!" );
  }

  if ( !pluginName ) {
    throw Error( "Please provide pluginName!" );
  }
}

export default createBuilder<JsonObject & CustomWebpackBrowserSchema>( buildPlugin );
