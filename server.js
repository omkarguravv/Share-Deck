const express = require('express')
const multer = require('multer')
const mongoose = require('mongoose')
const bycrpt = require('bcrypt')
const File = require('./models/File')
const path = require('path')
require('dotenv').config()

const app = express()
app.use(express.urlencoded({ extended: true }))

app.use('/assests',express.static('assets'))
app.set('views', path.join(__dirname, 'views'));
// app.use(express.static(path.join(__dirname, 'assets')))
app.use(express.static(path.join(__dirname, 'public')))
//images
app.use( express.static( "public" ) );

const upload = multer({ dest: 'uploads' })

mongoose.connect(process.env.DATABASE_URL)

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})



app.post('/upload', upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }

    if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bycrpt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)


    res.render("index", { fileLink: `${process.env.APP_BASE_URL}/file/${file.id}` })

    // console.log(file)

})

app.route("/file/:id").get(handleDownload).post(handleDownload)

// app.get('/file/:id', handleDownload)
// app.post('/file/:id', handleDownload)

async function handleDownload(req, res) {
    // res.send(req.params.id)
    const file = await File.findById(req.params.id)
    if (file.password != null  && file.password !== "") {
        if (req.body.password == null) {
            res.render("password")
            return
        }
        if (!(await bycrpt.compare(req.body.password, file.password))) {
            res.render("password", { error: true })
            return
        }

    }

    file.downloads++
    await file.save()
    console.log(file.downloads)
    res.download(file.path, file.originalName)
}

app.listen(process.env.PORT)