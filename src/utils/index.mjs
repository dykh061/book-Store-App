/**
 * @module utils/index
 * @description
 * Bộ tiện ích dùng chung trong hệ thống:
 * - Sinh cặp khóa RSA.
 * - Thiết lập cookie bảo mật.
 * - Trích lọc dữ liệu (pick fields).
 * - Tạo mảng phân trang hiển thị.
 */

import _ from "lodash";
import { generateKeyPairSync } from "crypto";

/**
 * @function generateKeyPair
 * @description
 * Sinh cặp khóa RSA (2048 bit) dùng cho JWT.
 *
 * @returns {{publicKey: string, privateKey: string}}
 */
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
 * @function setCookie
 * @description
 * Hàm thiết lập cookie bảo mật trong response.
 *
 * - Tự động thêm các thuộc tính: `httpOnly`, `secure`, `sameSite: "strict"`.
 * - Cho phép ghi đè thông qua `options`.
 *
 * @param {object} res - Đối tượng response của Express
 * @param {string} name - Tên cookie
 * @param {string} value - Giá trị cookie
 * @param {object} options - Tuỳ chọn cookie (vd: maxAge)
 */
export const setCookie = (res, name, value, options = {}) => {
  const defaultOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  };

  res.cookie(name, value, { ...defaultOptions, ...options });
};

/**
 * @function getInfoData
 * @description
 * Trích lọc các trường (fields) được chỉ định từ một object.
 *
 * @param {Object} params
 * @param {string[]} params.fields - Danh sách field cần lấy
 * @param {Object} params.object - Đối tượng dữ liệu nguồn
 * @returns {Object} Object mới chỉ chứa các field được chọn
 */
export const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

/**
 * @function getPaginationArray
 * @description
 * Tạo mảng phân trang hiển thị (ví dụ: [1, 2, 3, "...", 10]).
 *
 * @param {number} current - Trang hiện tại
 * @param {number} total - Tổng số trang
 * @returns {(number|string)[]} Mảng số trang kèm dấu "..."
 */
export const getPaginationArray = (current, total) => {
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  let l;

  // Tạo danh sách trang hiển thị
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  // Thêm dấu "..." vào giữa các khoảng
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
