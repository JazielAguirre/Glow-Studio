function getHealth(req, res) {
    res.json({
        ok: true,
        message: 'Glow Studio API running',
    });
}

module.exports = { getHealth };
