const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Validation
const validateProfileInput = require("../../validation/profile");

// Load Profile Model
const Profile = require("../../models/Profile");
// Load User Profile Model
const User = require("../../models/User");

// @route       GET api/profile/test
// @description Tests profile route
// @access      Public

router.get("/test", (req, res) => res.json({ msg: "Profile works" }));

// @route       GET api/profile
// @description Get current users profile
// @access      Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route       GET api/profile/all
// @description Get all profile
// @access      Public
router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = "There are no profiles";
        return res.status(404).json(errors);
      }

      res.json(profiles);
    })
    .catch(err => res.status(404).json({ noprofile: "There are no profile" }));
});

// @route       GET api/profile/handle/:handle
// @description Get profile by handle
// @access      Public

router.get("/handle/:handle", (req, res) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route       GET api/profile/user/:id
// @description Get profile user by user ID
// @access      Public

router.get("/user/:user_id", (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

// @route       POST api/profile/
// @description Create or updating user profile
// @access      Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    // Get fields
    const profileField = {};
    profileField.user = req.user.id;
    if (req.body.handle) profileField.handle = req.body.handle;
    if (req.body.company) profileField.company = req.body.company;
    if (req.body.website) profileField.website = req.body.website;
    if (req.body.location) profileField.location = req.body.location;
    if (req.body.bio) profileField.bio = req.body.bio;
    if (req.body.status) profileField.status = req.body.status;
    if (req.body.githubusername)
      profileField.githubusername = req.body.githubusername;
    // Skills - Split it into an array
    if (typeof req.body.skills !== "undefined") {
      profileField.skills = req.body.skills.split(",");
    }

    // Social
    profileField.social = {};
    if (req.body.youtube) profileField.social.youtube = req.body.youtube;
    if (req.body.twitter) profileField.social.twitter = req.body.twitter;
    if (req.body.facebook) profileField.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileField.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileField.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileField },
          { new: true }
        )
          .then(profile => res.json(profile))
          .catch(err => console.log(err));
      } else {
        // Create

        // Check if handle exists
        Profile.findOne({ handle: profileField.handle }).then(profile => {
          if (profile) {
            errors.handle = "That handle already exists";
            res.status(400).json(errors);
          }

          // Save Profile
          new Profile(profileField).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

module.exports = router;
