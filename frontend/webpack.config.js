const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    mode: 'development',
    entry: './js/index.js',
    output: {
        path: path.resolve(__dirname, '../backend/public/dist'),
        filename: 'bundle.js'
    },
    plugins: [new MiniCssExtractPlugin({
        filename: 'bundle.css'
    })],
    module: {
        rules: [
            {
                test:   /\.css$/,
                use:    [
                    {loader: MiniCssExtractPlugin.loader},
                    "css-loader"],
            }
        ]
    }
};