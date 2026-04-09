const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimIfString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeParticipantPayload(body = {}) {
  const payload = { ...body };

  payload.first_name = trimIfString(payload.first_name);
  payload.last_name = trimIfString(payload.last_name);
  payload.email = trimIfString(payload.email);
  payload.phone = trimIfString(payload.phone);
  payload.role = trimIfString(payload.role);
  payload.status = trimIfString(payload.status);

  if (payload.phone === '') {
    payload.phone = null;
  }

  return payload;
}

function normalizeEventPayload(body = {}) {
  const payload = { ...body };

  payload.title = trimIfString(payload.title);
  payload.description = trimIfString(payload.description);
  payload.location = trimIfString(payload.location);
  payload.status = trimIfString(payload.status);

  if (payload.description === '') {
    payload.description = null;
  }

  if (payload.location === '') {
    payload.location = null;
  }

  if (payload.max_participants !== undefined && payload.max_participants !== null && payload.max_participants !== '') {
    payload.max_participants = Number(payload.max_participants);
  }

  return payload;
}

function validateParticipantPayload(payload, { partial = false } = {}) {
  const errors = [];

  if (!partial || payload.first_name !== undefined) {
    if (!payload.first_name || payload.first_name.length < 2 || payload.first_name.length > 50) {
      errors.push('first_name must be between 2 and 50 characters.');
    }
  }

  if (!partial || payload.last_name !== undefined) {
    if (!payload.last_name || payload.last_name.length < 2 || payload.last_name.length > 50) {
      errors.push('last_name must be between 2 and 50 characters.');
    }
  }

  if (!partial || payload.email !== undefined) {
    if (!payload.email || payload.email.length > 254 || !EMAIL_REGEX.test(payload.email)) {
      errors.push('email must be valid and at most 254 characters.');
    }
  }

  if (!partial || payload.password !== undefined) {
    if (!payload.password || payload.password.length < 8 || payload.password.length > 128) {
      errors.push('password must be between 8 and 128 characters.');
    }
  }

  if (payload.phone !== undefined && payload.phone !== null) {
    if (payload.phone.length < 8 || payload.phone.length > 20) {
      errors.push('phone must be between 8 and 20 characters when provided.');
    }
  }

  if (payload.role !== undefined) {
    const allowedRoles = ['admin', 'participant'];
    if (!allowedRoles.includes(payload.role)) {
      errors.push('role must be either admin or participant.');
    }
  }

  if (payload.status !== undefined) {
    const allowedStatus = ['active', 'deleted'];
    if (!allowedStatus.includes(payload.status)) {
      errors.push('status must be either active or deleted.');
    }
  }

  return errors;
}

function validateEventPayload(payload, { partial = false } = {}) {
  const errors = [];
  const allowedStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];

  if (!partial || payload.title !== undefined) {
    if (!payload.title || payload.title.length < 3 || payload.title.length > 120) {
      errors.push('title must be between 3 and 120 characters.');
    }
  }

  if (payload.description !== undefined && payload.description !== null) {
    if (payload.description.length > 1000) {
      errors.push('description must be at most 1000 characters.');
    }
  }

  if (payload.price !== undefined && payload.price !== null) {
    const numPrice = Number(payload.price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      errors.push('price must be a non-negative number.');
    }
  }

  if (!partial || payload.start_date !== undefined) {
    if (!payload.start_date || Number.isNaN(Date.parse(payload.start_date))) {
      errors.push('start_date must be a valid date.');
    }
  }

  if (!partial || payload.end_date !== undefined) {
    if (!payload.end_date || Number.isNaN(Date.parse(payload.end_date))) {
      errors.push('end_date must be a valid date.');
    }
  }

  // Cross-field validation: end_date must be after start_date
  if (payload.start_date && payload.end_date) {
    if (new Date(payload.end_date) <= new Date(payload.start_date)) {
      errors.push('end_date must be after start_date.');
    }
  }

  if (!partial || payload.status !== undefined) {
    if (!payload.status || !allowedStatuses.includes(payload.status)) {
      errors.push('status must be one of: upcoming, ongoing, completed, cancelled.');
    }
  }

  if (payload.location !== undefined && payload.location !== null) {
    if (payload.location.length > 150) {
      errors.push('location must be at most 150 characters.');
    }
  }

  if (!partial || payload.max_participants !== undefined) {
    if (!Number.isInteger(payload.max_participants) || payload.max_participants < 1) {
      errors.push('max_participants must be a positive integer.');
    }
  }

  return errors;
}

module.exports = {
  normalizeParticipantPayload,
  normalizeEventPayload,
  validateParticipantPayload,
  validateEventPayload
};
