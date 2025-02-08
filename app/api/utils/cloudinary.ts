const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'kresearchbase', // Replace with your actual Cloudinary cloud name
  api_key: process.env.CL_API_KEY, // Replace with your actual Cloudinary API key
  api_secret: process.env.CL_API_SECRET, // Replace with your actual Cloudinary API secret
});

module.exports = cloudinary;
