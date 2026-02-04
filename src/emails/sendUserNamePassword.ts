import axios from "axios"


export const sendPassword = async ({ to, subject, role, password }) => {
  try {
    const res = await axios.post("https://portfolio-api-blush-eight.vercel.app/api/v1", { to, subject, role, password })
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
};
