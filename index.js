const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');



const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('blogs'));
app.use(fileUpload());


const port = 5000

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5okrn.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;




const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const blogsCollection = client.db("spBlog").collection("blogs");
  const adminCollection = client.db("spBlog").collection("admin");
  console.log("database connection successful")




  app.post("/addBlog", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const description = req.body.description;
    const filePath = `${__dirname}/blogs/${file.name}`;
    console.log(name, description, file);
    file.mv(filePath, err => {
        if (err) {
            console.log(err);
            res.status(500).send({msg: 'faild to upload image'});
        }
        const newImg = fs.readFileSync(filePath);
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimeType,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
        blogsCollection.insertOne({name, description, image})
        .then(result => {
            fs.remove(filePath, error => {
                if(error){
                    console.log(error)
                    res.status(500).send({msg: 'Failed to upload image'});
                }
                res.send(result.insertedCount > 0)
            })
        })
    })
  })

  app.get('/blogs', (req, res) => {
    blogsCollection.find({})
    .toArray((err, result) => {
      res.send(result);
    })
  })

  app.get('/blog/:id', (req, res) => {
    blogsCollection.find({_id: ObjectId(req.params.id)})
    .toArray((err, result) => {
      res.send(result[0]);
    })
  })

  app.delete('/delete/:id', (req, res) => {
    blogsCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })

  app.post('/addAdmin', (req, res) => {
    const name = req.body.name
    const email = req.body.email
    adminCollection.insertOne({name, email})
    .then(result => {
      console.log('inserted Count', result.insertedCount)
      res.send(result.insertedCount > 0)
    })
  })
























  
});




app.get('/', (req, res) => {
  res.send('Hello World sarwar!')
})

app.listen(process.env.PORT || port)