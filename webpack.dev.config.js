const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.config.js');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      WS_SERVER: "'ws://localhost:2222/chat'"
    })
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  }
});
