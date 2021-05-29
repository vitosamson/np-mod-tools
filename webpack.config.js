const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const webpack = require('webpack');
const isDevelopment = process.env.NODE_ENV === 'development';
const devClientId = '733edtKvu6rRUw';

/**
 * Copy the background script to the extension folder after webpack finishes bundling the content scripts.
 */
class BackgroundScriptCopyPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('Copy background script', compilation => {
      const clientId = process.env.CLIENT_ID || devClientId;
      const backgroundScript = fs
        .readFileSync(path.resolve('./src/background/background.js'))
        .toString()
        .replace('__CLIENT_ID__', clientId);

      fs.writeFileSync(path.resolve('./extension/background.js'), backgroundScript);
      console.log('updated background.js with client ID', clientId);

      if (!isDevelopment) {
        this.zipExtension();
      }
    });
  }

  zipExtension() {
    const name = process.env.BROWSER;
    const filename = `${name}.zip`;
    execSync(`cd extension && zip ${filename} ./* && mv ${filename} ../build`);
    console.log(`built ${name} extension: ${filename}`);
  }
}

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'source-map' : false,
  entry: './src/content/index.tsx',
  output: {
    path: path.resolve('./extension'),
    filename: 'content.js',
  },
  module: {
    rules: [
      {
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
      },
    }),
    new webpack.ProvidePlugin({
      preact: 'preact',
    }),
    new BackgroundScriptCopyPlugin(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
};
