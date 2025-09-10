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
