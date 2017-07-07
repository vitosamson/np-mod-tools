const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');
const isDevelopment = process.env.NODE_ENV === 'development';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  }),
  new webpack.ProvidePlugin({
    preact: 'preact',
  }),
];

if (!isDevelopment) {
  plugins.push(new BabiliPlugin());
}

// copy the background script to the extension folder after webpack finishes bundling the content scripts
plugins.push(function() {
  this.plugin('done', () => {
    const backgroundScript = fs.readFileSync(path.resolve('./src/background/background.js'));
    fs.writeFileSync(path.resolve('./extension/background.js'), backgroundScript);
  });
});

module.exports = {
  devtool: isDevelopment ? 'source-map' : false,
  entry: './src/content/index.tsx',
  output: {
    path: path.resolve('./extension'),
    filename: 'content.js',
  },
  module: {
    rules: [
      {
        use: 'awesome-typescript-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
};
