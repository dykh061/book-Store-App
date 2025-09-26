import _ from "lodash";
import { generateKeyPairSync } from "crypto";

export const generateKeyPair = () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
};

/**
 * Hàm set cookie cho response
 * @param {object} res - express response object
 * @param {string} name - tên cookieUser: getInfoData({
          fields: []
        })
 * @param {string} value - giá trị cookie
 * @param {object} options - các tùy chọn cookie
 */
export const setCookie = (res, name, value, options = {}) => {
  const defaultOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  res.cookie(name, value, { ...defaultOptions, ...options });
};

export const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

export const getPaginationArray = (current, total) => {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  for (let i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    l = i;
  }
  return rangeWithDots;
};
