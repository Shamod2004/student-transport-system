const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,}$/;
const STUDENT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9\-/]{4,}$/;
const PASSWORD_MIN_LENGTH = 6;
const PHONE_REGEX = /^7\d{8}$/;
const GENDER_VALUES = new Set(["male", "female", "other"]);

const trimValue = (value) => String(value || "").trim();

export const isValidEmail = (value) => EMAIL_REGEX.test(trimValue(value));

export const isValidName = (value) => NAME_REGEX.test(trimValue(value));

export const isValidStudentId = (value) => STUDENT_ID_REGEX.test(trimValue(value));

export const normalizePhoneNumber = (value) => {
  const digitsOnly = trimValue(value).replace(/\D/g, "");

  if (digitsOnly.startsWith("94")) {
    return digitsOnly.slice(2);
  }

  if (digitsOnly.startsWith("0")) {
    return digitsOnly.slice(1);
  }

  return digitsOnly;
};

export const isValidPhoneNumber = (value) => PHONE_REGEX.test(normalizePhoneNumber(value));

export const isValidPassword = (value) => trimValue(value).length >= PASSWORD_MIN_LENGTH;

export const isValidGender = (value) => GENDER_VALUES.has(trimValue(value).toLowerCase());

export const isValidAddress = (value) => trimValue(value).length >= 5;

export const isValidSeatNumber = (value) => /^[A-Za-z]\d{1,2}$/.test(trimValue(value));

export const isValidRouteDate = (value) => {
  const trimmed = trimValue(value);
  if (!trimmed) return false;

  const selectedDate = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate >= today;
};
