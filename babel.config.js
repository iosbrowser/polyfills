module.exports = {
    presets: [
        ["@babel/preset-env", {
            targets: {
                browsers: ["ie >= 9"]
            },
            forceAllTransforms: true
        }]
    ]
};
