const ejs = require('ejs'),
      express = require('express'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser');

const metascraper = require('metascraper')([
  require('metascraper-logo')(),
  require('metascraper-logo-favicon')(),
  require('metascraper-title')(),
  require('metascraper-url')()
])

const got = require('got');

const app = express();

mongoose.connect('mongodb://localhost:27017/bookmarkDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

const linkSchema = {
  href: String,
  name: String,
  linkIcon: String
}

const linkListSchema = {
  name: String,
  links: [linkSchema]
}

const Link = mongoose.model("Link", linkSchema);

app.get("/",function(req, res){
  Link.find(function(err, links){
    if(err){
      console.log(err);
    } else {
      console.log(links);
      res.render("home",{links: links});
    }
  });
});

app.post("/", async function(req, res){
  console.log(req.body);
  const url = req.body.url;
  const targetUrl = url;(async () => {
  const { body: html, url } = await got(targetUrl)
  const metadata = await metascraper({ html, url })
  if(metadata.logo === null){
    const newItem = new Link({
    href: metadata.url,
    name: metadata.title,
    linkIcon: "images/error.svg"
  });
  newItem.save(function(err){
    if(err){
      console.log(err);
    } else {
      console.log("Successfully saved: "+url);
      res.redirect("/");
    }
  });
  } else {
    const newItem = new Link({
    href: metadata.url,
    name: metadata.title,
    linkIcon: metadata.logo
  });
  newItem.save(function(err){
    if(err){
      console.log(err);
    } else {
      console.log("Successfully saved: "+url);
      res.redirect("/");
    }
  });
  }
})()
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server active and listening on port 3000....");
})