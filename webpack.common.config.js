const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: [
      './src/client/app.js'
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      inject: true,
      template: './src/client/index.html'
    }),
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(
        process.env.npm_package_version,
      ),
    })
  ],
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[fullhash].js',
    publicPath: '/'
  }
};
