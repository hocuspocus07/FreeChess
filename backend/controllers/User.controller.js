import User from "../models/User.models.js";

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ message: "Please enter username, email, and password." });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create(username, email, password);
    res.status(201).json({ message: "User registered successfully!", newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!password || !username) {
      res.status(400).json({ message: "Please enter email and password." });
    }
    const user = await User.findByUsername({ username });
    if (!user) {
      res.status(401).json({ message: "User not found" });
    }
    const isPasswordValid = await User.isPasswordCorrect(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    console.log("LOGIN SUCCESS!");
  } catch (error) {
    res.status(500).json({ message: "ERROR OCCURED: ", error: error.message });
  }
};
