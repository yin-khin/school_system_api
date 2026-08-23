// Helper to sanitize update data: remove photo/avatar if not a string
const sanitizePhoto = (updateData) => {
  const data = { ...updateData };
  if (data.photo != null && typeof data.photo !== 'string') {
    delete data.photo;
  }
  ['Class', 'Section', 'Parent', 'User', 'avatar'].forEach(field => {
    if (data[field] != null && typeof data[field] === 'object') {
      delete data[field];
    }
  });
  return data;
};

module.exports = { sanitizePhoto };
