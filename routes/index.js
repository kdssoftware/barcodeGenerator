global.window = {document: {createElementNS: () => {return {}} }};
global.navigator = {};
global.btoa = () => {};
var express = require('express');
var router = express.Router();
const superagent = require('superagent');
const fs = require('fs');
const path = require('path');
const {jsPDF} = require("jspdf");
window.jsPDF = require("jspdf");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/generate',async function(req,res,next){
  //const format = [Number(req.body.height),Number(req.body.width)];
  const format = "a4";
  let nr = 0;
  console.log(req.body);
  let doc = new jsPDF({
    format:format
  });
  doc.setFontSize(20);
  for(let i=Number(req.body.from); i <= Number(req.body.until); i++){
    let bar = i;
    let filetype = 'jpeg';
    if(req.body.prefix){
      bar = req.body.prefix+bar
    }
    if(req.body.suffix){
      bar = bar+req.body.suffix
    }
    superagent
        .get('http://barcodes4.me/barcode/'+req.body.type+'/'+bar+'.'+filetype)
        .query({IsTextDrawn:req.body.textDrawn})
        .query({TextSize:Number(req.body.textSize)})
        .query({height:Number(req.body.height)})
        .query({resolution:4})
        .then(async response=>{
          if(response.ok){
            const imgData = "data:image/"+filetype.toLowerCase()+";base64,"+(response.body).toString('base64');
            if(imgData){
              nr++;
              console.log(imgData);
              doc.addImage(imgData,'JPEG' , 0, 0, Number(req.body.width), Number(req.body.height));
              console.log(nr+"/"+(Number(req.body.until)+1));
              if(nr===Number(req.body.until)+1){
                console.log('generating...');
                const filename = req.body.prefix+req.body.from+req.body.suffix + "-" + req.body.prefix+req.body.until+req.body.suffix + "." + "pdf";
                let file = path.resolve(__dirname,"../temp/" + filename);
                console.log("stored at: "+file);
                await fs.writeFileSync(file, doc.output());
                console.log('saved!');
                await fs.readFile(file, function (err, data) {
                  res.setHeader("Content-Disposition", "inline; filename=\"" + filename + "\"");
                  res.contentType("application/pdf");
                  res.setHeader("Content-Length", data.length);
                  res.status(200).end(data, "binary");
                });

                delete global.window;
                delete global.navigator;
                delete global.btoa;
              }else{
                doc.addPage({format:format});
              }
            }
          }
        });
  }

});


module.exports = router;
