const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 5000;
const router = express.Router();
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport')
,LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');
const jwt = require('jsonwebtoken');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('keyboard cat'));
router.use(session({secret: 'keyboard cat'}));
router.use(passport.initialize());
router.use(passport.session());

app.use(cors({
  origin : true,
  credentials : true
}));
app.use(cookieParser());
app.use(
  session({
    key : "memberInfo",
    sercre :"memberSecret",
    resave : false,
    saveUninitialized : false,
    cookie : {
      expires: 60 * 60 * 24,
    },  
  })
);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true}));
// app.use(cors());



//  BLUEHOST DATABASE 접속 관련 코드 Start
const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');
const { sign } = require('crypto');

const connection = mysql.createConnection({
    host : conf.host,
    user : conf.user,
    password : conf.password,
    port : conf.port,
    database : conf.database
})

connection.connect();
//  BLUEHOST DATABASE 접속 관련 코드 End

// app.get('/api/Login', (req, res) => {
//     connection.query(
//         "SELECT * FROM Members",
//         (err, rows, fields) => {
//             res.send(rows);
//         }
//     );

// });

app.post('/api/checkEmail', (req, res) => {
  let Email = req.body.Email; // Login.js로부터 받은 데이터 
  let sql = `SELECT email from Members where email='${Email}';`
  //SQL 질의 
  connection.query(sql, function(err, rows, fields){
    let checkEmail = '';   
    if(rows != 0){ //Email이 이미 가입된 이메일이라면 
      checkEmail = 'exist';
    }else{ //Email이 아직 가입되지 않은 이메일이라면 
      checkEmail = '!exist';
    }
    res.send(checkEmail);
  })
})
app.post('/api/signup', (req, res) => {
  let signupInfo = req.body;
  let sql = `INSERT INTO Members
  (
    Email, Date, Name, FirstPW, Tel, Address, customerOption
  )
  VALUES
  (
   '${signupInfo.Email}',
   '${signupInfo.Date}',
   '${signupInfo.Name}',
   '${signupInfo.FirstPW}',
   '${signupInfo.Tel}',
   '${signupInfo.Address}',
   '${signupInfo.customerOption}'
  );`
  connection.query(sql,function(err, rows, fields){
    if(rows){
      res.send(signupInfo)
    }else{
      res.send(err)
    }
  })
  // res.send(signupInfo);
})
//이메일 로그인 시 비밀번호 체크 
app.post('/api/Login', (req,res)=>{
  let getMembersData = req.body;
  let sql=`SELECT FirstPW from Members WHERE Email='${getMembersData.Email}'`
    
  connection.query(sql,function(err, rows, fields){
    if(rows[0].FirstPW===getMembersData.FirstPW){
      const token = jwt.sign({
        user_id: rows[0].id,
        user_Email: rows[0].Email,
        user_Date:rows[0].Date,
        user_FirstPW:rows[0].FirstPW,
        user_Tel:rows[0].Tel,
        user_customerOption :rows[0].customerOption,
        user_customerOption :rows[0].profileImg
        }, "SECRET_KEY", {
        expiresIn: '1h'
        });
       res.cookie('user',token);
       res.send([true, token]);
    }else if(rows[0].FirstPW!=getMembersData.FirstPW){
      res.send(false);
    }else{
      res.send(err);
    }
  })
})

//소셜 로그인 시 ID체크 
app.post('/api/socialLoginCheck',(req, res)=>{
  let getMemberId = req.body.Id;
  let sql = `SELECT Id from Members WHERE Id='${getMemberId}'`;
  
  connection.query(sql,function(err,rows,fields){
    let checkSocialId = '';   
    if(rows[0].Id === getMemberId){ //Email이 이미 가입된 이메일이라면 
      checkSocialId = 'exist';
    }else{ //Email이 아직 가입되지 않은 이메일이라면 
      checkSocialId = '!exist';
    }
    res.send(checkSocialId);
  })
})

app.post('/api/getMemberinfo', (req,res)=>{
  let getEmail = req.body.Email;
  let sql=`SELECT * from Members WHERE Email='${getEmail}'`
  connection.query(sql,function(err, rows, fields){
    let result = rows;
    res.send(result);
  })
})
app.post('/api/socialSignup', (req,res)=>{
  let getMemberInfo = req.body;
  let sql =
    `REPLACE INTO Members (
       Id,
       Email,
       Date,
       Name,
       Tel,
       Address,
       customerOption,
       profileImg,
       AccessToken
    )
     VALUE(
       '${getMemberInfo.Id}',
       '${getMemberInfo.Email}',
       '${getMemberInfo.Date}',
       '${getMemberInfo.Name}',
       '${getMemberInfo.Tel}',
       '${getMemberInfo.Address}',
       '${getMemberInfo.customerOption}',
       '${getMemberInfo.profileImg}',
       '${getMemberInfo.AccessToken}' ) 
      ;`
  ;
  connection.query(sql,function(err, rows, fields){    
    if(err){
      res.send(false)
    }else{
      res.send(true);
    }
  })
})
app.listen(port, () => console.log(`Listening on port ${port}`));


 // if(rows[0] === undefined) {
    //   checkEmail = true;
    //   res.send(checkEmail);
    // }
    // else {
    //   checkEmail = false ; 
    //   res.send(checkEmail);
    // }