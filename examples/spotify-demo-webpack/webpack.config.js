import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@web-agent/core': path.resolve(__dirname, '../../packages/core/src'),
      '@web-agent/react': path.resolve(__dirname, '../../packages/react/src'),
      '@web-agent/transformers': path.resolve(__dirname, '../../packages/transformers/src'),
      '@web-agent/ui-protocol': path.resolve(__dirname, '../../packages/ui-protocol/src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic' }],
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(wasm|onnx)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: 'body',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3002,
    hot: true,
    open: true,
    historyApiFallback: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  devtool: 'source-map',
  experiments: {
    asyncWebAssembly: true,
  },
  performance: {
    maxAssetSize: 10000000, // 10MB - models are large
    maxEntrypointSize: 10000000,
  },
};

