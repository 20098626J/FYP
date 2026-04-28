// Validate county/town search
function validateLocationSearch(req, res, next) {
  const { county, town } = req.query;
  
  if (!county || !town) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: ['county', 'town']
    });
  }
  
  if (county.length < 2 || town.length < 2) {
    return res.status(400).json({
      error: 'County and town must be at least 2 characters'
    });
  }
  
  next();
}

// Validate numeric parameters
function validateNumericFilters(req, res, next) {
  const { minSpeed, maxPrice } = req.query;
  
  if (minSpeed && (isNaN(minSpeed) || minSpeed < 0)) {
    return res.status(400).json({
      error: 'minSpeed must be a positive number'
    });
  }
  
  if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
    return res.status(400).json({
      error: 'maxPrice must be a positive number'
    });
  }
  
  next();
}

module.exports = {
  validateLocationSearch,
  validateNumericFilters
};