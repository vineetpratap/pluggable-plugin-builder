module.exports = [
    {
      originalSchemaPath: '@angular-devkit/build-angular/src/browser/schema.json',
      schemaExtensionPaths: [ `${__dirname}/browser/schema.ext.json`, `${__dirname}/schema.ext.json` ],
      newSchemaPath: `${__dirname}/../dist/browser/schema.json`
    },
    {
      originalSchemaPath: '@angular-devkit/build-angular/src/server/schema.json',
      schemaExtensionPaths: [`${__dirname}/server/schema.ext.json`, `${__dirname}/schema.ext.json`],
      newSchemaPath: `${__dirname}/../dist/server/schema.json`
    }
  ];