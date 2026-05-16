import crypto from "crypto";

export const toJsonLine = (data) => JSON.stringify(data) + "\n";

export const hash = (content) => crypto.createHash("sha256").update(content).digest("hex")

export const generateOTP = () => {
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += numbers[crypto.randomInt(numbers.length)];
    }
    return otp;
}

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex")
}

export const getExpirationDate = (expirationTimeInMinutes) => {
    const diff = expirationTimeInMinutes * 60 * 1000;
  return new Date(new Date().getTime() + diff);
};

export const formatTimeForUser = (date, user = {}) => {
  return new Intl.DateTimeFormat(user.locale || "nl-NL", {
    timeZone: user.timezone || "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
};

export const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

// const today = new Date();
// console.log(formatDate(today));

export const getUuid = () => {
  return crypto.randomUUID();
};