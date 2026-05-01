import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/users": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/api/products": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "app.nuevavida1327.com",
      "nuevavida1327.com",
      ".up.railway.app",
    ],
    hmr: {
      overlay: false,
    },
  },
  preview: {
    allowedHosts: [".up.railway.app", "nuevavida1327.com", "www.nuevavida1327.com"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
