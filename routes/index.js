var express = require('express');
var router = express.Router();
const fs = require('fs')
const request = require('request');
const im = require('imagemagick');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
var piexif = require("piexifjs");
/* GET home page. */
let download = function(uri, filename, callback){
  request.head(uri, function(err, res, body){
      if(res){
          if(res.statusCode == 200){
              request(uri).pipe(fs.createWriteStream(filename)).on('close',callback);
          }else{
              console.log('loi 1')
              callback(404)
          }
      }else{
          console.log('loi 2')
          callback(404)
      }
  });
};
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/request-image',(req,res) => {
    let token = req.query.token
    let data = req.query.data

    try{
        let query = decrypt({
            iv: token,
            encryptedData: data
        })
        query = JSON.parse(query)
        let {url,fileName,maxSize} = query
        if(!maxSize){
            maxSize = 1750
        }
        let uriFile = fileName+'.jpg'

        download(url, uriFile, function(err){
            if(err){
                return res.json({
                    message: 'error'
                })
            }
            im.convert([uriFile, '-resize', maxSize+'x'+maxSize, uriFile],
                function(err, stdout){
                    if (err){
                        return res.json({
                            message: 'error',
                            err: err
                        })
                    }
                    var jpeg = fs.readFileSync(uriFile);
                    var data = jpeg.toString("binary");

                    var zeroth = {};
                    var exif = {};
                    var gps = {};
                    // console.log(piexif)


                    zeroth[piexif.ImageIFD.ImageDescription] = fileName

                    zeroth[piexif.ImageIFD.RatingPercent] = 100

                    var exifObj = {"0th":zeroth, "Exif":exif, "GPS":gps};
                    var exifbytes = piexif.dump(exifObj);

                    var newData = piexif.insert(exifbytes, data);
                    var newJpeg = Buffer.from(newData, "binary");
                    fs.writeFileSync(uriFile, newJpeg);
                    let stream = fs.createReadStream(uriFile);
                    stream.on("end", function () {
                        deleteFile(uriFile);
                        // stream.destroy(); // makesure stream closed, not close if download aborted.
                        // deleteFile(uriFile);
                    });
                    stream.pipe(res)

                    // return res.json({message: "success"})
                });

        });
    }catch (err) {
        return res.json({
            message: "error"
        })
    }

  //   resize({
  //       src: "google.jpg",
  //       dst: "google1.jpg",
  //       height: 1000,
  //       width: 1000
  //   },({name,path,width,height,warnings}) => {
  //       if(warnings){
  //           console.log(warnings)
  //       }
  //       con
  //   })
})
function deleteFile (file) {
    fs.unlink(file, function (err) {
        if (err) {
            console.error(err.toString());
        } else {
            console.warn(file + ' deleted');
        }
    });
}
// router.get('/test',(req,res) => {
//
//
//
//     var filename1 = "google.jpg";
//     var filename2 = "out.jpg";
//
//
// })
// router.get('/test1',(req,res) => {
//     var filename1 = "google1.jpg";
//
//
//     var jpeg = fs.readFileSync(filename1);
//     var data = jpeg.toString("binary");
//     var exifObj = piexif.load(data);
//     for (var ifd in exifObj) {
//         if (ifd == "thumbnail") {
//             continue;
//         }
//         console.log("-" + ifd);
//         for (var tag in exifObj[ifd]) {
//             console.log("  " + piexif.TAGS[ifd][tag]["name"] + ":" + exifObj[ifd][tag]);
//         }
//     }
//     return res.json({message : 'success'})
// })
const key = "5657c64c64000345de2a0bc8c08a77e4251a56b6eaf0779eafd251a38604095e";
function encrypt(text) {
    const iv = crypto.randomBytes(16);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key,'hex'), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}
function decrypt(text) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key,'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
router.get('/test2',(req,res) => {





    var hw = encrypt(JSON.stringify({
        url: "https://2.bp.blogspot.com/-igowB6lTUvE/XJjuw6xkXGI/AAAAAAAAAII/Gv4ch1sfNJE2Ejcm6fLFfGLiNSigF6G2QCLcBGAs/s1600/hinh-anh-girl-xinh-gai-dep-mac-bikini_5.jpg",
        fileName: "Test",
        maxSize: 1500
    }))


    return res.json({
        message: hw
    })
})
module.exports = router;
