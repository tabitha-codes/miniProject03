// ===========SEED THE DATABASE===========
// Run with: npm run seed
// Gets every character from the Rick and Morty API and saves them in my rickAndMortyDB database.
// It only clears the characters collection in rickAndMortyDB. Nothing else is touched.
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./dbConnect");
const Character = require("./models/character");

const API_URL = "https://rickandmortyapi.com/api/character";

// ===========SAFETY CHECK===========
// Stops if .env points to a different database, so I can't wipe my other projects by mistake.
const checkDatabaseName = () => {
  if (mongoose.connection.name !== "rickAndMortyDB") {
    console.log(`Stopped: connected to "${mongoose.connection.name}", not "rickAndMortyDB".`);
    process.exit(1);
  }
};

// ===========GET ONE PAGE FROM THE API===========
const fetchPage = async (url) => {
  // Give up after 10 seconds so it doesn't hang
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Rick and Morty API error: ${response.status}`);
  return response.json();
};

// ===========API DATA -> MY MODEL===========
const toCharacter = (c) => ({
  apiId: c.id,
  name: c.name,
  status: c.status,
  species: c.species,
  type: c.type,
  gender: c.gender,
  origin: c.origin.name,
  location: c.location.name,
  image: c.image,
  episodeCount: c.episode.length,
});

const seed = async () => {
  await connectDB();
  checkDatabaseName();

  try {
    // The API sends 20 characters per page. info.next is the next page, or null on the last one.
    const characters = [];
    let url = API_URL;
    while (url) {
      const data = await fetchPage(url);
      characters.push(...data.results.map(toCharacter));
      console.log(`Got ${characters.length} of ${data.info.count} characters`);
      url = data.info.next;
    }

    // I clear the old characters AFTER the fetch works, so a failed fetch doesn't leave it empty
    await Character.deleteMany({});
    await Character.insertMany(characters);
    console.log(`Saved ${characters.length} characters to rickAndMortyDB`);
  } catch (error) {
    console.log("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
