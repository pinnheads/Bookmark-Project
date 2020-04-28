const ejs = require('ejs'),
      got = require('got'),
      express = require('express'),
      mongoose = require('mongoose'),
      bodyParser = require('body-parser'),
      metascraper = require('metascraper')([
                    require('metascraper-logo')(),
                    require('metascraper-logo-favicon')(),
                    require('metascraper-title')(),
                    require('metascraper-url')()
      ]);

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
const List = mongoose.model("List", linkListSchema);

// Home GET Route
app.get("/",function(req, res){

  List.find( function(err, lists) {
    if(err){
      console.log(err);
    } else {
      res.render("home", {lists: lists});
    }
  });

});

// Home POST Route
app.post("/", async function(req, res){
  const url = req.body.url;

  // Get list ID
  const listID = req.body.listID;

  // Get title, favicon link and url
  const targetUrl = url;(async () => {
  const { body: html, url } = await got(targetUrl)
  const metadata = await metascraper({ html, url })
  if(metadata.logo === null){
    const newItem = new Link({
      href: metadata.url,
      name: metadata.title,
      linkIcon: "images/error.svg"
    });
    // Search for the list & Save the new Item in the list
    List.findOne({_id: listID}, function(err, foundList){
      if(err){
        console.log(err);
      } else {
        foundList.links.push(newItem);
        foundList.save();
        console.log("Saved and Updated!!");
        res.redirect("/");
      }
    });
  // Save the new item in DB
  } else {
    const newItem = new Link({
          href: metadata.url,
          name: metadata.title,
          linkIcon: metadata.logo
    });
    // Search for the list & Save the new Item in the list
    List.findOne({_id: listID}, function(err, foundList){
      if(err){
        console.log(err);
      } else {
        foundList.links.push(newItem);
        foundList.save();
        console.log("Saved and Updated!!");
        res.redirect("/");
      }
    });
  }
})()
});

// Route to save a new List
app.post("/newList", function(req,res){
  // console.log(req.body);
  const newListName = req.body.newListName;
  const newList = new List({
    name: newListName,
    links: []
  })
  newList.save();
  res.redirect("/");
});

app.get("/list/:listName", function(req, res){
  const requestedList = req.params.listName;
  List.findOne({_id: requestedList}, function(err, foundList){
    if(err){
      console.log(err);
    } else {
      res.render("listView", {listID: requestedList, foundListTitle: foundList.name, links: foundList.links});
    }
  });
});

app.post("/list", function(req, res){
  const listID = req.body.listID;
  res.redirect("/list/"+listID);
});

app.post("/delete", function(req, res){
  const linkID = req.body.linkID;
  const listID = req.body.listID;
  List.findOneAndUpdate({_id: listID}, {"$pull": {"links": {"_id": linkID}}},function(err, foundList){
    if(!err){
      res.redirect("/list/"+listID);
    }
  });
});

app.post("/deleteList", function(req, res){
  List.findByIdAndDelete(req.body.listID, function(err){
    if(err) {
      console.log(err);
    } else {
      console.log("Deleted List");
      res.redirect("/");
    }
  });
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server active and listening on port 3000....");
})