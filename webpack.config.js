const path = require('path');

module.exports = {
    entry: './src/renderer/app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/renderer'),
    },
    target: 'electron-renderer',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.json'],
    },
    mode: process.env.NODE_ENV || 'development',
    devtool: 'source-map',
};
