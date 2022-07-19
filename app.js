const express = require('express')
const expressEjsLayouts = require('express-ejs-layouts')
const fs = require('fs')
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const {
  body,
  validationResult,
  check
} = require('express-validator');

// panggil contacts fungsion
const {
  loadContact,
  findDetailContact,
  cekDuplikat,
  addDataContact,
  updateDataContact,
  deleteDataContact
} = require('./utils/contacts')
// Call morgan libarary
const morgan = require('morgan');
// call express library
const app = express()
//call database 
const pool = require('./db');
const {
  response
} = require('express');

app.use(express.json()) //req.body

const port = 3000
// information using ejs
app.set('view engine', 'ejs')
//mmenggunakan ejs layouts
app.use(expressEjsLayouts)
// Memberikan akses terhadap folder public
app.use(express.static('public'))
app.use(express.urlencoded({
  extended: true
}));

// menampilkan Log activity
app.use(morgan('dev'))
app.set('layout', './layout/main-layout')
// Middleware configuration
app.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})
// configuration flash connect
app.use(cookieParser('secret'));
app.use(session({
  cookie: {
    maxAge: 6000
  },
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));
app.use(flash());

// insert data to database
app.get("/addasync", async (req, res) => {
  try {
    const name = "Junaedi"
    const mobile = "081535456460"
    const email = "junaedi@gmail.com"
    const newCount = await pool.query(`INSERT INTO contacts values ('${name}','${mobile}','${email}') RETURNING *`)
    res.json(newCount)
  } catch (err) {
    console.error(err.message)
  }
})

// home pages
app.get('/', (req, res) => {


  res.render('index', {
    nama: "Adi Riyanto",
    title: "WebServer EJS",
    layout: "layout/main-layout"
  })
})

app.get('/about', (req, res) => {
  // res.send('This is about Page!')
  res.render('about', {
    title: "About",
    layout: "layout/main-layout"
  })
})

app.get('/contact', (req, res) => {
  // res.send('This is contact Page!')

  // const contacts = loadContact();
  // Memanggil query semua nama kontak
  const sql = 'SELECT * FROM contacts ORDER BY name ASC'
  pool.query(sql, [], (error, results) => {
    if (error) {
      throw error
    }
    res.render('contact', {
      title: "Contact",
      layout: "layout/main-layout",
      contacts: results.rows,
      msg: req.flash('msg')
    })
  })
})

app.get('/contact/add', (req, res) => {


  res.render('add-contact', {
    title: 'Form Add Contact',
    layout: "layout/main-layout",
    contact: req.body
  })
})
// membuat post atau create data dengan menggunakan validasi
app.post('/contact', [
  body('name').custom(async (value) => {

    // Mencari nama yang sama di query
    const queryDuplikat = await pool.query(`SELECT * FROM contacts WHERE name = '${value.toLowerCase()}'`)
    const duplikat = queryDuplikat.rows[0]


    if (duplikat) {
      throw new Error(`Nama contact sudah terdaftar! `);

    }

    return true;
  }),
  check('email', 'Email tidak valid!').isEmail(),
  check('mobile', 'No HP tidak valid!').isMobilePhone('id-ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {


    res.render('add-contact', {
      title: 'Form Tambah Data Contact',
      layout: 'layout/main-layout',
      errors: errors.array(),
      dataOld: req.body

    });

  } else {
    // addDataContact(req.body);
    // addContact di postgre
    try {
      // Mengambil isi form yang di isikan oleh user
      const name = req.body.name.toLowerCase();
      const mobile = req.body.mobile;
      const email = req.body.email;
      //Menggunakan query insert untuk memasukan data atau mengadd data
      const dataAdd = await pool.query(`INSERT INTO contacts values ('${name}','${mobile}','${email}') RETURNING *`)
      dataAdd;
      req.flash('msg', 'Data contact berhasil di Tambahkan')
      res.redirect('/contact');
    } catch (err) {
      console.error(err.message)
    }

  }


});
// Proses delete contact
app.get('/contact/delete/:name', (req, res) => {
  // Membuat query untuk delete
  const name = req.params.name;
  const sql = `DELETE FROM contacts WHERE name = '${name}'`;
  pool.query(sql, (err, result) => {


    //   jika contact tidak ada
    if (!name) {
      res.status(404);
      res.send('<h1>404</h1>')
    } else {
      result.rows[0]
      req.flash('msg', 'Data contact berhasil di Hapus')
      res.redirect('/contact');
    }
  })
})

// proses mengambil data sebelumnya
app.get('/contact/edit/:name', (req, res) => {
  const name = req.params.name;
  // Mencari nama yang akan di edit lalu di masukan kedalam input di ejs
  const sql = `SELECT * FROM contacts WHERE name = '${name}'`;
  pool.query(sql, (err, result) => {

    res.render('edit-contact', {
      title: "Form Edit Contact",
      layout: "layout/main-layout",
      contact: result.rows[0],
    });
  })
});

// Proses melakukan update data
app.post('/contact/update', [
  body('name').custom(async (value, {
    req
  }) => {
    // const duplikat = cekDuplikat(value);
    // Mencari nama yang sama di query
    const queryDuplikat = await pool.query(`SELECT * FROM contacts WHERE name = '${value}'`)
    const duplikat = queryDuplikat.rows[0]
    if (value !== req.body.oldName && duplikat) {
      throw new Error('Nama contact sudah terdaftar! ');
    }

    return true;
  }),
  check('email', 'Email tidak valid!').isEmail(),
  check('mobile', 'No HP tidak valid!').isMobilePhone('id-ID')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    res.render('edit-contact', {
      title: 'Form Ubah Data Contact',
      layout: 'layout/main-layout',
      errors: errors.array(),
      contact: req.body
    });

  } else {

    // updateDataContact(req.body);
    // Memasukan isi form yang akan di ubah

    const oldName = req.body.oldName.toLowerCase();
    const name = req.body.name.toLowerCase();
    const mobile = req.body.mobile;
    const email = req.body.email;
    // Melakukan query update 
    const newUpdate = await pool.query(`UPDATE contacts SET  name='${name}', mobile='${mobile}', email='${email}' WHERE (name='${oldName}')`)
    newUpdate;
    req.flash('msg', 'Data contact berhasil di ubah')
    res.redirect('/contact');
  }


});

// membuat Detail per contacts
app.get('/contact/:name', (req, res) => {
  const name = req.params.name;
  // Mencari detail per name isi datanya di database
  const sql = `SELECT * FROM contacts WHERE name = '${name}'`;
  pool.query(sql, (err, result) => {

    res.render('detail', {
      title: 'Detail',
      layout: "layout/main-layout",
      contact: result.rows[0]
    })
  })

})

// jika tidak ada req get error
app.use('/', (req, res) => {
  res.status(404)
  res.send('Page Not found : 404')
})
// cek port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})