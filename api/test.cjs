module.exports = function handler(req, res) {
    res.status(200).json({
        message: 'CommonJS API results',
        node_version: process.version,
        env_keys: Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('ADMIN') || k.includes('BLOB'))
    });
};
