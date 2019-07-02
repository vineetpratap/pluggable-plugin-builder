import { JsonObject } from "@angular-devkit/core";
import {CustomWebpackBuilderConfig} from "./custom-webpack-builder-config";

export interface Option extends JsonObject {
  /**
   * A string of the form `path/to/file#exportName` that acts as a path to include to bundle
   */
  modulePath: string;

  /**
   * A name of compiled bundle
   */
  pluginName: string;

  /**
   * A comma-delimited list of shared lib names used by current plugin
   */
  sharedLibs: string;
}

export interface CustomWebpackSchema {
  /**
   * A string of the form `path/to/file#exportName` that acts as a path to include to bundle
   */
  modulePath: string;

  /**
   * A name of compiled bundle
   */
  pluginName: string;

  /**
   * A comma-delimited list of shared lib names used by current plugin
   */
  sharedLibs: string;

  webpackExternalDependencies: CustomWebpackBuilderConfig;
}
