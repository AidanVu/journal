const express = require("express");
const router = express.Router();

// Display all poems
router.get("/", async (req, res) => {
  try {
    const poems = await req.db.collection("poems").find().toArray();
    res.render("home", { poems });
  } catch (err) {
    res.status(500).send("Error fetching poems");
  }
});

// Display form to create a new poem
router.get("/create", (req, res) => {
  res.render("create");
});

// Handle form submission to create a new poem
router.post("/", async (req, res) => {
  try {
    const { title, content } = req.body;
    await req.db.collection("poems").insertOne({ title, content, createdAt: new Date() });
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Error creating poem");
  }
});

// Display form to edit a poem
router.get("/edit/:id", async (req, res) => {
  try {
    const poem = await req.db.collection("poems").findOne({ _id: new req.ObjectId(req.params.id) });
    res.render("edit", { poem });
  } catch (err) {
    res.status(500).send("Error loading edit form");
  }
});

// Handle form submission to update a poem
router.post("/edit/:id", async (req, res) => {
  try {
    const { title, content } = req.body;
    await req.db.collection("poems").updateOne(
      { _id: new req.ObjectId(req.params.id) },
      { $set: { title, content } }
    );
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Error updating poem");
  }
});

// Handle deleting a poem
router.post("/delete/:id", async (req, res) => {
  try {
    await req.db.collection("poems").deleteOne({ _id: new req.ObjectId(req.params.id) });
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Error deleting poem");
  }
});

module.exports = router;