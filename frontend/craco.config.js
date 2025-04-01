const webpack = require("webpack");

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                http: require.resolve("stream-http"),
                https: require.resolve("https-browserify"),
                stream: require.resolve("stream-browserify"),
                zlib: require.resolve("browserify-zlib"),
                util: require.resolve("util/"),
                assert: require.resolve("assert/"),
                url: require.resolve("url/")
            };
            return webpackConfig;
        }
    }
};
