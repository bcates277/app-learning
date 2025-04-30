import express from 'express';
import path from 'path';
import multer from 'multer';
import { Client } from 'pg';
import { loadDBConfig } from './loadSecrets'; // Adjust the import path as necessary


const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads (temporary storage)
const upload = multer({ dest: 'uploads/' });

// Serve the HTML form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize the PostgreSQL client
let dbClient: Client;

async function initDB() {
  const secretName = process.env.SECRET_NAME || 'my-db-secret';
  const dbConfig = await loadDBConfig(secretName);

  dbClient = new Client(dbConfig);
  await dbClient.connect();
}

// Handle form submissions
app.post('/submit', upload.single('fileInput'), async (req, res): Promise<void> => {
  const { textInput } = req.body;
  const { file } = req;

  if (!textInput || !file) {
    res.status(400).send('Text input and file are required!');
    return; // Return early to avoid further code execution
  }

  try {
    const query = 'INSERT INTO submissions (text, file_path) VALUES ($1, $2)';
    await dbClient.query(query, [textInput, file.path]);

    res.send('Data submitted successfully!');
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send('Error submitting data');
  }
});

// Start the server after DB is ready
initDB()
  .then(() => {
    app.listen(3000, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:3000`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
