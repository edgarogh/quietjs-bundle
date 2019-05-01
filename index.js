try {
    module.exports = require('./_bundle.js');
} catch (e) {
    if (e.code === 'MODULE_NOT_FOUND')
        throw new Error("Bundle not found. Did you generate it ?");
    else
        throw e;
}
