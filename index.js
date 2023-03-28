const express=require('express');
const app=express();
const path=require('path');
const mongoose=require('mongoose');
const Auth=require('./model/modelAuth');
const bcrypt=require('bcrypt');
const session=require('express-session');
const MongoDBStore=require('express-mongodb-session')(session);

mongoose.connect('mongodb://127.0.0.1:27017/Auth').then(()=>{
    console.log("DB connected");
}).catch((err)=>{
    console.log(err);
});

const store = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/Auth',
    collection: 'mySessions'
});
store.on('error', function(error) {
    console.log(error);
});

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret:'secret',
    resave:true,
    store:store,
    saveUninitialized:true
}));

app.get('/',(req,res)=>{
    res.send('Connected');
})

app.get('/register',(req,res)=>{
    res.render('signup');
})

app.post('/register',async(req,res)=>{
    const {username,password}=req.body;
    const salt=await bcrypt.genSalt(10);
    const hash=await bcrypt.hash(password,salt);
    await Auth.create({username,password:hash});
    res.redirect('/sign_in');
})

app.get('/sign_in',(req,res)=>{
    res.render('signin');
})

app.post('/sign_in',async(req,res)=>{
    const {username,password}=req.body;
    const user=await Auth.findOne({username});
    if(!user){
        return res.redirect('/register');
    }
    else{
        if(await bcrypt.compare(password,user.password)){
            req.session.userid=user.id;
            res.redirect('/success');
        }
        else{ 
            res.send('fail');
        }
    }
})

let requireLogin=(req,res,next)=>{
    if(!req.session.userid){
        res.redirect("/sign_in");
    }
    next();
}

app.get('/success',requireLogin,(req,res)=>{
    res.render("Dashboard");
})

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/sign_in'); 
})

app.listen(5000,()=>{
    console.log("Connected");
})