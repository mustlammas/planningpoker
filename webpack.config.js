const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    app: [
      './src/client.js'
    ]
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'bundle.dev.js'
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
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public')
  },
  plugins: []
};
