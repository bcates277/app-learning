"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const pg_1 = require("pg");
const loadSecrets_1 = require("./loadSecrets"); // Adjust the import path as necessary
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware to parse JSON and serve static files
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Set up multer for file uploads (temporary storage)
const upload = (0, multer_1.default)({ dest: 'uploads/' });
// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
// Initialize the PostgreSQL client
let dbClient;
function initDB() {
    return __awaiter(this, void 0, void 0, function* () {
        const secretName = process.env.SECRET_NAME || 'my-db-secret';
        const dbConfig = yield (0, loadSecrets_1.loadDBConfig)(secretName);
        dbClient = new pg_1.Client(dbConfig);
        yield dbClient.connect();
    });
}
// Handle form submissions
app.post('/submit', upload.single('fileInput'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { textInput } = req.body;
    const { file } = req;
    if (!textInput || !file) {
        res.status(400).send('Text input and file are required!');
        return; // Return early to avoid further code execution
    }
    try {
        const query = 'INSERT INTO submissions (text, file_path) VALUES ($1, $2)';
        yield dbClient.query(query, [textInput, file.path]);
        res.send('Data submitted successfully!');
    }
    catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Error submitting data');
    }
}));
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
