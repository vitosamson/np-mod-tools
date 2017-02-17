const path = require('path');
const webpack = require('webpack');
const isDevelopment = process.env.NODE_ENV === 'development';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  }),
];

// the extension manifest points to content.min.js
// rather than modifying the manifest based on env, we'll just name the dev file to .min
const filename = isDevelopment ? 'content.min.js' : 'content.js';

module.exports = {
  devtool: isDevelopment ? 'eval-source-map' : false,
  entry: './src/content/index.js',
  output: {
    path: path.resolve('./extension'),
    filename,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
    ],
  },
  plugins,
};
