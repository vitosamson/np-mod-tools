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

if (!isDevelopment) {
  // uglifyjs doesn't know how to parse es2015 syntax yet... what year is it?
  // plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = {
  devtool: isDevelopment ? 'eval-source-map' : false,
  entry: './src/content/index.js',
  output: {
    path: path.resolve('./extension'),
    filename: 'content.js',
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
