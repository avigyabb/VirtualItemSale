import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";

let DATABASE_NAME = "cs193x_assign4";

/* Do not modify or remove this line. It allows us to change the database for grading */
if (process.env.DATABASE_NAME) DATABASE_NAME = process.env.DATABASE_NAME;

const api = express.Router();
let conn = null;
let db = null;
let Users = null;
let Posts = null;

const initAPI = async app => {
  app.set("json spaces", 2);
  app.use("/api", api);

  //TODO: Initialize database connection
  conn = await MongoClient.connect("mongodb://localhost");
  db = conn.db(DATABASE_NAME);
  Users = db.collection("users");
  Posts = db.collection("posts");
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ db: DATABASE_NAME });
});

//TODO: Add endpoints
api.get("/users", async (req, res) => {
  let users = await Users.find().toArray();
  res.json({ users });
});

api.get("/users/:id", async (req, res) => {
  let id = req.params.id;
  let user = await Users.findOne({ id });
  if (!user) {
    res.status(404).json({ error: `No user with ID ${id}` });
    return;
  } else {
    res.json({ user });
  }
})

api.post("/users", async (req, res) => {
  let id = req.body.id;
  let newUser = {
    id: id,
    name: id,
    avatarURL: "images/default.png",
    following: [],
    acceptedItems: [],
    itemHistory: []
  }
  let sameUsers = await Users.find({ id });
  if (!id || id === "") {
    res.status(400).json({ error: "ID is empty" });
  } else if (sameUsers.length > 0) { 
    res.status(400).json({ error: "User already exists!" });
  } else {
    await Users.insertOne({
      id: id,
      name: id,
      avatarURL: "images/default.png",
      following: [],
      acceptedItems: [],
      itemHistory: []
    });
    res.json(newUser);
  }
});

api.patch("/users/:id", async (req, res) => {
  let id = req.params.id;
  let update = req.body;
  let user = await Users.findOne({ id });
  if (!user) {
    res.status(404).json({ error: "User does not exist"});
  }
  if (update.name === "") {
    user.name = user.id;
  } else if (!update.name) {
    user.name = user.name;
  } else { 
    user.name = update.name;
  }
  if (update.avatarURL === "") {
    user.avatarURL = "images/default.png";
  } else if (!update.avatarURL) {
    user.avatarURL = user.avatarURL;
  } else { 
    user.avatarURL = update.avatarURL;
  }
  await Users.replaceOne({ id: id }, user);
  delete user._id;
  res.json(user);
});

api.get("/users/:id/feed", async (req, res) => {
  console.log("this ran");
  let id = req.params.id;
  let user = await Users.findOne({ id });
  if (!user) {
    res.status(404).json({ error: `No user with ID ${id}` });
    return;
  } else {
    let output = [];
    let feedUsers = user.following;
    feedUsers.push(id);
    for (let follower of feedUsers) {
      let feed = await Posts.find({userId: follower}).toArray();
      console.log("FEED");
      console.log(feed);
      let user = await Users.findOne({id: follower});
      delete user._id;
      delete user.following;
      for (let post of feed) {
        post.user = user;
        //delete post.userId;
        //delete post._id;
      }
      output = output.concat(feed);
    }
    output.sort((firstEl, secondEl) => {
      return secondEl.time - firstEl.time;
    });
    console.log(output);
    res.json(output);
  }
})

api.post("/users/:id/posts", async (req, res) => {
  let text = req.body.text;
  let price = req.body.price;
  let image = req.body.image;
  let id = req.params.id;
  let users = await Users.find({ id }).toArray();
  if (users.length === 0) {
    res.status(404).json({ error: "User does not exist" });
  } else if (text === "" || !text) {
    res.status(400).json({ error: "Empty text"});
  } else {
    await Posts.insertOne({
      userId: id,
      time: new Date(),
      text: text,
      price: price,
      image: image
    });
    res.json({ "success": true });
  }
});

api.post("/users/:id/follow", async (req, res) => {
  let target = req.query.target;
  let id = req.params.id;
  let user = await Users.findOne({ id });
  let targetUser = await Users.findOne({id: target });
  if (!target || target === "") {
    res.status(400).json({ error: "Target is empty" });
  } else if (!targetUser || !user) {
    res.status(404).json({ error: "Empty text"});
  } else if (user.following.includes(target)) {
    res.status(400).json({ error: "User is already following this target"});
  } else if (id === target) {
    res.status(400).json({error: "User is trying to follow themself"});
  } else {
    user.following.push(target);
    await Users.replaceOne({ id: id }, user);
    delete user._id;
    res.json({ "success": true });
  }
});

api.delete("/users/:id/follow", async (req, res) => {
  let target = req.query.target;
  let id = req.params.id;
  let user = await Users.findOne({ id });
  if (!target || target === "") {
    res.status(400).json({ error: "Target is empty" });
  } else if (!user) {
    res.status(404).json({ error: "User does not exist"});
  } else if (!user.following.includes(target)) {
    res.status(400).json({ error: "User does not follow target"});
  } else {
    const index = user.following.indexOf(target);
    user.following.splice(index, 1);
    await Users.replaceOne({ id: id }, user);
    delete user._id;
    res.json({ "success": true });
  }
});

api.post("/users/:id/item", async (req, res) => {
  let target = new ObjectId(req.query.target);
  let id = req.params.id;
  let user = await Users.findOne({ id });
  let post = await Posts.findOne({_id : target});
  if (user.acceptedItems.includes(post)) {
    alert("User has already accepted this item!");
    res.status(400).json({ error: "User has already accepted this item!"});
  } else {
    user.acceptedItems.push(post);
    await Users.replaceOne({ id: id }, user);
    await Posts.deleteOne({_id: target});
    console.log("Item Added");
    console.log(user);
    console.log(post);
    res.json({ "success": true });
  }
})

api.delete("/users/:id/item", async (req, res) => {
  console.log("DELETED");
  let target = req.query.target;
  let id = req.params.id;
  let user = await Users.findOne({ id });
  for (let item of user.acceptedItems) {
    if (JSON.stringify(item._id) === JSON.stringify(target)) {
      console.log("FOUND");
      console.log(item);
      const index = user.acceptedItems.indexOf(item);
      user.acceptedItems.splice(index, 1);
      await Users.replaceOne({ id: id }, user);
      res.json({ "success": true });
    }
  }

});

api.get("/users/:id/posts", async (req, res) => {
  console.log("JFKLDJSDL:JDFKL this ran");
  let id = req.params.id;
  let user = await Users.findOne({ id });
  let output = [];
  if (!user) {
    res.status(404).json({ error: `No user with ID ${id}` });
    return;
  } else {
    let feed = await Posts.find({userId: id}).toArray();
    for (let post of feed) {
      output.push(post.text + " for $" + post.price + " on " + post.time)
    }
    console.log(output);
    res.json(output);
  }
})

/* Catch-all route to return a JSON error if endpoint not defined */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});

export default initAPI;
