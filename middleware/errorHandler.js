
const errorHandler = (err, req, res, next) => {
    res.status(400).json({ error: err.message });
}

module.exports = errorHandler;