const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors) {
      const formatted = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: formatted });
    }
    return res.status(400).json({ error: 'Invalid request payload' });
  }
};

module.exports = validate;
