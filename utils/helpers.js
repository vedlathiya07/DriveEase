// =====================================
// HELPER FUNCTIONS
// =====================================

// FORMAT DATE
const formatDate = (date) => new Date(date).toLocaleDateString("en-IN");

// CALCULATE DAYS
const calculateDays = (start, end) => {
  return Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
};

module.exports = {
  calculateDays,
  formatDate,
  formatPrice: (price) => `Rs. ${price}`,
};

// FORMAT PRICE
function formatPrice(price) {
  return `₹${price}`;
};
