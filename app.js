const express = require('express');
const app = express();

const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('./models/user');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const upload = require('./config/multer');



app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));







app.get('/', (req,res)=>{
    console.log(req.cookies);
    res.render('index');
})

app.get('/profileupload', isLoggedIn,(req,res)=>{
    console.log(req.cookies);
    res.render('profileupload');
})

app.post('/uploadprofilepic', isLoggedIn,upload.single('image') , async(req,res)=>{
    
    // console.log(req.file.filename);

    let user = await userModel.findOne({email: req.user.email});

    user.pic = req.file.filename;
    await user.save();
    res.redirect('profile');

    
})



app.get('/edit/:id', isLoggedIn, async(req,res)=>{
    let post = await postModel.findOne({_id: req.params.id});
    let user = await userModel.findOne({_id: req.user.userId}).populate("posts");
    res.render('edit', {user: user, post:post});

})

app.post('/update/:id', isLoggedIn, async(req,res)=>{
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.new_details});
    
    res.redirect('/profile');

})

app.get('/login',(req,res)=>{
    res.render('login');
})

app.get('/logout', (req,res)=>{
    res.cookie("token", "");
    res.redirect("/login");
})

app.get('/like/:id', isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userId) === -1){
        post.likes.push(req.user.userId);
    }
    else{
        
        post.likes.splice(post.likes.indexOf(req.user.userId), 1);

    }

    
    await post.save();
    // res.send("Liked!")
    res.redirect("/profile");

})





app.get('/profile', isLoggedIn, async(req,res)=>{
    // console.log(req.user);
    const user = await userModel.findOne({_id: req.user.userId}).populate("posts");
    // console.log(user);
    res.render('profile', {user:user});
})

app.post('/post', isLoggedIn, async(req,res)=>{
    // console.log(req.user);
    let user = await userModel.findOne({_id: req.user.userId});
    // console.log(user);
    let {details} = req.body;
    let post = await postModel.create({
        user: user._id,
        content: details
    }) 
    
    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
})

app.post('/register', async(req,res)=>{
    const {name, username, age, email, password} = req.body;
    let user = await userModel.findOne({email: email});

    if(user) return res.status(500).send("User already exists");
    
    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password, salt, async(err, hash)=>{
            let user = await userModel.create({
                username, name, email, age, password: hash
            })

            let token = jwt.sign({email: email, userId: user._id}, "foo");
            res.cookie("token", token);
            res.send("Registered!");
        })
    })


    
})

app.post('/login', async(req,res)=>{
    const {email, password} = req.body;
    let user = await userModel.findOne({email: email});

    if(!user) return res.status(500).send("Invalid credentials");

    bcrypt.compare(password, user.password, (err, result)=>{
        if(result) {
            let token = jwt.sign({email: email, userId: user._id}, "foo");
            res.cookie("token", token);
            // res.status(200).send("You are logged in");
            res.redirect('/profile');
        }
        else {
            // alert('Invalid credentials');
            res.redirect('/login');
        }
    })
    
    


    
})

// middleware to check if user is logged in
function isLoggedIn(req,res,next){
    if(req.cookies.token === "") {
        res.redirect("/login");
    }
    else{
        let data = jwt.verify(req.cookies.token, "foo");
        req.user = data;
        next();
    }
    

}


const port = 3000;
app.listen(port, ()=>{
    console.log(`Server started at port ${port}`);
})