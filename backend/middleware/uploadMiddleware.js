const multer = require('multer');
const path = require('path');

// 1. Disk Storage hata kar Memory Storage use kar rahe hain
// Isse req.file.buffer mil jayega jise hum base64 me convert kar sakte hain
const storage = multer.memoryStorage();

// 2. File validation logic (Tumhara original code, jo bilkul sahi hai)
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    // Error object return karna better practice hai
    cb(new Error('Images and PDFs only!'), false); 
  }
}

// 3. Upload configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

module.exports = upload;