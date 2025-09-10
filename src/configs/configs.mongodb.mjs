// Cấu hình cho môi trường phát triển (dev)
const dev = {
  app: {
    port: process.env.DEV_APP_PORT || 3000, // Cổng ứng dụng, nếu không có, mặc định là 3052
  },
  db: {
    host: process.env.DEV_DB_HOST || "localhost", // Địa chỉ máy chủ cơ sở dữ liệu, nếu không có, mặc định là 'localhost'
    port: process.env.DEV_DB_PORT || 27017, // Cổng cơ sở dữ liệu, mặc định là 27017 (MongoDB)
    name: process.env.DEV_DB_NAME || "BookStore", // Tên cơ sở dữ liệu, mặc định là 'BookStore'
  },
};
export default dev;
