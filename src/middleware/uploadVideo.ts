import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    //if (file.mimetype.startsWith('video/')) {
      //  cb(null, true);
    //} else {
      //  cb(new Error('Solo se permiten archivos de vídeo'));
    //}
    console.log('file recibido:', file);  
    cb(null, true); // Permite todo para debug
};

const uploadVideo = multer({ storage, fileFilter });

export default uploadVideo;